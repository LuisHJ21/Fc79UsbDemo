import { Turno } from "@/infraestructure/interfaces/turno.interface";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface PropsContext {
  lineaElegida: string | null;
  turnoActual: Turno | null;
  setLineaElegida: (linea: string) => void;
  setTurnoActual: (turno: Turno) => void;
  clearConfLinea: () => void;
  clearConfTurno: () => void;
  clearAllConf: () => void;
  loadingData: boolean;
}

const ContextConf = createContext<PropsContext | undefined>(undefined);

export const ContextConfProvider = ({ children }: { children: ReactNode }) => {
  const [linea, setLinea] = useState<string | null>(null);
  const [turno, setTurno] = useState<Turno | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const setLineaElegida = async (lineaElegida: string) => {
    setLinea(lineaElegida);
    await AsyncStorage.setItem("LineaElegida", JSON.stringify(lineaElegida));
  };

  const setTurnoActual = async (turnoActual: Turno) => {
    setTurno(turnoActual);
    await AsyncStorage.setItem("TurnoActual", JSON.stringify(turnoActual));
  };

  const clearConfLinea = async () => {
    setLinea(null);
    await AsyncStorage.removeItem("LineaElegida");
  };

  const clearConfTurno = async () => {
    setTurno(null);
    await AsyncStorage.removeItem("TurnoActual");
  };

  const clearAllConf = async () => {
    clearConfLinea();
    clearConfTurno();
  };

  useEffect(() => {
    const leerStorage = async () => {
      const token = await AsyncStorage.getItem("LineaElegida");
      if (token) {
        setLinea(JSON.parse(token));
      }

      const token2 = await AsyncStorage.getItem("TurnoActual");
      if (token2) {
        setTurno(JSON.parse(token2));
      }

      setLoadingData(false);
    };

    leerStorage();
  }, []);

  return (
    <ContextConf.Provider
      value={{
        lineaElegida: linea,
        turnoActual: turno,
        setLineaElegida: setLineaElegida,
        setTurnoActual: setTurnoActual,
        clearConfLinea: clearConfLinea,
        clearConfTurno: clearConfTurno,
        clearAllConf: clearAllConf,
        loadingData: loadingData,
      }}
    >
      {children}
    </ContextConf.Provider>
  );
};

export const useConfContext = () => {
  const context = useContext(ContextConf);
  if (!context) {
    throw new Error("useConfContext debe usarse dentro de ContextConfProvider");
  }
  return context;
};
