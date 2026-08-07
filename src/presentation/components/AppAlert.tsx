import { AlertIcon, getAlertColor, getAlertTitle } from "@/constants/Alerts";
import { AppAlertProps } from "@/infraestructure/interfaces/alert.interface";
import React, { useEffect } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AppAlert({
  visible,
  type = "confirm",
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  icon,
}: AppAlertProps) {
  const isConfirm = type === "confirm";

  /* ================= FIX SUCCESS ================= */
  useEffect(() => {
    if (visible && type === "success") {
      const timer = setTimeout(() => {
        onConfirm?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [visible, type, onConfirm]);

  const getDefaultTitle = () => title ?? getAlertTitle(type);

  const getConfirmColor = () => getAlertColor(type);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={{ marginBottom: 15 }}>
            {icon ?? <AlertIcon type={type} />}
          </View>

          <Text style={styles.title}>{getDefaultTitle()}</Text>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            {isConfirm && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={[styles.buttonText, { color: "#ffffff" }]}>
                  {cancelText ?? "No"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: getConfirmColor() }]}
              onPress={onConfirm}
            >
              <Text style={styles.buttonText}>
                {confirmText ?? (isConfirm ? "SI" : "OK")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: 420,
    maxWidth: "90%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: "center",
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 25,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#d1d5db",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
