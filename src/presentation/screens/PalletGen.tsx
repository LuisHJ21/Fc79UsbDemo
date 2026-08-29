import { AlertIcon } from "@/constants/Alerts";
import {
  BoxIcon,
  ChevronLeftIcon,
  ClockIcon,
  CloseIcon,
  ConfirmIcon,
  LayerIcon,
  PalletIcon,
  PrintIcon,
  SearchIcon,
} from "@/constants/Icons";
import { useAutoPalletContext } from "@/core/contexts/AutoPalletContexts";
import { useConfContext } from "@/core/contexts/ConfContext";
import { ObtenerTipoProcesoOT } from "@/core/services/Ot.service";
import {
  DetallePallet,
  SavePallet,
  UpdateStatePallet,
} from "@/core/services/Pallet.service";
import {
  fechaProduccionxTraza,
  plandiarioxTraza,
} from "@/core/services/PlanDiario.service";
import { ImprimirQR } from "@/core/services/Print.service";
import { ObtenerTurnoActual } from "@/core/services/Turno.service";
import { useUsbScanner } from "@/hooks/useUsbScanner";
import { DataFormPallet } from "@/infraestructure/interfaces";
import { Turno } from "@/infraestructure/interfaces/turno.interface";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppAlert from "../components/AppAlert";
import MdlPallets from "../components/MdlPallets";
import {
  buscarAMP,
  ConfirmDialog,
  desencriptarQRtext,
  ExtraerData,
  SearchArticulo,
} from "../utils";
import { parseTraza } from "../utils/traza";

//--- EFECTO AL PRESIONAR (EL BOTÓN SE HUNDE)
const efectoPresionado = ({ pressed }: { pressed: boolean }) =>
  pressed
    ? {
        transform: [{ translateY: 3 }, { scale: 0.98 }],
        opacity: 0.9,
      }
    : {};

//--- FECHA PRODUCCION
const obtenerFechaProd = (item: any): string => {
  const valor =
    item?.fechaProd ??
    item?.fechaprod ??
    item?.fecha_prod ??
    item?.fechaProduccion ??
    "";

  const texto = String(valor).trim();
  if (texto === "") return "---";

  //--- FECHA PRODUCCION FORMATO
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return texto;
};

const PalletGen = () => {
  const { cargando, palletCarga, setPalletCarga, clearPalletCarga } =
    useAutoPalletContext();

  const { setTurnoActual, turnoActual } = useConfContext();

  const { statusLog, statusType, setScannedCode } = useUsbScanner({
    baudRate: 9600,
    scanCooldownMs: 2000, //TIEMPO DE DEMORA DE LECTURA ENTRE CODIGOS
    onCodeScanned: (code) => addItem(code),
  });
  const [turno, setTurno] = useState<Turno | null>(null);

  const [scanInput, setScanInput] = useState("");
  const [itemsPallet, setItemsPallet] = useState<any[]>([]);
  const [cabecera, setCabecera] = useState<any>(null);
  //--- NOMBRE DEL ARTICULO (TODAS LAS CAJAS DEL PALLET COMPARTEN ARTICULO)
  const [descArticulo, setDescArticulo] = useState("");
  const [lastScan, setLastScan] = useState<any>(null); //const inputRef = useRef<TextInput>(null);
  const [visibityMdl, setVisibityMdl] = useState(false);
  const [confirmCerrar, setConfirmCerrar] = useState(false);
  const [confirmIncompleto, setConfirmIncompleto] = useState(false);
  const [productoEscaneado, setProductoEscaneado] = useState(false);
  const [productoDuplicado, setProductoDuplicado] = useState<string | null>(
    null,
  );
  const [trazaInvalida, setTrazaInvalida] = useState<string | null>(null);
  const [trazaDiferente, setTrazaDiferente] = useState<{
    escaneada: string;
    esperada: string;
  } | null>(null);
  // ----------------------------  EVITAR DUPLICIDAD DE QR ESCANEADOS -----------------------------------
  //--- BLOQUEAR TRAZAS DUPLICADAS
  const trazasRegistradas = useRef<Set<string>>(new Set());

  // -------------------  EVITAR MEZCLAR 2 TRAZAS DISTINTAS EN UN PALLET  -------------------
  const trazaBasePallet = useRef<string | null>(null);

  const insets = useSafeAreaInsets();

  const changeVisibityMdl = () => {
    setVisibityMdl(!visibityMdl);
  };

  const totalWeight = itemsPallet
    .reduce((acc, item) => acc + parseFloat(item.peso || "0"), 0)
    .toFixed(2);
  const totalBoxes = itemsPallet.length;
  const articleCode =
    itemsPallet.length > 0 ? itemsPallet[0].codigoArt : "----";
  const itemsMostrados = itemsPallet
    .map((item, index) => ({ item, index }))
    .reverse();

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
      estado: "2", //--- ESTADO DEL PALLET CUANDO SE CREA
      detalles: [],
      observacion: "", //operacion: "save",
      usuario: turnoActual?.usuario,
    }; // loadingSave();

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
    ); // SwAlert.close();
  };

  useEffect(() => {
    // Foco automático para PDAs con lector láser
    //  setTimeout(() => inputRef.current?.focus(), 500);

    // if (qrRef.current && flagAutoFocus) {
    //   qrRef.current.focus();
    // }

    const obtenerItemsdb = async () => {
      if (!palletCarga) return;

      const service = await DetallePallet(palletCarga);

      const detalles = service["detalles"];
      const cabecera = service["cabecera"];
      setCabecera(cabecera || null);
      setDescArticulo(String(cabecera?.descArt || "").trim());
      setItemsPallet(detalles || []);

      trazasRegistradas.current = new Set<string>(
        (detalles || [])
          .map((detalle: any) => String(detalle?.traza || "").trim())
          .filter((traza: string) => traza !== ""),
      );

      //--- LA BASE DEL PALLET SALE DE LA PRIMERA CAJA YA REGISTRADA
      const baseRegistrada = (detalles || [])
        .map((detalle: any) => parseTraza(String(detalle?.traza || ""))?.base)
        .find((base: string | undefined) => !!base);

      trazaBasePallet.current = baseRegistrada || null;
    };

    obtenerItemsdb();
  }, [palletCarga]);

  const testLog = (codigo: string) => {
    console.log(codigo);
  };

  const addItem = async (codigo: string) => {
    // loadingSave("AÑADIENDO...");

    if (!turnoActual) {
      Alert.alert("ERROR", "No existe turno iniciado");

      return;
    }
    // ---- TRAZA RESERVADA (EN CASO DE ERROR PERMITE REINTENTAR)
    let trazaReservada: string | null = null;
    // ---- BASE RESERVADA POR LA PRIMERA CAJA (SE LIBERA SI FALLA EL REGISTRO)
    let baseReservada: string | null = null;

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

      const traza = String(detalles["traza"] || "").trim();

      if (traza === "") return;

      //--- LA TRAZA DEBE CUMPLIR EL FORMATO: I001-010626-N-0001
      const trazaParseada = parseTraza(traza);

      if (!trazaParseada) {
        setTrazaInvalida(traza);
        return;
      }

      //--- UN PALLET NO PUEDE MEZCLAR 2 TRAZAS DISTINTAS -  (ENTRE CAJAS SOLO PUEDE CAMBIAR EL CORRELATIVO)
      if (
        trazaBasePallet.current &&
        trazaBasePallet.current !== trazaParseada.base
      ) {
        setTrazaDiferente({
          escaneada: trazaParseada.completa,
          esperada: trazaBasePallet.current,
        });
        return;
      }

      if (!trazaBasePallet.current) {
        //--- PRIMERA CAJA: FIJA LA TRAZA DEL PALLET ANTES DE LOS await
        trazaBasePallet.current = trazaParseada.base;
        baseReservada = trazaParseada.base;
      }

      // SE REPITE SOLO EN PROCESO
      const tipoProceso = await ObtenerTipoProcesoOT(detalles["ot"]);
      const bloquearDuplicado =
        tipoProceso.result === "success" && !tipoProceso.trazaRepetible;

      if (bloquearDuplicado) {
        if (trazasRegistradas.current.has(traza)) {
          setProductoDuplicado(traza);
          return;
        }

        trazasRegistradas.current.add(traza);
        trazaReservada = traza;
      }

      const verificar = await SearchArticulo(detalles["codigoArt"]);

      if (!verificar) {
        // setScanInput("");
        return;
      }

      setDescArticulo(String(verificar["descArt"] || "").trim());

      const plan = await plandiarioxTraza(detalles["traza"]);

      //--- FECHA PRODUCCION: MANDA LA ASIGNADA A LA TRAZA, NO LA DEL QR

      const fechaProdTraza = await fechaProduccionxTraza(traza);
      const fechaProd =
        fechaProdTraza !== "" ? fechaProdTraza : detalles["fechaProd"];

      const amp = await buscarAMP({
        codigoArt: detalles["codigoArt"],
        ot: detalles["ot"],
      });

      if (amp.length === 0) {
        Alert.alert("NO SE HA ENCONTRADO PROYECCION"); /* SwAlert.fire({
          icon: "warning",
          text: "NO SE HA ENCONTRADO PROYECCION",
          showConfirmButton: false,
          timer: 1500,
        });*/ //setScanInput("");
        return;
      } //const plan = await plandiarioxTraza(detalles["traza"]);

      const item = {
        ot: detalles["ot"],
        fechaProd: fechaProd,
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
        estado: "2", //--- SIGUE INCOMPLETO MIENTRAS SE ESCANEAN CAJAS
        detalles: [item],
        observacion: "", // operacion: "update",
        usuario: turnoActual?.usuario,
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
      setItemsPallet((prev) => [...prev, detalleNew]); //setScanInput("");
      setProductoEscaneado(true);

      trazaReservada = null; // quedó registrada, la reserva se vuelve definitiva
      baseReservada = null; // el pallet queda amarrado a esta traza
      //* SwAlert.close();
    } catch (error) {
      console.log(error); //setScanInput("");
      // SwAlert.close();
    } finally {
      if (trazaReservada) {
        trazasRegistradas.current.delete(trazaReservada);
      }

      if (baseReservada && trazaBasePallet.current === baseReservada) {
        trazaBasePallet.current = null;
      }
    }
  };
  const Imprimir = async () => {
    if (!palletCarga) return;

    ImprimirQR(palletCarga);
  };

  const CerrarPallet = () => {
    setConfirmCerrar(true);
  };

  const confirmarCerrarPallet = async () => {
    setConfirmCerrar(false);

    const peticion = await UpdateStatePallet(palletCarga ?? "", 1);

    const { message, result } = peticion;

    if (result === "error") {
      Alert.alert("ERROR", message);

      console.log(peticion);

      return;
    }
    clearPalletCarga();
    setItemsPallet([]);
    setLastScan(null);
    setDescArticulo("");
    trazasRegistradas.current.clear();
    trazaBasePallet.current = null;
  };

  //  ---- CAMBIO (PERMITE CANCELAR EL CIERRE DEL PALET Y SEGUIR EN LA MISMA VISTA)
  const cancelarCerrarPallet = () => {
    setConfirmCerrar(false);
  };

  // ----RETROCEDER
  const volverAtras = () => {
    clearPalletCarga();
    setItemsPallet([]);
    setLastScan(null);
    setDescArticulo("");
    trazasRegistradas.current.clear();
    trazaBasePallet.current = null;
  };

  //  ---- SALIR DEJANDO EL PALLET INCOMPLETO (NO SE CIERRA EL PALLET)
  const PalletIncompleto = () => {
    setConfirmIncompleto(true);
  };

  const confirmarPalletIncompleto = () => {
    setConfirmIncompleto(false);
    volverAtras();
  };

  const cancelarPalletIncompleto = () => {
    setConfirmIncompleto(false);
  };

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
            <Text className="font-bold text-3xl text-white">
              Generar Pallet
            </Text>
          </Pressable>

          <Pressable
            className=" flex-1 flex-col uppercase p-5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white  items-center justify-center gap-2"
            onPress={changeVisibityMdl}
          >
            <SearchIcon size={30} />
            <Text className="font-bold text-3xl text-white">Buscar Pallet</Text>
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
      <AppAlert
        visible={confirmCerrar}
        type="confirm"
        title="¿PALLET ESTA COMPLETO?"
        message="Se cerrará el pallet actual."
        confirmText="SI"
        cancelText="NO"
        onConfirm={confirmarCerrarPallet}
        onCancel={cancelarCerrarPallet}
      />

      <AppAlert
        visible={confirmIncompleto}
        type="confirm"
        icon={<AlertIcon type="warning" />}
        title="¿DESEA SALIR?"
        message="El pallet está incompleto y quedará abierto."
        confirmText="SI"
        cancelText="NO"
        onConfirm={confirmarPalletIncompleto}
        onCancel={cancelarPalletIncompleto}
      />

      <AppAlert
        visible={productoEscaneado}
        type="success"
        title="PRODUCTO ESCANEADO"
        message=""
        onConfirm={() => setProductoEscaneado(false)}
      />

      <AppAlert
        visible={productoDuplicado !== null}
        type="warning"
        title="CAJA YA REGISTRADA"
        message={`La traza ${productoDuplicado} Ya Fue Registrada en el Pallet.`}
        confirmText="OK"
        onConfirm={() => setProductoDuplicado(null)}
      />

      <AppAlert
        visible={trazaInvalida !== null}
        type="warning"
        title="TRAZA CON FORMATO INVÁLIDO"
        message={`La traza ${trazaInvalida} QR no cumple con el Formato Requerido.`}
        confirmText="OK"
        onConfirm={() => setTrazaInvalida(null)}
      />

      <AppAlert
        visible={trazaDiferente !== null}
        type="warning"
        title="TRAZA DIFERENTE"
        message={`Este pallet es de la traza ${trazaDiferente?.esperada}. La caja escaneada (${trazaDiferente?.escaneada}) pertenece a otra traza.`}
        confirmText="OK"
        onConfirm={() => setTrazaDiferente(null)}
      />

      {/* HEADER NATIVO */}
      <View className="bg-white px-4 border-b border-slate-200 flex-row justify-between items-center py-5">
        <View className="flex-row items-center">
          <Pressable
            onPress={volverAtras}
            className="w-16 h-16 mr-4 rounded-2xl items-center justify-center bg-slate-100 border border-slate-300"
          >
            <ChevronLeftIcon color="#334155" size={44} />
          </Pressable>

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

        <View
          className={`px-3 py-2 rounded-lg ${
            statusType === "esperando"
              ? "bg-yellow-400 border border-yellow-500"
              : statusType === "error"
                ? "bg-red-100 border border-red-300"
                : statusType === "listo"
                  ? "bg-green-100 border border-green-300"
                  : "bg-slate-100 border border-slate-200"
          }`}
        >
          <Text
            className={`text-[10px] font-black uppercase ${
              statusType === "esperando"
                ? "text-yellow-900"
                : statusType === "error"
                  ? "text-red-700"
                  : statusType === "listo"
                    ? "text-green-700"
                    : "text-slate-600"
            }`}
          >
            {statusLog}
          </Text>
        </View>

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

      <View className="flex-row flex-1">
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
          {/*  <View
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
          </View> */}
          {/* CARD INFO PRINCIPAL */}
          <View className="m-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <View className="flex-row items-center mb-4">
              <PalletIcon color="#1D4ED8" />
              <Text className="text-xl font-black uppercase text-slate-700 ml-2 tracking-widest">
                Pallet N° {palletCarga}
              </Text>
            </View>

            <Text className="text-[13px] font-bold text-slate-400 uppercase">
              Artículo
            </Text>

            <Text className="text-2xl font-bold text-slate-450 mb-3">
              {articleCode}
            </Text>

            <Text className="text-[13px] font-bold text-slate-400 uppercase">
              Nombre de Artículo
            </Text>

            <Text
              numberOfLines={2}
              className="text-lg font-semibold text-slate-600 mb-4"
            >
              {descArticulo !== "" ? descArticulo : "---"}
            </Text>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Text className="text-[13px] font-bold text-slate-600 uppercase mb-1">
                  Cajas
                </Text>

                <Text className="text-2xl font-black text-blue-700">
                  {totalBoxes}
                </Text>
              </View>

              <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Text className="text-[13px] font-bold text-slate-600 uppercase mb-1">
                  Peso Total
                </Text>

                <Text className="text-2xl font-black text-blue-700">
                  {totalWeight}
                  <Text className="text-xs">KG</Text>
                </Text>
              </View>
            </View>
          </View>
          {/* ÚLTIMA CAJA */}
          <View
            className={`m-4 bg-gray-500 p-5 rounded-3xl border ${lastScan ? "border-blue-700" : "border-slate-200  "}`}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className=" text-[18px] font-black uppercase  text-white tracking-widest">
                Última Lectura
              </Text>
              <ClockIcon />
            </View>

            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-[18px] font-bold text-white uppercase">
                  Traza
                </Text>

                <Text className="text-sm font-bold text-slate-100">
                  {lastScan?.traza || "---"}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[15px] font-bold text-white uppercase">
                  Peso
                </Text>

                <Text className="text-lg font-black text-slate-200">
                  {lastScan?.peso || "0.00"} KG
                </Text>
              </View>
            </View>
          </View>

          {/* BOTONES DE ACCIÓN FIJOS */}
          <View className="p-4 bg-white border-t border-slate-100 gap-3">
            <Pressable
              disabled={totalBoxes === 0} //activeOpacity={0.8}
              onPress={CerrarPallet}
              android_ripple={{ color: "rgba(255,255,255,0.25)" }}
              style={efectoPresionado}
              className={`w-full py-6 px-4 rounded-2xl flex-row items-center justify-center overflow-hidden border-b-4 ${
                totalBoxes > 0
                  ? "bg-green-600 border-green-800"
                  : "bg-slate-200 border-slate-300"
              }`}
            >
              <ConfirmIcon
                size={28}
                color={totalBoxes > 0 ? "#ffffff" : "#64748b"}
              />

              <Text
                className={`ml-3 text-[20px] font-black uppercase tracking-wide ${totalBoxes > 0 ? "text-white" : "text-slate-500"}`}
              >
                Cerrar Pallet Completo
              </Text>
            </Pressable>

            <Pressable
              disabled={totalBoxes === 0} //activeOpacity={0.8}
              onPress={PalletIncompleto}
              android_ripple={{ color: "rgba(255,255,255,0.25)" }}
              style={efectoPresionado}
              className={`w-full py-6 px-4 rounded-2xl flex-row items-center justify-center overflow-hidden border-b-4 ${
                totalBoxes > 0
                  ? "bg-red-600 border-red-800"
                  : "bg-slate-200 border-slate-300"
              }`}
            >
              <CloseIcon
                size={28}
                color={totalBoxes > 0 ? "#ffffff" : "#64748b"}
              />

              <Text
                className={`ml-3 text-[20px] font-black uppercase tracking-wide ${totalBoxes > 0 ? "text-white" : "text-slate-500"}`}
              >
                Pallet Incompleto
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-[2] gap-5 mt-4 ">
          <Text className="text-[14px]  font-black uppercase text-slate-400 mb-3 ml-1 tracking-tighter italic">
            Detalles de carga
          </Text>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            {/* LISTADO DE ITEMS (el último escaneado va primero) */}
            <View className="mx-4 mt-2 flex-1">
              {itemsMostrados.map(({ item, index }) => (
                <View
                  key={`${item.traza}-${index}`}
                  className="bg-white p-4 rounded-2xl mb-2 border border-slate-100 flex-row items-center shadow-sm"
                >
                  <View className="w-16 h-16 bg-slate-600 rounded-xl items-center justify-center border border-slate-100 mr-4">
                    <BoxIcon />
                  </View>

                  {/* FILA DE 4 COLUMNAS */}
                  <View className="flex-1 pr-2">
                    <Text className="text-[13px] font-black uppercase text-slate-400 tracking-widest">
                      Artículo
                    </Text>

                    <Text
                      numberOfLines={1}
                      className="text-[18px] font-bold text-slate-800"
                    >
                      {item.codigoArt}
                    </Text>
                  </View>

                  <View className="flex-1 px-2 border-l border-slate-100">
                    <Text className="text-[13px] font-black uppercase text-slate-400 tracking-widest">
                      Traza
                    </Text>

                    <Text
                      numberOfLines={1}
                      className="text-[18px] font-bold text-slate-800"
                    >
                      {item.traza}
                    </Text>
                  </View>

                  <View className="flex-1 px-2 border-l border-slate-100">
                    <Text className="text-[13px] font-black uppercase text-slate-400 tracking-widest">
                      F. Producción
                    </Text>

                    <Text
                      numberOfLines={1}
                      className="text-[18px] font-bold text-slate-800"
                    >
                      {obtenerFechaProd(item)}
                    </Text>
                  </View>

                  <View className="flex-1 pl-2 border-l border-slate-100">
                    <Text className="text-[13px] font-black uppercase text-slate-400 tracking-widest">
                      Peso
                    </Text>

                    <Text
                      numberOfLines={1}
                      className="text-[18px] font-bold text-slate-800"
                    >
                      {item.peso} KG
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PalletGen;
