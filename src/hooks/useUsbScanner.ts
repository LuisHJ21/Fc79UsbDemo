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
  scanCooldownMs?: number; // Tiempo mínimo entre una lectura y la siguiente
}

const DEFAULT_SCAN_COOLDOWN_MS = 3000;

export type UsbScannerStatus =
  | "iniciando"
  | "esperando"
  | "conectando"
  | "listo"
  | "error";

export function useUsbScanner(options?: UseUsbScannerOptions) {
  const [statusLog, setStatusLog] = useState<string>(
    "Iniciando sistema USB...",
  );
  const [statusType, setStatusType] = useState<UsbScannerStatus>("iniciando");
  const [scannedCode, setScannedCode] = useState<string>("");

  const activePortRef = useRef<any>(null);
  const isConnectingRef = useRef<boolean>(false);
  const codigoBufferRef = useRef<string>("");

  // Momento de la última lectura aceptada: las que lleguen antes de que se
  // cumpla el cooldown se descartan (el lector suele disparar varias seguidas).
  const ultimaLecturaRef = useRef<number>(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cooldownMs = options?.scanCooldownMs ?? DEFAULT_SCAN_COOLDOWN_MS;
  const cooldownMsRef = useRef(cooldownMs);
  useEffect(() => {
    cooldownMsRef.current = cooldownMs;
  }, [cooldownMs]);

  // Devuelve el estado a "listo" cuando termina la espera entre lecturas
  const programarFinCooldown = (ms: number) => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);

    cooldownTimerRef.current = setTimeout(() => {
      cooldownTimerRef.current = null;

      if (activePortRef.current) {
        setStatusLog("Lector listo para escanear.");
        setStatusType("listo");
      }
    }, ms);
  };

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

        //console.log(devices);

        // Manejo de desconexión
        if (!devices || devices.length === 0) {
          if (activePortRef.current) {
            setStatusLog("Lector USB desconectado.");
            setStatusType("esperando");
            activePortRef.current = null;
          } else {
            setStatusLog("Conecte el lector USB...");
            setStatusType("esperando");
          }
          return;
        }

        if (activePortRef.current) return;

        // Intentar conectar
        isConnectingRef.current = true;
        const targetDevice = devices[0];
        setStatusLog("Conectando al lector...");
        setStatusType("conectando");

        await UsbSerialManager.tryRequestPermission(targetDevice.deviceId);

        const port = await UsbSerialManager.open(targetDevice.deviceId, {
          baudRate: options?.baudRate || 9600,
          dataBits: 8,
          stopBits: 1,
          parity: Parity.None,
        });

        // Listener de eventos
        port.onReceived((event: any) => {
          codigoBufferRef.current += hexToString(event.data);
          console.log(event.data);

          /* if (
            codigoBufferRef.current.includes("\n") ||
            codigoBufferRef.current.includes("\r")
          ) */
          if (codigoBufferRef.current.endsWith("\r\n")) {
            //  if (codigoBufferRef.current.includes("=")) {
            console.log("entre");
            const codigoCompleto = codigoBufferRef.current
              .replace(/[\r\n]/g, "")
              .trim();

            codigoBufferRef.current = "";

            // Cooldown entre código y código: se ignora la lectura completa
            const ahora = Date.now();
            const transcurrido = ahora - ultimaLecturaRef.current;

            if (transcurrido < cooldownMsRef.current) {
              const restante = cooldownMsRef.current - transcurrido;
              setStatusLog(
                `Espere ${Math.ceil(restante / 1000)}s para escanear...`,
              );
              setStatusType("esperando");
              programarFinCooldown(restante);
              return;
            }

            ultimaLecturaRef.current = ahora;

            setStatusLog(
              `Espere ${Math.ceil(cooldownMsRef.current / 1000)}s restantes para escanear otro código`,
            );
            setStatusType("esperando");
            programarFinCooldown(cooldownMsRef.current);

            setScannedCode(codigoCompleto);
            // setStatusLog("Código recibido con éxito.");
            console.log(codigoCompleto);

            if (onCodeScannedRef.current) {
              try {
                onCodeScannedRef.current(codigoCompleto);
              } catch (error) {
                console.error(error);
              }
            }
          }
        });

        activePortRef.current = port;
        setStatusLog("Lector listo para escanear.");
        setStatusType("listo");
      } catch (error: any) {
        activePortRef.current = null;

        setStatusLog(`Error: ${error.message || "Dispositivo no listo"}`);
        setStatusType("error");
      } finally {
        isConnectingRef.current = false;
      }
    };

    checkAndConnectUSB();
    connectionCheckInterval = setInterval(checkAndConnectUSB, 2500);

    return () => {
      clearInterval(connectionCheckInterval);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
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
    statusType,
  };
}
