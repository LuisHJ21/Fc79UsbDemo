import { Href } from "expo-router";
import { ReactNode } from "react";

/* HEADER */
export interface HeaderProps {
  title?: string;
  user?: string;
  icon?: ReactNode;
  onLogout?: () => void;
  onOpenTurno?: () => void;
}

/* APP ALERT */
type AlertType = "confirm" | "success" | "warning" | "error";

export interface AppAlertProps {
  visible: boolean;
  type?: AlertType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  icon?: React.ReactNode;
}

/* TABS */
export interface TabItem {
  label: string;
  route: Href;
}

/* COMBO BOX */
export interface ComboOption {
  label: string;
  value: string;
  cod_articulo?: string;
}

export interface ComboProps {
  label: string;
  value: string;
  options: ComboOption[];
  onSelect: (value: string) => void;
}
