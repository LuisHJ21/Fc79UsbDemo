import { searchOt } from "../../infraestructure/interfaces";
import { axiosClient } from "../API/API";

type formAMP = {
  codigoArt: string;
  ot: string;
};

export type TipoProcesoOT = {
  result: string;
  codProceso?: string;
  descripcion?: string;
  /*
   * true  => PROCESO / REEMPAQUE / REPROCESO: la misma traza cubre varias
   *          cajas, no se debe bloquear como duplicado.
   * false => EMPAQUE: la traza es unica por caja.
   */
  trazaRepetible?: boolean;
  message?: string;
};

export const ObtenerTipoProcesoOT = async (
  ot: string,
): Promise<TipoProcesoOT> => {
  try {
    const url = `ot`;
    const peticion = await axiosClient.post(url, {
      ot,
      operacion: "tipoProceso",
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

    return { result: "error", message: message.toString() };
  }
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
