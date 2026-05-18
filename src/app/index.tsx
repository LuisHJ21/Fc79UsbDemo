import React, { useEffect, useState } from "react";

import { SafeAreaView, ScrollView, Text, View } from "react-native";

import {
  Parity,
  UsbSerialManager,
} from "react-native-usb-serialport-for-android";

export default function App() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);

    setLogs((prev) => [...prev, msg]);
  };

  useEffect(() => {
    const initUSB = async () => {
      try {
        addLog("Buscando USB...");

        const devices = await UsbSerialManager.list();

        addLog(JSON.stringify(devices, null, 2));

        if (!devices.length) {
          addLog("No hay dispositivos");

          return;
        }

        const device = devices[0];

        addLog("Conectando a: " + device.deviceId);

        await UsbSerialManager.tryRequestPermission(2004);
        const usbSerialport = await UsbSerialManager.open(2004, {
          baudRate: 38400,
          parity: Parity.None,
          dataBits: 8,
          stopBits: 1,
        });

        addLog("Puerto abierto");

        const sub = usbSerialport.onReceived((event) => {
          console.log(event.deviceId, event.data);
        });

        // mensaje de prueba
        // await serialport.send("HELLO\r\n");
      } catch (err: any) {
        addLog("ERROR: " + err.message);
      }
    };

    initUSB();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: 60,
      }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
          }}
        >
          FC79 USB SERIAL
        </Text>
      </View>

      <ScrollView
        style={{
          flex: 1,
          paddingHorizontal: 20,
        }}
      >
        {logs.map((item, index) => (
          <Text
            key={index}
            style={{
              marginBottom: 10,
              fontSize: 16,
            }}
          >
            {item}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
