import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";
import {
  mockStoreRepo, mockMenuRepo, mockOrderRepo, mockPaymentRepo,
  mockPointRepo, mockStampRepo, mockCouponRepo, mockChecklistRepo, mockNoticeRepo,
} from "./mock";
import {
  prismaStoreRepo, prismaMenuRepo, prismaOrderRepo, prismaPaymentRepo,
  prismaPointRepo, prismaStampRepo, prismaCouponRepo, prismaChecklistRepo, prismaNoticeRepo,
} from "./prisma";
import {
  sbStoreRepo, sbMenuRepo, sbOrderRepo, sbPaymentRepo,
  sbPointRepo, sbStampRepo, sbCouponRepo, sbChecklistRepo, sbNoticeRepo,
} from "./supabase";

// DATABASE_URL 있으면 Prisma, ANON_KEY만 있으면 Supabase JS, 둘 다 없으면 Mock
const usePrisma = !!process.env.DATABASE_URL;

function pick<T>(mock: T, prisma: T, sb: T): T {
  if (IS_MOCK_MODE) return mock;
  return usePrisma ? prisma : sb;
}

export const storeRepo = pick(mockStoreRepo, prismaStoreRepo, sbStoreRepo);
export const menuRepo = pick(mockMenuRepo, prismaMenuRepo, sbMenuRepo);
export const orderRepo = pick(mockOrderRepo, prismaOrderRepo, sbOrderRepo);
export const paymentRepo = pick(mockPaymentRepo, prismaPaymentRepo, sbPaymentRepo);
export const pointRepo = pick(mockPointRepo, prismaPointRepo, sbPointRepo);
export const stampRepo = pick(mockStampRepo, prismaStampRepo, sbStampRepo);
export const couponRepo = pick(mockCouponRepo, prismaCouponRepo, sbCouponRepo);
export const checklistRepo = pick(mockChecklistRepo, prismaChecklistRepo, sbChecklistRepo);
export const noticeRepo = pick(mockNoticeRepo, prismaNoticeRepo, sbNoticeRepo);

export type { IStoreRepository, IMenuRepository, IOrderRepository, IPaymentRepository,
  IPointRepository, IStampRepository, ICouponRepository, IChecklistRepository, INoticeRepository,
} from "./types";
