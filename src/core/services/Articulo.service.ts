import { axiosClient } from "../API/API";
import { SetErrorLog } from "./Error.service";

const VerificarArticulo = async (codigoArt: string) => {
  try {
    const url = `articulo`;
    const datos = {
      operacion: "verificar",
      codigoArt,
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
    SetErrorLog(message.toString(), "VERIFICAR ARTICULO");
    return { result: "error", message: message.toString() };
  }
};

export { VerificarArticulo };

