import { PalletIcon } from "@/constants/Icons";
import { ContextAutoStoreProvider } from "@/core/contexts/AutoPalletContexts";
import { ContextConfProvider } from "@/core/contexts/ConfContext";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <ContextConfProvider>
      <ContextAutoStoreProvider>
        <Tabs
          screenOptions={{
            //tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: false,
            //tabBarButton: HapticTab,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => <PalletIcon color={color} />,
            }}
          />
          {/* <Tabs.Screen
            name="historial"
            options={{
              title: "Historial",
              tabBarIcon: ({ color }) => <HistoryIcon color={color} />,
            }}
          /> */}
        </Tabs>
      </ContextAutoStoreProvider>
    </ContextConfProvider>
  );
}
