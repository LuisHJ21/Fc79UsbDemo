//--- GRUPOS: 1 ORIGEN, 2 PROCESO, 3 ESPECIE, 4 DIA, 5 MES, 6 AÑO, 7 TURNO, 8 CORRELATIVO
export const TRAZA_REGEX =
  /^([EI])(\d)(\d{2})-(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(\d{2})-([DN])-(\d{4})$/i;

export type TrazaPartes = {
  origen: string;
  proceso: string;
  especie: string;
  dia: string;
  mes: string;
  anio: string;
  turno: string;
  correlativo: string;
  completa: string;
  base: string;
};

export const parseTraza = (traza: string): TrazaPartes | null => {
  const texto = String(traza || "")
    .trim()
    .toUpperCase();

  const match = TRAZA_REGEX.exec(texto);

  if (!match) return null;

  const [, origen, proceso, especie, dia, mes, anio, turno, correlativo] =
    match;

  return {
    origen,
    proceso,
    especie,
    dia,
    mes,
    anio,
    turno,
    correlativo,
    completa: texto,
    base: `${origen}${proceso}${especie}-${dia}${mes}${anio}-${turno}`,
  };
};

//--- SOLO VALIDA EL FORMATO
export const esTrazaValida = (traza: string): boolean =>
  parseTraza(traza) !== null;

/*
 * BASE DE LA TRAZA (ORIGEN + PROCESO + ESPECIE + FECHA + TURNO).
 */
export const obtenerBaseTraza = (traza: string): string | null =>
  parseTraza(traza)?.base ?? null;
