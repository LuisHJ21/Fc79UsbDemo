import { axiosClient } from "../API/API";

const DesencriptarCodigo = async (codigoQR: string) => {
  try {
    const datos = {
      operacion: "decrypt",
      qrEncrypted: codigoQR,
    };

    const url = `general`;
    const peticion = await axiosClient.post(url, datos);

    return peticion.data;
  } catch (error: any) {
    console.log(error);
  }
};

export { DesencriptarCodigo };

