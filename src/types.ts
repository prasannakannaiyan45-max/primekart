export type UserRole = 'customer' | 'seller' | 'admin';
export type LoyaltyTier = 'Member' | 'Silver' | 'Gold' | 'Patron';
export type CurrencyCode = 'USD' | 'EUR' | 'INR' | 'GBP';
export type LanguageCode = 'EN' | 'FR' | 'DE' | 'JA';

export type ProductCategory =
  | 'Audio & Acoustics'
  | 'Architectural Living'
  | 'Botanical Formulation'
  | 'Precision Horology';

export type PaymentMethodType = 'Card' | 'UPI' | 'Wallet' | 'NetBanking' | 'COD';
export type PaymentStatusType = 'Paid' | 'Pending_COD' | 'Refunded';
export type DeliveryOptionType = 'Standard_Eco' | 'Express_Air' | 'White_Glove';

export type OrderStatusType =
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out_For_Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Return_Requested'
  | 'Refunded';

/**
 * Verbatim validation constants synced from firebase-blueprint.json
 */
export const BLUEPRINT_CONSTRAINTS = {
  ID_MAX_LENGTH: 128,
  ID_REGEX: /^[a-zA-Z0-9_\-]+$/,
  DISPLAY_NAME_MAX: 100,
  PRODUCT_TITLE_MAX: 140,
  PRODUCT_BRAND_MAX: 80,
  PRODUCT_SUBCATEGORY_MAX: 80,
  PRODUCT_DESC_MAX: 2000,
  PRODUCT_SPECS_MAX: 600,
  PRODUCT_ECO_TAG_MAX: 100,
  REVIEW_TITLE_MAX: 120,
  REVIEW_COMMENT_MAX: 1500,
  ORDER_ITEMS_SUMMARY_MAX: 1000,
  ORDER_SHIPPING_REGION_MAX: 120,
  COUPON_CODE_MAX: 32,
  COUPON_DESC_MAX: 200,
  ADDRESS_MAX: 300,
  CITY_MAX: 80,
  POSTAL_MAX: 20,
  PHONE_MAX: 30,
} as const;

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, BLUEPRINT_CONSTRAINTS.ID_MAX_LENGTH);
  return cleaned.length > 0 ? cleaned : 'doc_default';
}

export function clampString(val: string, min: number, max: number, fallback: string): string {
  const trimmed = (val || '').trim();
  if (trimmed.length < min) return fallback.slice(0, max);
  return trimmed.slice(0, max);
}

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  preferredCurrency: CurrencyCode;
  ecoPreference: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  country: string;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  originalPrice: number;
  stock: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  description: string;
  specsSummary: string;
  sustainabilityScore: number;
  carbonFootprintKg: number;
  ecoMaterialTag: string;
  sellerId: string;
  sellerName: string;
  isPublished: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProductReview {
  id: string;
  productId: string;
  authorId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  itemsSummary: string;
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  couponCode: string;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  deliveryOption: DeliveryOptionType;
  shippingRegion: string;
  status: OrderStatusType;
  trackingNumber: string;
  carbonOffsetKg: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  isActive: boolean;
  ecoBonus: boolean;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ============================================================================
// CYBERSECURITY & EXPLAINABLE AI RISK ENGINE TYPES
// ============================================================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type SecurityEventType =
  | 'BOT_ATTACK_DETECTED'
  | 'PAYMENT_ANOMALY'
  | 'NEW_DEVICE'
  | 'HIGH_RISK_ORDER'
  | 'NORMAL_TRANSACTION'
  | 'PARENT_APPROVAL_REQUEST'
  | 'CORRELATED_THREAT';

export interface RiskFactorContribution {
  points: number;
  label: string;
  category: 'bot' | 'payment' | 'account' | 'device' | 'order' | 'parental';
}

export interface SecurityEvaluationResult {
  evaluationId: string;
  timestamp: string;
  userId: string;
  sessionId: string;
  deviceId: string;
  botRiskScore: number;
  paymentRiskScore: number;
  accountRiskScore: number;
  deviceRiskScore: number;
  orderRiskScore: number;
  finalRiskScore: number;
  riskLevel: RiskLevel;
  decision: 'ALLOW' | 'STEP_UP_VERIFICATION' | 'PARENT_APPROVAL_REQUIRED' | 'BLOCK';
  whyFlagged: RiskFactorContribution[];
  correlatedSignals: string[];
  actionsTaken: string[];
  telemetrySnapshot: {
    requestsPerMin: number;
    repeatedProductRequests: number;
    checkoutAttempts: number;
    failedPaymentAttempts: number;
    paymentMethodsAttempted: number;
    isNewDevice: boolean;
    isNewAccount: boolean;
    orderValueInr: number;
  };
  parentApprovalRequest?: PendingParentApproval | null;
}

export interface SecurityEventLog {
  id: string;
  timestamp: string;
  userId: string;
  sessionId: string;
  deviceId: string;
  eventType: SecurityEventType;
  threatTitle: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: RiskFactorContribution[];
  signals: string[];
  actionsTaken: string[];
  actionSummary: 'ALLOW' | 'VERIFY' | 'BLOCK' | 'WAIT_PARENT';
  finalStatus: 'APPROVED' | 'VERIFICATION_REQUIRED' | 'THREAT_CONTAINED' | 'WAITING_PARENT' | 'PARENT_APPROVED' | 'PARENT_REJECTED';
}

export interface ParentalConfig {
  isChildAccount: boolean;
  maxSpendLimitInr: number;
  restrictedCategories: ProductCategory[];
  requireFirstTimeApproval: boolean;
  highValueThresholdInr: number;
  parentName: string;
}

export interface PendingParentApproval {
  id: string;
  timestamp: string;
  childUserId: string;
  childName: string;
  itemsSummary: string;
  orderValueInr: number;
  parentLimitInr: number;
  reason: string;
  status: 'WAITING_FOR_PARENT_APPROVAL' | 'APPROVED' | 'REJECTED';
  biometricAuthHash?: string;
}

export interface SecurityStateSnapshot {
  metrics: {
    threatsDetected: number;
    blockedTransactions: number;
    botAttacks: number;
    paymentAttacks: number;
    pendingParentApprovals: number;
    activeSuspiciousSessions: number;
  };
  activeSimMode: 'NORMAL' | 'BOT_ATTACK' | 'PAYMENT_ATTACK' | 'HIGH_RISK_CORRELATED' | 'PARENT_APPROVAL';
  liveTelemetry: {
    requestsPerMin: number;
    repeatedProductRequests: number;
    rapidAddToCartCount: number;
    checkoutAttempts: number;
    failedPaymentAttempts: number;
    paymentMethodsAttempted: number;
    accountsOnDevice: number;
    isNewDevice: boolean;
    isNewAccount: boolean;
    botRiskScore: number;
    paymentRiskScore: number;
    correlatedRiskScore: number;
  };
  parentalConfig: ParentalConfig;
  pendingApprovals: PendingParentApproval[];
  eventLogs: SecurityEventLog[];
}

