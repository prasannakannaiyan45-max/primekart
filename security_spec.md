# Security Specification — Aetheria E-Commerce Platform

## 1. Data Invariants & Master Source of Truth

1. **Global Default-Deny**: Every path not explicitly matched under `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Invariant**: All write mutations require `request.auth != null && request.auth.token.email_verified == true`. Unverified email tokens cannot spoof administrator or customer privileges.
3. **RBAC & Self-Assignment Prevention**:
   - Auth tokens are never trusted for custom role claims.
   - Administrator privileges (`isAdmin()`) require either a verified bootstrapped admin email (`prasannakannaiyan45@gmail.com` with `email_verified == true`) or an existing document in `/admins/$(request.auth.uid)`.
   - Users creating `/users/{userId}` cannot self-assign `role == 'admin'` unless `isAdmin()` evaluates to true.
   - Users updating `/users/{userId}` cannot escalate their `role` to `'admin'`.
4. **PII Split-Collection Isolation**:
   - Public profile preferences live in `/users/{userId}`.
   - Sensitive PII (`email`, `phone`, `shippingAddress`, `city`, `postalCode`, `country`) is strictly isolated in `/users/{userId}/private/{docId}` and readable only by `isOwner(userId) || isAdmin()`.
5. **Master Gate (Relational Sync)**:
   - Reviews in `/products/{productId}/reviews/{reviewId}` require the parent `/products/{productId}` document to exist and have `isPublished == true`.
   - Private user records in `/users/{userId}/private/{docId}` require the parent `/users/{userId}` document to exist.
   - Orders in `/orders/{orderId}` require the customer's `/users/{customerId}` profile to exist on creation.
6. **Terminal State Locking**:
   - Once an Order reaches a terminal status (`'Cancelled'` or `'Refunded'`), all non-admin updates are blocked.
7. **Temporal & Immortal Field Integrity**:
   - `createdAt` must equal `request.time` on creation and remain immutable (`incoming().createdAt == existing().createdAt`) on update.
   - `updatedAt` must equal `request.time` on every creation and update.
   - Ownership identifiers (`uid`, `sellerId`, `customerId`, `authorId`, `createdBy`) are immutable after creation.
8. **Secure List Queries (Cost-Optimized Query Enforcer)**:
   - Every `allow list` rule validates `resource.data` directly without invoking `get()` or `exists()` to prevent O(n) read amplification while blocking unauthorized collection scraping.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 — Privilege Escalation (Self-Assigned Admin Role)**:
   `POST /users/attacker_uid` with `{ role: "admin", ... }` by a non-admin user -> `PERMISSION_DENIED`.
2. **Payload 2 — Shadow Field Injection on Product Creation**:
   `POST /products/prod_1` with `{ ..., isFeaturedHack: true }` -> Rejected by `data.keys().hasOnly(...)` -> `PERMISSION_DENIED`.
3. **Payload 3 — Unverified Email Spoofing Bootstrapped Admin**:
   `GET /admins/any` with `auth.token.email == 'prasannakannaiyan45@gmail.com'` and `email_verified == false` -> Rejected by `isVerifiedUser()` -> `PERMISSION_DENIED`.
4. **Payload 4 — PII Horizontal Scraping**:
   `GET /users/victim_uid/private/info` by `attacker_uid` -> Rejected by `isOwner(userId) || isAdmin()` -> `PERMISSION_DENIED`.
5. **Payload 5 — ID Poisoning (Oversized/Malformed Path ID)**:
   `PUT /products/invalid$id!with*spaces` -> Rejected by `isValidId(productId)` -> `PERMISSION_DENIED`.
6. **Payload 6 — Value Poisoning on Whitelisted Update Key**:
   `PATCH /orders/ord_1` modifying allowed key `status` to `"HACKED_STATE"` -> Rejected by `isValidOrder(incoming())` wrapping the update block -> `PERMISSION_DENIED`.
7. **Payload 7 — Terminal State Resurrection**:
   `PATCH /orders/ord_cancelled` changing `status` from `'Cancelled'` to `'Shipped'` by seller -> Rejected by Terminal State Lock `!(existing().status in ['Cancelled', 'Refunded'])` -> `PERMISSION_DENIED`.
8. **Payload 8 — Orphaned Subcollection Write (Master Gate Bypass)**:
   `POST /products/non_existent_product/reviews/rev_1` -> Rejected by `exists(/databases/$(database)/documents/products/$(productId))` -> `PERMISSION_DENIED`.
9. **Payload 9 — Identity Spoofing on Order Creation**:
   `POST /orders/ord_99` with `customerId: "victim_uid"` while authenticated as `"attacker_uid"` -> Rejected by `incoming().customerId == request.auth.uid` -> `PERMISSION_DENIED`.
10. **Payload 10 — Immortal Field Tampering (`createdAt` / `sellerId`)**:
    `PATCH /products/prod_1` attempting to alter `createdAt` or `sellerId` -> Rejected by `incoming().createdAt == existing().createdAt && incoming().sellerId == existing().sellerId` -> `PERMISSION_DENIED`.
11. **Payload 11 — Temporal Forgery (Client-Backdated Timestamp)**:
    `POST /orders/ord_100` with `createdAt: Timestamp(2020, 1, 1)` != `request.time` -> Rejected by `incoming().createdAt == request.time` -> `PERMISSION_DENIED`.
12. **Payload 12 — Unauthorized Order List Scraping**:
    `LIST /orders` without filtering by `customerId == request.auth.uid` or `sellerId == request.auth.uid` -> Rejected by `allow list` resource check -> `PERMISSION_DENIED`.

---

## 3. Red Team Audit & Conflict Report

| Collection | Identity Spoofing | State Shortcutting | Resource / Value Poisoning | PII Isolation | Query Enforcer (`list`) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admins/{adminId}` | Guarded (`isAdmin()`) | Immutable (`update: false`) | `isValidAdminMarker` + `isValidId` | Non-PII UID only | Restricted to owner/bootstrapped admin | PASS |
| `/users/{userId}` | Guarded (`uid == auth.uid`) | Role escalation blocked | `isValidUserProfile` wraps `update` | Non-PII only | Restricted to `resource.data.uid == auth.uid` | PASS |
| `/users/{userId}/private/{docId}` | Guarded (`uid == auth.uid`) | Master Gate checks parent `/users` | `isValidUserPrivateInfo` wraps `update` | Strictly owner/admin | Restricted to owner/bootstrapped admin | PASS |
| `/products/{productId}` | Guarded (`sellerId == auth.uid`) | Action-based `affectedKeys().hasOnly()` | `isValidProduct` wraps `update` | Public catalog | Checks `isPublished == true` or seller | PASS |
| `/products/{productId}/reviews/{reviewId}` | Guarded (`authorId == auth.uid`) | Master Gate verifies published product | `isValidProductReview` wraps `update` | Display name only | Scoped to `productId` | PASS |
| `/orders/{orderId}` | Guarded (`customerId == auth.uid`) | Terminal lock on `Cancelled`/`Refunded` | `isValidOrder` wraps `update` | Shipping region summary only | Restricted to `customerId` or `sellerId` | PASS |
| `/coupons/{couponId}` | Guarded (`createdBy == auth.uid`) | Action-based `affectedKeys().hasOnly()` | `isValidCoupon` wraps `update` | Non-PII promo data | Restricted to `isActive == true` or creator | PASS |
