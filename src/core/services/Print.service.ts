import { axiosClient } from "../API/API";
import { SetErrorLog } from "./Error.service";

const ImprimirQR = async (pallet: string) => {
  try {
    const url = `print`;
    const datos = {
      operacion: "print",
      numPallet: pallet,
    };
    const peticion = await axiosClient.post(url, datos);

    return peticion.data;
  } catch (error: any) {
    let message = "";

    if (error.response) {
      message = error.response.data;
    } else if (error.request) {
      message = error.message;
    } else {
      message = error;
    }
    SetErrorLog(message.toString(), "IMPRIMIR QR");
    return { result: "error", message: message.toString() };
  }
};

export { ImprimirQR };

