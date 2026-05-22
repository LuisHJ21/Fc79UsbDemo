import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import Animated, { ZoomIn } from "react-native-reanimated";

import {
  CloseIcon,
  PalletIcon,
  QrCodeScan,
  SearchIcon,
} from "@/constants/Icons";
import { useAutoPalletContext } from "@/core/contexts/AutoPalletContexts";
import { HistorialPalletIncompleto } from "@/core/services/Pallet.service";

type PropsModal = {
  visible: boolean;
  changeVisibityMdl: () => void;
};

export default function MdlPallets({ visible, changeVisibityMdl }: PropsModal) {
  const [searchPallet, setSearchPallet] = useState("");
  const [debounceTerm, setDebounceTerm] = useState("");
  const [palletDisp, setPalletDisp] = useState<any[]>([]);

  //console.log("modal");

  const { setPalletCarga } = useAutoPalletContext();

  const getPalletDisp = async (numPallet: string) => {
    try {
      const peticion = await HistorialPalletIncompleto(numPallet);

      setPalletDisp(peticion);

      // console.log("peticion" + JSON.stringify(peticion));
    } catch (error) {
      console.log("errorDiso:" + error);
    }
  };

  const escogerPallet = (pallet: string) => {
    setPalletCarga(pallet);
    changeVisibityMdl();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceTerm(searchPallet);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchPallet]);

  useEffect(() => {
    getPalletDisp(debounceTerm);
  }, [debounceTerm]);

  useEffect(() => {
    getPalletDisp("");
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-gray-600/30 backdrop-blur-sm justify-center items-center px-2">
        <Animated.View
          entering={ZoomIn.duration(400)}
          className="w-full h-[90%] bg-white rounded-md overflow-hidden"
        >
          {/* HEADER */}
          <View className="h-14 bg-blue-600 flex-row items-center justify-between px-5">
            <View className="flex-row items-center">
              <QrCodeScan />

              <Text className="text-white font-bold uppercase text-lg">
                Escoja Pallet
              </Text>
            </View>

            <Pressable onPress={changeVisibityMdl}>
              <CloseIcon />
            </Pressable>
          </View>

          {/* BODY */}
          <View className="flex-1 bg-white p-3">
            {/* SEARCH */}
            <View className="flex-row pb-5">
              <View className="w-12 bg-gray-200 items-center justify-center rounded-l-md">
                <SearchIcon />
              </View>

              <TextInput
                className="flex-1 h-10 border border-gray-300 rounded-r-md text-center px-2 text-black"
                value={searchPallet}
                onChangeText={setSearchPallet}
                placeholder="BUSCAR PALLET"
                placeholderTextColor="#9CA3AF"
                maxLength={10}
              />
            </View>

            {/* LIST */}
            <FlatList
              data={palletDisp}
              keyExtractor={(item) => item.NUM_PALLET.toString()}
              showsVerticalScrollIndicator={false}
              numColumns={3}
              columnWrapperStyle={{
                flexWrap: "wrap",
                gap: 20,
                flexDirection: "row",
              }}
              renderItem={({ item }) => (
                <Pressable
                  className="flex-row flex-1 min-w-60 items-center border border-gray-300 rounded-md p-5 mb-3 bg-white"
                  //activeOpacity={0.8}
                  onPress={() => escogerPallet(item.NUM_PALLET)}
                >
                  <View className="flex-1 items-center justify-center">
                    <PalletIcon color="#2B7FFF" size={50} />
                  </View>

                  <View className="flex-[3]">
                    <Text className="font-bold text-base text-black">
                      {item.NUM_PALLET}
                    </Text>

                    <Text className="text-sm text-gray-600">
                      N° bultos: {item.NUM_BULTO}
                    </Text>

                    <Text className="text-sm text-gray-600">
                      Peso: {item.PESO}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
