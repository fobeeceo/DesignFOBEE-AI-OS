import { GbStoreUserRole } from "@prisma/client";

export const GBRICK_BRAND = {
  name: "GBRICK Coffee",
  nameKo: "지브릭커피",
  primaryColor: "#2C1A0E",
  accentColor: "#C8873A",
  phone: "02-517-1474",
} as const;

export const POINT_DEFAULTS = {
  rate: 0.03,
  minEarnAmount: 1000,
  maxEarnPerOrder: 10000,
  expiryDays: 365,
} as const;

export const STAMP_DEFAULTS = {
  perOrder: 1,
  goal: 10,
} as const;

export const HQ_ROLES: GbStoreUserRole[] = [
  GbStoreUserRole.HQ_SUPER_ADMIN,
  GbStoreUserRole.HQ_ADMIN,
  GbStoreUserRole.HQ_MANAGER,
];

export const STORE_ROLES: GbStoreUserRole[] = [
  GbStoreUserRole.STORE_OWNER,
  GbStoreUserRole.STORE_MANAGER,
  GbStoreUserRole.STORE_STAFF,
];

export const ROLE_HIERARCHY: Record<GbStoreUserRole, number> = {
  HQ_SUPER_ADMIN: 100,
  HQ_ADMIN: 90,
  HQ_MANAGER: 80,
  STORE_OWNER: 70,
  STORE_MANAGER: 60,
  STORE_STAFF: 50,
};
