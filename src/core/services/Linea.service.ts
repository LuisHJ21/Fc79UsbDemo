import { axiosClient } from "../API/API";
import { SetErrorLog } from "./Error.service";

export const ObtenerLineas = async () => {
  try {
    const url = `lineas`;
    const peticion = await axiosClient.post(url, {
      operacion: "listar",
    });

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

    SetErrorLog(message.toString(), "OBTENER LINEAS");

    return { error: message.toString() };
  }
};
