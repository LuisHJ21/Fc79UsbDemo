export interface searchOt {
  codigoArt: string;
  ot: string;
  operacion: string;
}

export interface dataDetalle {
  db?: string;
  codigoArt: string;
  ot: string;
  fechaProd: string;
  traza: string;
  lote?: string;
  bultos: string;
  peso: string;
  movamp?: string;
  orgamp?: string;
  adicional?: string;
  max?: string;
  plan: string;
}

// data detalle formulario
export type formDetalle = Omit<dataDetalle, "codigoArt">;

export interface DataFormPallet {
  numPallet?: string;
  usuario?: string;
  // adicional: string;
  // bultosT: string;
  codigoArt: string;
  estado: string;
  // pesoT: string;
  detalles: formDetalle[];
  observacion: string;
}
// data de los QR
export type dataQr = Omit<
  dataDetalle,
  "db" | "peso" | "bultos" | "movamp" | "orgamp" | "plan"
>;
