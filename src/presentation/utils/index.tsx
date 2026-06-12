import { VerificarArticulo } from "@/core/services/Articulo.service";
import { DesencriptarCodigo } from "@/core/services/General.service";
import { SearchAMP } from "@/core/services/Ot.service";
import { dataQr } from "@/infraestructure/interfaces";
import { Alert, Platform } from "react-native";

type formAMP = {
  codigoArt: string;
  ot: string;
};

export const ConfirmDialog = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
) => {
  if (Platform.OS === "web") {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      onConfirm();
    } else {
      if (onCancel) onCancel();
    }
  } else {
    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: onCancel,
        },
        {
          text: "Confirmar",
          onPress: onConfirm,
        },
      ],
      { cancelable: false },
    );
  }
};

export const desencriptarQRtext = async (textQr: string) => {
  console.log(textQr);
  const partes = textQr.split("=");
  const qrEncrypted = partes[0];

  const desencriptado = await DesencriptarCodigo(qrEncrypted);

  if (desencriptado.result !== "success") {
    return false;
  }
  //console.log(desencriptado);
  return desencriptado.qr;
};

export const ExtraerData = (qrCode: string) => {
  const codigoArt = qrCode.split("|")[0] ? qrCode.split("|")[0].trim() : "";
  const ot = qrCode.split("|")[1] ? qrCode.split("|")[1].trim() : "";
  const fechaProd = qrCode.split("|")[2] ? qrCode.split("|")[2].trim() : "";
  const traza = qrCode.split("|")[3] ? qrCode.split("|")[3].trim() : "";
  const lote = qrCode.split("|")[4] ? qrCode.split("|")[4].trim() : "";

  const detalle: dataQr = {
    codigoArt: codigoArt,
    ot: ot,
    fechaProd: fechaProd,
    traza: traza,
    lote: lote,
  };
  return detalle;
};

export const SearchArticulo = async (articulo: string) => {
  const peticion = await VerificarArticulo(articulo);

  if (!peticion.codigoArt) {
    /* SwAlert.fire({
      icon: "warning",
      text: "NO SE HA ENCONTRADO ARTICULO",
      showConfirmButton: false,
      timer: 1500,
    });

    return false;*/
  }

  return peticion;
};

export const buscarAMP = async (datos: formAMP) => {
  const data = { ...datos, operacion: "searchAMP" };
  const amp = await SearchAMP(data);

  if (!amp.result || amp.result !== "success") {
    console.log("NO SE HA ENCONTRADO OT");
    return [];
  }

  const proyecciones = amp["mensaje"].split("|");

  if (proyecciones.length === 1) {
    const datosProy = proyecciones[0].split(",");

    return datosProy;
  }

  const inputOptions = proyecciones.map((proy: string) => {
    const option = proy.split(",");
    return `${option[1]} | Disponible: ${option[2]}`;
  });

  /* const { value: datosProy } = await SwAlert.fire({
    title: "Seleccione Proyección",
    input: "radio",
    confirmButtonText: "Seleccionar",
    inputOptions,
    inputValidator: (value) => {
      if (!value) {
        return "Escoja una opción";
      }
    },
  });*/

  // return proyecciones[datosProy].split(",");
  return proyecciones[0].split(",");
};
