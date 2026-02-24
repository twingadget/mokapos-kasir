export const APP_NAME = "Moka POS";
export const SESSION_COOKIE = "moka_pos_session";

export const ROLES = {
    ADMIN: "admin",
    KASIR: "kasir",
    WAITER: "waiter",
    MANAGER: "manager",
} as const;

export const ORDER_STATUS = {
    PAID: "PAID",
    OPEN_BILL: "OPEN_BILL",
    WAITING: "WAITING",
    VOID: "VOID",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
export type OrderStatusName = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
