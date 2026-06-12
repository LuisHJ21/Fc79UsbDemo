import { useAutoPalletContext } from "@/core/contexts/AutoPalletContexts";
import { useConfContext } from "@/core/contexts/ConfContext";
import PalletGen from "@/presentation/screens/PalletGen";
import { ActivityIndicator, View } from "react-native";

export default function TabTwoScreen() {
  const { loadingData } = useAutoPalletContext();
  const { loadingData: loadingContext } = useConfContext();

  if (loadingData || loadingContext)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );

  return <PalletGen />;
}
