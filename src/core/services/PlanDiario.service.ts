import { axiosClient } from "../API/API";
import { SetErrorLog } from "./Error.service";

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
