export enum FaseLavado {
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

export enum PlanLavado {
  FULL_WASH = 'LAVADO_COMPLETO',
}

// Exportar tanto tipo como valor para compatibilidad
export type WashStage = FaseLavado;
export const WashStage = FaseLavado;

export type WashPlan = PlanLavado;
export const WashPlan = PlanLavado;

export const SINGLE_WASH_PRICE_COP = 20000;
export const WASHES_FOR_FREE_REWARD = 5;
