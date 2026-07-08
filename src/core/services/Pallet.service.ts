import { DataFormPallet } from "@/infraestructure/interfaces";
import { axiosClient } from "../API/API";
import { SetErrorLog } from "./Error.service";

interface PalletDetail {
  operacion: string;
  numPallet: string;
}

export const DetallePallet = async (pallet: string) => {
  try {
    const url = `pallet`;
    const datos: PalletDetail = {
      operacion: "detalle",
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
    SetErrorLog(message.toString(), "OBBTENER DETALLE PALLET");
    return { result: "error", message: message.toString() };
  }
};

export const SavePallet = async (
  datos: DataFormPallet,
  id: string,
  operacion: string,
) => {
  try {
    const url = `pallet`;
    const peticion = await axiosClient.post(url, {
      ...datos,
      id,
      operacion,
    });

    if (peticion.data.result && peticion.data.result === "error")
      throw new Error(peticion.data.message);
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
    SetErrorLog(message.toString(), "GUARDAR PALLET", datos.usuario);
    return { result: "error", message: message.toString() };
  }
};

export const SearchPallet = async (numPallet: string) => {
  try {
    const url = `pallet`;
    const datos: PalletDetail = {
      operacion: "detalle",
      numPallet: numPallet,
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
    SetErrorLog(message.toString(), "BUSCAR PALLET");
    return { result: "error", message: message.toString() };
  }
};

export const HistorialPalletIncompleto = async (numPallet: string) => {
  try {
    const url = `pallet`;
    const datos = {
      numPallet,
      operacion: "historyIncompleto",
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
    SetErrorLog(message.toString(), "OBTENER PALLETS INCOMPLETOS");
    return { result: "error", message: message.toString() };
  }
};

export const UpdateStatePallet = async (numPallet: string, estado: number) => {
  try {
    const url = `pallet`;
    const datos = {
      operacion: "estadopallet",
      numPallet: numPallet,
      estado: estado,
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
    SetErrorLog(message.toString(), "DEFINIR ESTADO");
    return { result: "error", message: message.toString() };
  }
};
