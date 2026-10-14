export enum WashStage {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  BARRIER_OPENED = 'BARRIER_OPENED',
  VEHICLE_POSITIONED = 'VEHICLE_POSITIONED',
  STAGE_SHAMPOO = 'STAGE_SHAMPOO',       // 1. Agua con Shampoo
  STAGE_SPONGES = 'STAGE_SPONGES',       // 2. Esponjas / Rodillos de frotado
  STAGE_RINSE = 'STAGE_RINSE',           // 3. Agua limpia para enjuagar
  STAGE_FAN_DRYING = 'STAGE_FAN_DRYING', // 4. Abanico / Turbina de secado
  STAGE_FINISHED = 'STAGE_FINISHED',     // 5. Lavado completado / Salida
  CANCELLED = 'CANCELLED',
}

export enum WashPlan {
  FULL_WASH = 'LAVADO_COMPLETO', // Único lavado unificado
}

export const SINGLE_WASH_PRICE_COP = 20000; // Precio único sugerido ($20.000 COP)
export const WASHES_FOR_FREE_REWARD = 5;     // Cada 5 lavados, el 6to es GRATIS
