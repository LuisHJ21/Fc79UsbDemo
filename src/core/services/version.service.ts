import { VersionInfo } from "@/infraestructure/interfaces/version.interface";
import { axiosClient } from "../API/API";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * El backend guarda downloadUrl como ruta relativa de IIS
 * ("/pallets/api/updates/pallet-v1.0.1.apk") para no quedar atado a una IP.
 * Aca se la vuelve absoluta usando el mismo host de la API.
 */
const normalizeDownloadUrl = (downloadUrl: string): string => {
  if (/^https?:\/\//i.test(downloadUrl)) return downloadUrl;
  if (!API_URL) return downloadUrl;

  // Se extrae el origen con regex y no con new URL().origin: el polyfill de URL
  // en React Native es parcial y origin puede venir undefined, lo que generaria
  // una URL "undefined/pallets/..." que falla en la descarga.
  const match = API_URL.match(/^(https?:\/\/[^/]+)/i);
  if (!match) return downloadUrl;

  const origin = match[1];
  const ruta = downloadUrl.replace(/\\/g, "/");

  return ruta.startsWith("/") ? `${origin}${ruta}` : `${origin}/${ruta}`;
};

/**
 * Consulta la version publicada en el backend.
 * Devuelve null si no hay red o el backend no responde: la app debe seguir
 * funcionando aunque el chequeo de actualizacion falle.
 */
export const ConsultarVersionServidor = async (): Promise<VersionInfo | null> => {
  try {
    const url = `version`;
    const peticion = await axiosClient.post(url, {
      operacion: "check",
    });

    const data = peticion.data;
    if (data?.result !== "ok" || !data?.data) return null;

    return {
      ...data.data,
      downloadUrl: normalizeDownloadUrl(data.data.downloadUrl),
    };
  } catch {
    // Silencioso a proposito: no se registra en el log de errores porque
    // un equipo sin red mostraria un error en cada arranque.
    return null;
  }
};
