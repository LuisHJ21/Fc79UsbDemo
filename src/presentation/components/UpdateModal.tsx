import type { VersionInfo } from "@/infraestructure/interfaces/version.interface";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

interface Props {
  visible: boolean;
  currentVersion: string;
  versionInfo: VersionInfo | null;
  downloading: boolean;
  downloadProgress: number;
  error: string | null;
  onDownload: () => void;
  onDismiss: () => void;
}

export const UpdateModal = ({
  visible,
  currentVersion,
  versionInfo,
  downloading,
  downloadProgress,
  error,
  onDownload,
  onDismiss,
}: Props) => {
  if (!versionInfo) return null;

  const obligatoria = versionInfo.mandatory;
  const porcentaje = Math.round(downloadProgress * 100);

  // Solo los cambios de la version que se va a instalar.
  const cambios =
    versionInfo.changelog?.find((c) => c.version === versionInfo.version)
      ?.changes ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // En actualizacion obligatoria el boton atras no debe cerrar el modal.
      onRequestClose={obligatoria ? undefined : onDismiss}
    >
      <View className="flex-1 bg-gray-600/30 backdrop-blur-sm justify-center items-center px-4">
        <Animated.View
          entering={ZoomIn.duration(400)}
          className="w-full max-w-md bg-white rounded-md overflow-hidden"
        >
          {/* HEADER */}
          <View className="h-14 bg-blue-600 flex-row items-center px-5">
            <Text className="text-white font-bold uppercase text-lg">
              {obligatoria ? "Actualización obligatoria" : "Nueva versión"}
            </Text>
          </View>

          {/* BODY */}
          <View className="p-4">
            <Text className="text-black text-base">
              Versión instalada:{" "}
              <Text className="font-bold">{currentVersion}</Text>
            </Text>
            <Text className="text-black text-base mb-3">
              Versión disponible:{" "}
              <Text className="font-bold text-blue-600">
                {versionInfo.version}
              </Text>
            </Text>

            {cambios.length > 0 && (
              <View className="mb-3">
                <Text className="text-black font-bold mb-1">Novedades:</Text>
                <ScrollView className="max-h-32">
                  {cambios.map((cambio, i) => (
                    <Text key={i} className="text-gray-700 text-sm">
                      • {cambio}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}

            {downloading && (
              <View className="mb-3">
                <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-3 bg-blue-600"
                    style={{ width: `${porcentaje}%` }}
                  />
                </View>
                <Text className="text-center text-gray-600 text-sm mt-1">
                  Descargando… {porcentaje}%
                </Text>
              </View>
            )}

            {error && (
              <Text className="text-red-600 text-sm mb-3 text-center">
                {error}
              </Text>
            )}

            {/* ACCIONES */}
            <View className="flex-row justify-end gap-3 mt-1">
              {!obligatoria && !downloading && (
                <Pressable
                  onPress={onDismiss}
                  className="px-4 py-2 rounded-md bg-gray-200"
                >
                  <Text className="text-gray-800 font-bold uppercase">
                    Después
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={onDownload}
                disabled={downloading}
                className={`px-4 py-2 rounded-md ${
                  downloading ? "bg-blue-300" : "bg-blue-600"
                }`}
              >
                <Text className="text-white font-bold uppercase">
                  {downloading ? "Descargando…" : "Actualizar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default UpdateModal;
