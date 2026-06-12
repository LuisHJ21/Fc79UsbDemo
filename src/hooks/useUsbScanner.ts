import {
  Parity,
  UsbSerialManager,
} from "@bservan/react-native-usb-serialport-for-android";
import { useEffect, useRef, useState } from "react";

const hexToString = (hexString: string): string => {
  let str = "";
  for (let i = 0; i < hexString.length; i += 2) {
    str += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
  }
  return str;
};

export interface UseUsbScannerOptions {
  baudRate?: number;
  onCodeScanned?: (code: string) => void; // Callback opcional para ejecutar funciones externas directamente
}

export function useUsbScanner(options?: UseUsbScannerOptions) {
  const [statusLog, setStatusLog] = useState<string>(
    "Iniciando sistema USB...",
  );
  const [scannedCode, setScannedCode] = useState<string>("");

  const activePortRef = useRef<any>(null);
  const isConnectingRef = useRef<boolean>(false);
  const codigoBufferRef = useRef<string>("");

  // Usamos un ref para el callback para evitar que cambios en la función reinicien el efecto principal
  const onCodeScannedRef = useRef(options?.onCodeScanned);
  useEffect(() => {
    onCodeScannedRef.current = options?.onCodeScanned;
  }, [options?.onCodeScanned]);

  useEffect(() => {
    let connectionCheckInterval: NodeJS.Timeout;

    const checkAndConnectUSB = async () => {
      if (isConnectingRef.current) return;

      try {
        const devices = await UsbSerialManager.list();

        // console.log(devices);

        // Manejo de desconexión
        if (!devices || devices.length === 0) {
          if (activePortRef.current) {
            setStatusLog("Lector USB desconectado.");
            activePortRef.current = null;
          } else {
            setStatusLog("Esperando conexión del lector USB...");
          }
          return;
        }

        if (activePortRef.current) return;

        // Intentar conectar
        isConnectingRef.current = true;
        const targetDevice = devices[0];
        setStatusLog("Conectando al lector...");

        await UsbSerialManager.tryRequestPermission(targetDevice.deviceId);

        const port = await UsbSerialManager.open(targetDevice.deviceId, {
          baudRate: options?.baudRate || 9600,
          dataBits: 8,
          stopBits: 1,
          parity: Parity.None,
        });

        // Listener de eventos
        port.onReceived((event: any) => {
          console.log(event);
          codigoBufferRef.current += hexToString(event.data);

          if (
            codigoBufferRef.current.includes("\n") ||
            codigoBufferRef.current.includes("\r")
          ) {
            const codigoCompleto = codigoBufferRef.current
              .replace(/[\r\n]/g, "")
              .trim();

            setScannedCode(codigoCompleto);
            setStatusLog("Código recibido con éxito.");
            console.log(codigoCompleto);

            if (onCodeScannedRef.current) {
              try {
                onCodeScannedRef.current(codigoCompleto);
              } catch (error) {
                console.error(error);
              }
            }

            codigoBufferRef.current = "";
          }
        });

        activePortRef.current = port;
        setStatusLog("Lector listo para escanear.");
      } catch (error: any) {
        activePortRef.current = null;
        setStatusLog(`Error: ${error.message || "Dispositivo no listo"}`);
      } finally {
        isConnectingRef.current = false;
      }
    };

    checkAndConnectUSB();
    connectionCheckInterval = setInterval(checkAndConnectUSB, 2500);

    return () => {
      clearInterval(connectionCheckInterval);
      if (activePortRef.current) {
        try {
          activePortRef.current.close();
        } catch (e) {}
      }
    };
  }, [options?.baudRate]);

  return {
    scannedCode,
    setScannedCode, // Por si quieres limpiar el input manualmente desde la UI
    statusLog,
  };
}
