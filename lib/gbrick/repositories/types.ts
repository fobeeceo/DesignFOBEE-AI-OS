import {
  GbOrderStatus,
  GbPaymentMethod,
  GbPaymentStatus,
  GbPointLedgerType,
  GbStampLedgerType,
} from "@prisma/client";

// ─── Shared DTOs ─────────────────────────────────────────────

export interface StoreDto {
  id: string;
  code: string;
  name: string;
  status: string;
  address: string;
  phone?: string | null;
  pointRate: number;
  stampGoal: number;
  imageUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  operatingHours?: unknown;
}

export interface MenuCategoryDto {
  id: string;
  name: string;
  nameEn?: string | null;
  sortOrder: number;
  menus: MenuDto[];
}

export interface MenuDto {
  id: string;
  categoryId: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  isSignature: boolean;
  isNew: boolean;
  isSoldOut: boolean;
  tags: string[];
  options: MenuOptionDto[];
  storeAvailability?: StoreMenuAvailabilityDto[];
}

export interface MenuOptionDto {
  id: string;
  menuId: string;
  name: string;
  extraPrice: number;
  isDefault: boolean;
  isRequired: boolean;
  groupName?: string | null;
  sortOrder: number;
}

export interface StoreMenuAvailabilityDto {
  storeId: string;
  menuId: string;
  isSoldOut: boolean;
  price?: number | null;
}

export interface OrderItemInput {
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  options?: {
    menuOptionId: string;
    optionName: string;
    extraPrice: number;
  }[];
}

export interface CreateOrderInput {
  storeId: string;
  customerId?: string;
  isGuest?: boolean;
  guestName?: string;
  guestPhone?: string;
  items: OrderItemInput[];
  pickupName?: string;
  note?: string;
  pointUsed?: number;
  couponIssueId?: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  storeId: string;
  customerId?: string | null;
  status: GbOrderStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  pointEarned: number;
  pointUsed: number;
  couponDiscount: number;
  pickupName?: string | null;
  note?: string | null;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItemDto[];
  store?: { name: string };
  payment?: PaymentDto | null;
}

export interface OrderItemDto {
  id: string;
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options: { optionName: string; extraPrice: number }[];
}

export interface PaymentDto {
  id: string;
  orderId: string;
  method: GbPaymentMethod;
  status: GbPaymentStatus;
  amount: number;
  pgTransactionId?: string | null;
  paidAt?: Date | null;
}

export interface PointAccountDto {
  id: string;
  customerId: string;
  balance: number;
  totalEarned: number;
  totalUsed: number;
}

export interface PointLedgerDto {
  id: string;
  accountId: string;
  orderId?: string | null;
  type: GbPointLedgerType;
  amount: number;
  balanceAfter: number;
  note?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
}

export interface StampAccountDto {
  id: string;
  customerId: string;
  storeId: string;
  balance: number;
  totalEarned: number;
  totalUsed: number;
}

export interface StampLedgerDto {
  id: string;
  accountId: string;
  orderId?: string | null;
  type: GbStampLedgerType;
  amount: number;
  balanceAfter: number;
  createdAt: Date;
}

export interface CouponDto {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  discountAmount?: number | null;
  discountRate?: number | null;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  perCustomerLimit: number;
  validFrom: Date;
  validUntil: Date;
}

export interface CouponIssueDto {
  id: string;
  couponId: string;
  customerId: string;
  issuedAt: Date;
  expiresAt?: Date | null;
  redeemed: boolean;
  coupon: CouponDto;
}

export interface ChecklistDto {
  id: string;
  storeId: string;
  title: string;
  category: string;
  isActive: boolean;
  items: { id: string; title: string; isRequired: boolean; sortOrder: number }[];
}

export interface StoreNoticeDto {
  id: string;
  storeId?: string | null;
  isGlobal: boolean;
  title: string;
  content: string;
  isPinned: boolean;
  publishedAt?: Date | null;
  createdBy: string;
}

// ─── Repository Interfaces ───────────────────────────────────

export interface OperatingHour {
  open: string;
  close: string;
  closed: boolean;
}
export interface StoreOperatingHours {
  mon: OperatingHour; tue: OperatingHour; wed: OperatingHour;
  thu: OperatingHour; fri: OperatingHour; sat: OperatingHour; sun: OperatingHour;
}

export interface IStoreRepository {
  findMany(status?: string): Promise<StoreDto[]>;
  findById(id: string): Promise<StoreDto | null>;
  findMenus(storeId: string): Promise<MenuCategoryDto[]>;
  updateSoldOut(storeId: string, menuId: string, isSoldOut: boolean): Promise<void>;
  update(id: string, data: { operatingHours?: StoreOperatingHours; phone?: string; imageUrl?: string }): Promise<StoreDto>;
}

export interface IMenuRepository {
  findCategories(storeId?: string): Promise<MenuCategoryDto[]>;
  updateMenu(menuId: string, data: {
    name?: string; nameEn?: string; description?: string;
    basePrice?: number; imageUrl?: string; isSignature?: boolean; isNew?: boolean;
  }): Promise<void>;
}

export interface IOrderRepository {
  findById(id: string): Promise<OrderDto | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderDto | null>;
  findByCustomer(customerId: string, limit?: number): Promise<OrderDto[]>;
  findByStore(storeId: string, status?: GbOrderStatus): Promise<OrderDto[]>;
  create(input: CreateOrderInput & { orderNumber: string; totalAmount: number; finalAmount: number; pointEarned: number; couponDiscount?: number }): Promise<OrderDto>;
  updateStatus(orderId: string, status: GbOrderStatus, changedBy: string, note?: string): Promise<OrderDto>;
}

export interface IPaymentRepository {
  findByOrderId(orderId: string): Promise<PaymentDto | null>;
  createMockPayment(orderId: string, amount: number): Promise<PaymentDto>;
  failPayment(paymentId: string): Promise<PaymentDto>;
  checkIdempotency(key: string): Promise<PaymentDto | null>;
  saveIdempotency(key: string, payment: PaymentDto): Promise<void>;
}

export interface IPointRepository {
  findOrCreateAccount(customerId: string): Promise<PointAccountDto>;
  getBalance(customerId: string): Promise<number>;
  getLedgers(customerId: string, limit?: number): Promise<PointLedgerDto[]>;
  earnPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string): Promise<PointLedgerDto>;
  redeemPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string): Promise<PointLedgerDto>;
  refundPoints(accountId: string, orderId: string, amount: number, idempotencyKey: string): Promise<PointLedgerDto>;
  checkIdempotency(key: string): Promise<boolean>;
}

export interface IStampRepository {
  findOrCreateAccount(customerId: string, storeId: string): Promise<StampAccountDto>;
  earnStamps(accountId: string, orderId: string, amount: number, idempotencyKey: string): Promise<StampLedgerDto>;
  redeemStamps(accountId: string, amount: number, idempotencyKey: string): Promise<StampLedgerDto>;
  checkIdempotency(key: string): Promise<boolean>;
}

export interface ICouponRepository {
  findByCode(code: string): Promise<CouponDto | null>;
  findCustomerCoupons(customerId: string): Promise<CouponIssueDto[]>;
  findIssueById(issueId: string): Promise<CouponIssueDto | null>;
  issueToCustomer(couponId: string, customerId: string, expiresAt?: Date): Promise<CouponIssueDto>;
  redeemCoupon(issueId: string, orderId: string, discountApplied: number): Promise<void>;
}

export interface IChecklistRepository {
  findByStore(storeId: string): Promise<ChecklistDto[]>;
  completeChecklist(checklistId: string, completedBy: string, completedByName: string, itemsChecked: Record<string, boolean>, notes?: string): Promise<{ id: string }>;
}

export interface INoticeRepository {
  findByStore(storeId: string): Promise<StoreNoticeDto[]>;
}
