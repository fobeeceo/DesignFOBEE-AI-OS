import { IS_MOCK_MODE } from "@/lib/gbrick/mockData";
import {
  mockStoreRepo, mockMenuRepo, mockOrderRepo, mockPaymentRepo,
  mockPointRepo, mockStampRepo, mockCouponRepo, mockChecklistRepo, mockNoticeRepo,
} from "./mock";
import {
  prismaStoreRepo, prismaMenuRepo, prismaOrderRepo, prismaPaymentRepo,
  prismaPointRepo, prismaStampRepo, prismaCouponRepo, prismaChecklistRepo, prismaNoticeRepo,
} from "./prisma";

export const storeRepo = IS_MOCK_MODE ? mockStoreRepo : prismaStoreRepo;
export const menuRepo = IS_MOCK_MODE ? mockMenuRepo : prismaMenuRepo;
export const orderRepo = IS_MOCK_MODE ? mockOrderRepo : prismaOrderRepo;
export const paymentRepo = IS_MOCK_MODE ? mockPaymentRepo : prismaPaymentRepo;
export const pointRepo = IS_MOCK_MODE ? mockPointRepo : prismaPointRepo;
export const stampRepo = IS_MOCK_MODE ? mockStampRepo : prismaStampRepo;
export const couponRepo = IS_MOCK_MODE ? mockCouponRepo : prismaCouponRepo;
export const checklistRepo = IS_MOCK_MODE ? mockChecklistRepo : prismaChecklistRepo;
export const noticeRepo = IS_MOCK_MODE ? mockNoticeRepo : prismaNoticeRepo;

export type { IStoreRepository, IMenuRepository, IOrderRepository, IPaymentRepository,
  IPointRepository, IStampRepository, ICouponRepository, IChecklistRepository, INoticeRepository,
} from "./types";
