import { UAParser } from "ua-parser-js";
import { axiosClient } from "../API/API";

const SetErrorLog = async (
  mensaje: string,
  accion: string,
  usuario?: string,
) => {
  try {
    const parser = new UAParser();
    const agent = parser.getResult();
    const device = agent.device;
    const datos = {
      error: mensaje,
      accion: accion,
      device: device.model,
      operacion: "saveError",
      usuario: usuario,
      app: "GESTPALLET",
    };

    const url = `error`;
    const peticion = await axiosClient.post(url, datos);

    return peticion.data;
  } catch (error: any) {}
};

export { SetErrorLog };

