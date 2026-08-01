import { searchOt } from "../../infraestructure/interfaces";
import { axiosClient } from "../API/API";

type formAMP = {
  codigoArt: string;
  ot: string;
};

export type TipoProcesoOT = {
  result: string;
  /* OT_TIPO de TRAZA_PROCESO: 'OPPR' | 'OPRE' | 'OPRP', o '' si no esta */
  otTipo?: string;
  descripcion?: string;
  /*
   * Sale del OT_TIPO de TRAZA_PROCESO segun la OT del QR:
   *     OPPR  PROCESO     -> true,  la misma traza cubre varias cajas
   *     OPRE  REEMPAQUE   -> false, traza unica por caja
   *     OPRP  REPROCESO   -> false, traza unica por caja
   * El empaque es parte del proceso, no es una categoria aparte.
   * Estar en TRAZA_PROCESO no implica traza repetible: solo OPPR.
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
