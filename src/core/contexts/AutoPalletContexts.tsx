import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface PropsContext {
  loadingData: boolean;
  cargando: boolean;
  palletCarga: string | null;
  setPalletCarga: (palletCaga: string) => void;
  clearPalletCarga: () => void;
}

const ContextAutoPallet = createContext<PropsContext | undefined>(undefined);

export const ContextAutoStoreProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [cargando, setCargando] = useState<boolean>(false);
  const [pallet, setPallet] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const setPalletCarga = async (pallet: string | null) => {
    setCargando(true);
    setPallet(pallet);

    await AsyncStorage.setItem("PalletContext", JSON.stringify(pallet));
  };

  const clearPalletCarga = async () => {
    setCargando(false);
    setPallet(null);

    await AsyncStorage.removeItem("PalletContext");
  };

  useEffect(() => {
    const leerStorage = async () => {
      const token = await AsyncStorage.getItem("PalletContext");
      if (token) {
        setCargando(true);
        setPallet(JSON.parse(token));
      }

      setLoadingData(false);
    };

    leerStorage();
  }, []);

  return (
    <ContextAutoPallet.Provider
      value={{
        loadingData,
        cargando,
        palletCarga: pallet,
        setPalletCarga: setPalletCarga,
        clearPalletCarga: clearPalletCarga,
      }}
    >
      {children}
    </ContextAutoPallet.Provider>
  );
};

export const useAutoPalletContext = () => {
  const context = useContext(ContextAutoPallet);

  if (!context) {
    throw new Error(
      "useAutoPalletContext debe usarse dentro de ContextAutoPalletProvider",
    );
  }

  return context;
};
