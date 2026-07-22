import { MaterialCommunityIcons } from "@expo/vector-icons";

export type AlertType = "success" | "error" | "warning" | "cancel" | "confirm";

export interface AlertConfig {
  /** Color principal (texto, borde, botón) */
  color: string;
  /** Fondo suave para el círculo/contenedor del ícono */
  softColor: string;
  /** Título por defecto */
  title: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const AlertConfigs: Record<AlertType, AlertConfig> = {
  success: {
    color: "#16A34A",
    softColor: "#DCFCE7",
    title: "¡OPERACIÓN EXITOSA!",
    iconName: "check-circle",
  },
  error: {
    color: "#DC2626",
    softColor: "#FEE2E2",
    title: "ERROR",
    iconName: "close-circle",
  },
  warning: {
    color: "#F59E0B",
    softColor: "#FEF3C7",
    title: "ADVERTENCIA",
    iconName: "alert",
  },
  cancel: {
    color: "#6B7280",
    softColor: "#F3F4F6",
    title: "CANCELADO",
    iconName: "cancel",
  },
  confirm: {
    color: "#3B82F6",
    softColor: "#DBEAFE",
    title: "CONFIRMAR ACCIÓN",
    iconName: "help-circle",
  },
};

interface AlertIconProps {
  type: AlertType;
  size?: number;
  color?: string;
}

export const AlertIcon = ({ type, size = 56, color }: AlertIconProps) => {
  const config = AlertConfigs[type];
  return (
    <MaterialCommunityIcons
      name={config.iconName}
      size={size}
      color={color ?? config.color}
    />
  );
};

export const getAlertColor = (type: AlertType) => AlertConfigs[type].color;
export const getAlertTitle = (type: AlertType) => AlertConfigs[type].title;
