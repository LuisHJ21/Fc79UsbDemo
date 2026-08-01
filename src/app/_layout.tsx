import { useAppUpdate } from "@/hooks/useAppUpdate";
import UpdateModal from "@/presentation/components/UpdateModal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

//=================  vERSION APK (MODAL
function UpdateLayer() {
  const update = useAppUpdate();

  return (
    <UpdateModal
      visible={update.modalVisible}
      currentVersion={update.currentVersion}
      versionInfo={update.versionInfo}
      downloading={update.downloading}
      downloadProgress={update.downloadProgress}
      error={update.error}
      onDownload={update.downloadAndInstall}
      onDismiss={update.dismissModal}
    />
  );
}

export default function RootLayout() {
  return (
    <>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <UpdateLayer />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </>
  );
}
