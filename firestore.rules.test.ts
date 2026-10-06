/**
 * Adversarial Security Rules Test Specification ("Dirty Dozen" Payloads)
 * Verifies that all 12 adversarial payloads against Aetheria's Firestore rules return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Privilege Escalation: Self-Assigned Admin Role on User Profile Creation',
    operation: 'create',
    path: '/users/attacker_01',
    auth: { uid: 'attacker_01', email: 'attacker@example.com', email_verified: true },
    payload: {
      uid: 'attacker_01',
      displayName: 'Malicious User',
      role: 'admin',
      loyaltyPoints: 999999,
      loyaltyTier: 'Patron',
      preferredCurrency: 'USD',
      ecoPreference: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Update: Injecting Undeclared Ghost Field on Product',
    operation: 'create',
    path: '/products/prod_shadow_01',
    auth: { uid: 'seller_01', email: 'seller@example.com', email_verified: true },
    payload: {
      id: 'prod_shadow_01',
      title: 'Minimalist Speaker',
      isVerifiedByPlatform: true, // Ghost field rejected by hasOnly()
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Email Spoofing: Bootstrapped Admin Email with email_verified = false',
    operation: 'get',
    path: '/admins/admin_root',
    auth: { uid: 'spoof_uid', email: 'prasannakannaiyan45@gmail.com', email_verified: false },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'PII Blanket Read: Authenticated Non-Owner Reading Private User Info',
    operation: 'get',
    path: '/users/victim_user/private/info',
    auth: { uid: 'other_user', email: 'other@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'ID Poisoning: Special Characters in Document Path Variable',
    operation: 'create',
    path: '/products/bad$id*injection!',
    auth: { uid: 'seller_01', email: 'seller@example.com', email_verified: true },
    payload: { id: 'bad$id*injection!' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Value Poisoning: Updating Whitelisted Order Status to Invalid Enum Value',
    operation: 'update',
    path: '/orders/order_101',
    auth: { uid: 'seller_01', email: 'seller@example.com', email_verified: true },
    payload: { status: 'FORCE_COMPLETED_BYPASS' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Terminal State Unlock Attempt: Modifying a Cancelled Order',
    operation: 'update',
    path: '/orders/order_cancelled_01',
    auth: { uid: 'seller_01', email: 'seller@example.com', email_verified: true },
    payload: { status: 'Shipped' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Master Gate Bypass: Creating Review Under Non-Existent Product',
    operation: 'create',
    path: '/products/non_existent_prod/reviews/rev_01',
    auth: { uid: 'cust_01', email: 'cust@example.com', email_verified: true },
    payload: {
      id: 'rev_01',
      productId: 'non_existent_prod',
      authorId: 'cust_01',
      authorName: 'Customer',
      rating: 5,
      title: 'Great',
      comment: 'Orphaned review attempt',
      verifiedPurchase: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Identity Spoofing: Creating Order on Behalf of Another Customer UID',
    operation: 'create',
    path: '/orders/order_spoof_01',
    auth: { uid: 'attacker_01', email: 'attacker@example.com', email_verified: true },
    payload: {
      id: 'order_spoof_01',
      customerId: 'victim_uid',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immortal Field Mutation: Seller Attempting to Transfer Product sellerId',
    operation: 'update',
    path: '/products/prod_01',
    auth: { uid: 'seller_01', email: 'seller@example.com', email_verified: true },
    payload: {
      sellerId: 'other_seller_uid',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Temporal Forgery: Client-Provided Backdated createdAt Timestamp',
    operation: 'create',
    path: '/coupons/FAKE2020',
    auth: { uid: 'seller_01', email: 'seller@example.com', email_verified: true },
    payload: {
      code: 'FAKE2020',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Query Trust Violation: Unfiltered List Query on Orders by Unrelated User',
    operation: 'list',
    path: '/orders',
    auth: { uid: 'random_user', email: 'random@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
