import { searchOt } from "../../infraestructure/interfaces";
import { axiosClient } from "../API/API";

type formAMP = {
  codigoArt: string;
  ot: string;
};

export const SearchAMP = async (data: formAMP) => {
  try {
    const url = `ot`;
    const operacion = "searchAMP";
    const datos: searchOt = {
      ...data,
      operacion,
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

    return { result: "error", message: message.toString() };
  }
};
