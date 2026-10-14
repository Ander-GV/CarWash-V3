export enum Rol {
  CLIENT = 'ROLE_CLIENT',
  OPERATOR = 'ROLE_OPERATOR',
  ADMIN = 'ROLE_ADMIN',
}

// Exportar tanto tipo como valor para compatibilidad
export type Role = Rol;
export const Role = Rol;
