import { axiosClient } from "../API/API";
import { SetErrorLog } from "./Error.service";

export const fechaProduccionxTraza = async (
  traza: string = "",
): Promise<string> => {
  try {
    const url = `plan`;
    const peticion = await axiosClient.post(url, {
      operacion: "fechaproduccion",
      traza,
    });

    const { data } = peticion.data;

    return typeof data === "string" ? data.trim() : "";
  } catch (error: any) {
    let message = "";

    if (error.response) {
      message = error.response.data;
    } else if (error.request) {
      message = error.message;
    } else {
      message = error;
    }
    SetErrorLog(message.toString(), "BUSCAR FECHA PRODUCCION X TRAZA");
    return "";
  }
};

export const plandiarioxTraza = async (traza: string = "") => {
  try {
    const url = `plan`;
    const peticion = await axiosClient.post(url, {
      operacion: "searchplan",
      traza,
    });

    const { data } = peticion.data;
    return data;
  } catch (error: any) {
    let message = "";

    if (error.response) {
      message = error.response.data;
    } else if (error.request) {
      message = error.message;
    } else {
      message = error;
    }
    SetErrorLog(message.toString(), "BUSCAR PLAN X TRAZA");
    return { result: "error", message: message.toString() };
  }
};
