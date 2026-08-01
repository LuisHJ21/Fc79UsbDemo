import { ConsultarVersionServidor } from "@/core/services/version.service";
import type { UpdateState } from "@/infraestructure/interfaces/version.interface";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";
// La API moderna todavia no expone progreso de descarga, por eso la descarga
// usa createDownloadResumable de legacy. El resto (ruta, borrado, contentUri)
// si usa la API nueva de SDK 55.
import { createDownloadResumable } from "expo-file-system/legacy";
import { startActivityAsync } from "expo-intent-launcher";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

const INITIAL: UpdateState = {
  checking: false,
  hasUpdate: false,
  versionInfo: null,
  modalVisible: false,
  downloading: false,
  downloadProgress: 0,
  error: null,
};

const APK_LOCAL = "pallet-update.apk";

// ============== Compara versiones semanticas "1.0.10" > "1.0.9".
function esMasNueva(actual: string, servidor: string): boolean {
  const parse = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);
  const a = parse(actual);
  const b = parse(servidor);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (b[i] ?? 0) - (a[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }

  return false;
}

export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>(INITIAL);

  // ============== nativeAppVersion es la version real del APK instalado. expoConfig.version
  const currentVersion =
    Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? "1.0.0";

  const checkForUpdate = useCallback(async () => {
    if (Platform.OS === "web") return;

    setState((s) => ({ ...s, checking: true, error: null }));

    const info = await ConsultarVersionServidor();
    if (!info) {
      setState((s) => ({ ...s, checking: false }));
      return;
    }

    const hasUpdate = esMasNueva(currentVersion, info.version);
    setState((s) => ({
      ...s,
      checking: false,
      hasUpdate,
      versionInfo: info,
      modalVisible: hasUpdate,
    }));
  }, [currentVersion]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  const downloadAndInstall = useCallback(async () => {
    if (!state.versionInfo?.downloadUrl || Platform.OS !== "android") return;

    setState((s) => ({
      ...s,
      downloading: true,
      downloadProgress: 0,
      error: null,
    }));

    const url = state.versionInfo.downloadUrl;

    try {
      // ============== Avisar si la URL es invalida
      if (!/^https?:\/\//i.test(url)) {
        throw new Error(`URL de descarga invalida: ${url}`);
      }

      console.log("[update] descargando", url);

      // ============== Se guarda en cache: si la instalacion falla
      const apk = new File(Paths.cache, APK_LOCAL);
      if (apk.exists) apk.delete();

      const task = createDownloadResumable(
        url,
        apk.uri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          const progress =
            totalBytesExpectedToWrite > 0
              ? totalBytesWritten / totalBytesExpectedToWrite
              : 0;
          setState((s) => ({ ...s, downloadProgress: progress }));
        },
      );

      const result = await task.downloadAsync();
      if (!result?.uri) throw new Error("La descarga no produjo archivo");

      if (result.status !== 200) {
        throw new Error(
          `El servidor respondio ${result.status} al descargar el APK`,
        );
      }

      const descargado = new File(result.uri);
      console.log("[update] descargado", descargado.size, "bytes");

      // ============== Abre el instalador del sistema y el usuario confirma
      try {
        await startActivityAsync("android.intent.action.VIEW", {
          data: descargado.contentUri,
          flags: 1,
          type: "application/vnd.android.package-archive",
        });
      } catch (errInstall: any) {
        console.log("[update] Fallo el Instalador", errInstall?.message);
        await startActivityAsync(
          "android.settings.MANAGE_UNKNOWN_APP_SOURCES",
          { data: `package:${Application.applicationId}` },
        );
        throw new Error(
          "Habilita 'Instalar apps desconocidas' para PALLET AUTO y vuelve a intentar.",
        );
      }

      setState((s) => ({
        ...s,
        downloading: false,
        modalVisible: false,
        hasUpdate: false,
      }));
    } catch (err: any) {
      const detalle = err?.message ?? String(err);
      console.log("[update] error:", detalle);
      setState((s) => ({
        ...s,
        downloading: false,
        error: detalle,
      }));
    }
  }, [state.versionInfo]);

  const dismissModal = useCallback(() => {
    // En una actualizacion obligatoria el modal no se puede cerrar.
    if (state.versionInfo?.mandatory) return;
    setState((s) => ({ ...s, modalVisible: false }));
  }, [state.versionInfo?.mandatory]);

  return {
    ...state,
    currentVersion,
    checkForUpdate,
    downloadAndInstall,
    dismissModal,
  };
}
