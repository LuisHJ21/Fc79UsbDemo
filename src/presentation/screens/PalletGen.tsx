import {
  BoxIcon,
  ClockIcon,
  LayerIcon,
  PalletIcon,
  PrintIcon,
  SearchIcon,
  WeightIcon,
} from "@/constants/Icons";
import { useAutoPalletContext } from "@/core/contexts/AutoPalletContexts";
import { useConfContext } from "@/core/contexts/ConfContext";
import { DetallePallet, SavePallet } from "@/core/services/Pallet.service";
import { plandiarioxTraza } from "@/core/services/PlanDiario.service";
import { ImprimirQR } from "@/core/services/Print.service";
import { ObtenerTurnoActual } from "@/core/services/Turno.service";
import { useUsbScanner } from "@/hooks/useUsbScanner";
import { DataFormPallet } from "@/infraestructure/interfaces";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MdlPallets from "../components/MdlPallets";
import {
  buscarAMP,
  ConfirmDialog,
  desencriptarQRtext,
  ExtraerData,
  SearchArticulo,
} from "../utils";

const PalletGen = () => {
  const { cargando, palletCarga, setPalletCarga, clearPalletCarga } =
    useAutoPalletContext();

  const { setTurnoActual, turnoActual } = useConfContext();

  const { statusLog, setScannedCode } = useUsbScanner({
    baudRate: 9600,
    onCodeScanned: (code) => testLog(code),
  });

  // const [turno, setTurno] = useState<Turno | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [itemsPallet, setItemsPallet] = useState<any[]>([]);
  const [cabecera, setCabecera] = useState<any>(null);
  const [lastScan, setLastScan] = useState<any>(null);
  const inputRef = useRef<TextInput>(null);

  const [visibityMdl, setVisibityMdl] = useState(false);

  const insets = useSafeAreaInsets();

  const changeVisibityMdl = () => {
    setVisibityMdl(!visibityMdl);
  };

  // Cálculos dinámicos
  const totalWeight = itemsPallet
    .reduce((acc, item) => acc + parseFloat(item.peso || "0"), 0)
    .toFixed(2);
  const totalBoxes = itemsPallet.length;
  const articleCode =
    itemsPallet.length > 0 ? itemsPallet[0].codigoArt : "----";

  const paddingTop = insets.top;
  const paddingBottom = insets.bottom;

  const obtenerTurno = async () => {
    const peticion = await ObtenerTurnoActual();

    if (!peticion?.error && peticion?.data) {
      setTurnoActual(peticion.data);
    }
  };

  const crearPallet = async () => {
    const datos: DataFormPallet = {
      codigoArt: "",
      estado: "1",
      detalles: [],
      observacion: "",
      //operacion: "save",
      usuario: "super5",
    };

    // loadingSave();

    if (!turnoActual) {
      Alert.alert("ERROR", "No existe turno iniciado");
      return;
    }

    ConfirmDialog(
      "¿GENERAR PALLET?",
      "",
      async () => {
        const peticion = await SavePallet(datos, turnoActual.id, "save");

        const { message, result } = peticion;

        if (result === "error") {
          Alert.alert("ERROR", message);

          return;
        }

        setPalletCarga(message);
      },
      () => {
        return;
      },
    );

    // SwAlert.close();
  };

  useEffect(() => {
    // Foco automático para PDAs con lector láser
    setTimeout(() => inputRef.current?.focus(), 500);

    // if (qrRef.current && flagAutoFocus) {
    //   qrRef.current.focus();
    // }

    const obtenerItemsdb = async () => {
      if (!palletCarga) return;

      const service = await DetallePallet(palletCarga);
      const detalles = service["detalles"];
      const cabecera = service["cabecera"];
      setCabecera(cabecera || null);
      setItemsPallet(detalles || []);
    };

    obtenerItemsdb();
  }, []);

  const testLog = (codigo: string) => {
    console.log(codigo);
  };

  const addItem = async (codigo: string) => {
    // loadingSave("AÑADIENDO...");

    if (!turnoActual) {
      Alert.alert("ERROR", "No existe turno iniciado");

      return;
    }
    try {
      if (!palletCarga) return;

      const textQr = codigo.trim();
      if (!textQr || textQr === "") return;

      const isEncrypted = textQr.includes("=");
      let qrCode = textQr;

      if (isEncrypted) {
        qrCode = await desencriptarQRtext(textQr);
      }

      console.log(qrCode);

      const detalles = ExtraerData(qrCode);
      const verificar = await SearchArticulo(detalles["codigoArt"]);

      if (!verificar) {
        // setScanInput("");
        return;
      }

      const plan = await plandiarioxTraza(detalles["traza"]);

      const amp = await buscarAMP({
        codigoArt: detalles["codigoArt"],
        ot: detalles["ot"],
      });

      if (amp.length === 0) {
        Alert.alert("NO SE HA ENCONTRADO PROYECCION");
        /* SwAlert.fire({
          icon: "warning",
          text: "NO SE HA ENCONTRADO PROYECCION",
          showConfirmButton: false,
          timer: 1500,
        });*/
        //setScanInput("");
        return;
      }

      //const plan = await plandiarioxTraza(detalles["traza"]);

      const item = {
        ot: detalles["ot"],
        fechaProd: detalles["fechaProd"],
        traza: detalles["traza"],
        lote: detalles["lote"],
        bultos: "1",
        peso: verificar["pesoUnd"],
        movamp: amp[1],
        orgamp: amp[0],
        max: amp[2],
        plan: plan,
      };

      const datos: DataFormPallet = {
        codigoArt: detalles["codigoArt"],
        estado: "1",
        detalles: [item],
        observacion: "",
        // operacion: "update",
        usuario: "",
        numPallet: palletCarga,
      };

      const peticion = await SavePallet(datos, turnoActual.id, "update");
      console.log(peticion);

      if (peticion.result === "error") {
        /*await SwAlert.fire({
          icon: "error",
          title: "NO SE HA REALIZADO LA OPERACIÓN",
          text: peticion.message,
          showConfirmButton: false,
          timer: 2500,
        });*/
        //setScanInput("");

        Alert.alert("NO SE HA REALIZADO LA OPERACIÓN");
        return;
      }

      const detalleNew = {
        ...item,
        codigoArt: detalles["codigoArt"],
        db: "true",
      };

      setLastScan(item);
      setItemsPallet((prev) => [...prev, detalleNew]);
      //setScanInput("");
      //* SwAlert.close();
    } catch (error) {
      console.log(error);
      //setScanInput("");
      // SwAlert.close();
    }
  };
  const Imprimir = async () => {
    if (!palletCarga) return;

    ImprimirQR(palletCarga);
  };

  const CerrarPallet = () => {};

  useEffect(() => {
    obtenerTurno();
  }, []);

  if (!cargando) {
    return (
      <View style={{ paddingTop: paddingTop, paddingBottom: paddingBottom }}>
        <MdlPallets
          visible={visibityMdl}
          changeVisibityMdl={changeVisibityMdl}
        />
        <View className="p-5 flex-row gap-2">
          <Pressable
            className="flex-1 flex-col uppercase p-5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white  items-center justify-center gap-2"
            onPress={crearPallet}
          >
            <PalletIcon size={30} />
            <Text className="font-bold text-lg text-white">Generar Pallet</Text>
          </Pressable>
          <Pressable
            className=" flex-1 flex-col uppercase p-5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white  items-center justify-center gap-2"
            onPress={changeVisibityMdl}
          >
            <SearchIcon size={30} />
            <Text className="font-bold text-lg text-white">Buscar Pallet</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1  bg-slate-100 font-sans text-slate-900 flex flex-col"
      style={{ paddingTop: paddingTop, paddingBottom: paddingBottom }}
    >
      {/* HEADER NATIVO */}
      <View className="bg-white px-4 border-b border-slate-200 flex-row justify-between items-center py-5">
        <View className="flex-row items-center">
          <View className="bg-blue-700 w-10 h-10 rounded-xl items-center justify-center border border-blue-700">
            <LayerIcon />
          </View>
          <View className="ml-3">
            <Text className=" font-black uppercase tracking-tighter">
              Auto-Carga
            </Text>
            <Text className="text-xs font-mono text-slate-400">
              MODO AUTOMÁTICO
            </Text>
          </View>
        </View>
        <Text className="text-black text-[10px] font-black uppercase">
          {statusLog}
        </Text>
        <Pressable
          className="w-auto flex flex-col bg-blue-600 hover:bg-blue-700 rounded-lg p-3 text-white font-bold"
          onPress={Imprimir}
        >
          <View className="flex-row items-center gap-2">
            <PrintIcon />
            <Text className="text-white  font-black uppercase">
              Imprimir QR
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="flex-row">
        <View className="flex-1">
          {/* <View className="mx-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <View className="relative flex-row items-center bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-1">
              <QrCodeScan color="#3B82F6" />
              <TextInput
                ref={inputRef}
                value={scanInput}
                onChangeText={setScanInput}
                onSubmitEditing={() => addItem(scanInput)}
                placeholder="ESCANEAR QR..."
                placeholderTextColor="#94a3b8"
                showSoftInputOnFocus={false} // Evita que se abra el teclado si usas láser físico
                className="flex-1 h-6 ml-3 text-slate-900 font-bold"
              />
            </View>
          </View> */}
          {/* CARD LINEA */}
          <View
            className={`m-4 bg-white p-5 rounded-3xl border ${lastScan ? "border-blue-700" : "border-slate-200  "}`}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text font-black uppercase text-blue-700 tracking-widest">
                Linea Configurada
              </Text>
              <ClockIcon />
            </View>

            <View className="flex-row justify-between items-end">
              <Text>Linea 1</Text>
            </View>
          </View>

          {/* CARD INFO PRINCIPAL */}
          <View className="m-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <View className="flex-row items-center mb-4">
              <PalletIcon color="#1D4ED8" />
              <Text className="text-xl font-black uppercase text-slate-700 ml-2 tracking-widest">
                Pallet N° {palletCarga}
              </Text>
            </View>

            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Artículo
            </Text>
            <Text className="text-base font-bold text-slate-800 mb-4">
              {articleCode}
            </Text>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Text className="text-[8px] font-bold text-slate-400 uppercase mb-1">
                  Cajas
                </Text>
                <Text className="text-xl font-black text-blue-700">
                  {totalBoxes}
                </Text>
              </View>
              <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Text className="text-[8px] font-bold text-slate-400 uppercase mb-1">
                  Peso Total
                </Text>
                <Text className="text-xl font-black text-blue-700">
                  {totalWeight} <Text className="text-xs">KG</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* INPUT DE ESCANEO */}

          {/* ÚLTIMA CAJA */}
          <View
            className={`m-4 bg-gray-500 p-5 rounded-3xl border ${lastScan ? "border-blue-700" : "border-slate-200  "}`}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className=" font-black uppercase text-white tracking-widest">
                Última Lectura
              </Text>
              <ClockIcon />
            </View>

            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-[8px] font-bold text-white uppercase">
                  Traza
                </Text>
                <Text className="text-sm font-bold text-slate-200">
                  {lastScan?.traza || "---"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[8px] font-bold text-white uppercase">
                  Peso
                </Text>
                <Text className="text-lg font-black text-slate-200">
                  {lastScan?.peso || "0.00"} KG
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View className="flex-[2]">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* LISTADO DE ITEMS */}
            <View className="mx-4 mt-2">
              <Text className="text-[10px] font-black uppercase text-slate-400 mb-3 ml-1 tracking-tighter italic">
                Detalles de carga
              </Text>
              {itemsPallet.map((item, index) => (
                <View
                  key={index}
                  className="bg-white p-4 rounded-2xl mb-2 border border-slate-100 flex-row items-center shadow-sm"
                >
                  <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100 mr-4">
                    <BoxIcon />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-800 text-sm">
                      {item.codigoArt}
                    </Text>
                    <Text className="text-[10px] text-slate-400 uppercase tracking-tight">
                      Traza: {item.traza} • {item.peso} KG
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          {/* BOTÓN DE CIERRE FIJO */}
          <View className="p-4 bg-white border-t border-slate-100">
            <Pressable
              disabled={totalBoxes === 0}
              //activeOpacity={0.8}
              className={`w-full py-5 rounded-2xl flex-row items-center justify-center ${totalBoxes > 0 ? "bg-blue-700 shadow-lg shadow-blue-200" : "bg-slate-300"}`}
            >
              <Text
                className={`font-black text-xs uppercase tracking-widest mr-3 ${totalBoxes > 0 ? "text-white" : "text-slate-500"}`}
              >
                Finalizar Pallet
              </Text>
              <WeightIcon />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PalletGen;
