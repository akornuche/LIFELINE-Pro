# WEEK 1 CHANGELOG — LIFELINE-Pro Platform

**Sprint Period**: Week 1  
**Focus**: Foundation fixes, pricing model restructure, entitlement enforcement, security hardening

---

## Summary

12 tasks completed across backend and frontend. The platform moves from ~45% to ~60% functional completeness with all critical data-model and security issues resolved.

---

## Changes by Category

### 1. Pricing & Package Model — RESTRUCTURED

**Files Changed**:
- `backend/src/constants/packages.js` — Complete rewrite
- `backend/src/config/constants.js` — Refactored to re-export from packages.js
- `frontend/src/views/patient/Subscription.vue` — 4-tier UI overhaul
- `frontend/src/stores/patient.js` — maxDependents mapping updated
- `database/schemas/01_core_tables.sql` — CHECK constraint updated
- `database/schemas/03_payment_tables.sql` — CHECK constraint updated

**What Changed**:
- **Old model**: 3 tiers (BASIC / MEDIUM / ADVANCED) with conflicting definitions in two files
- **New model**: 4 tiers matching business requirements:

| Tier | Price/month | Category | Provider Access | Max Dependents |
|------|------------|----------|-----------------|----------------|
| GENERAL | ₦1,500 | General | Doctors only | 4 |
| BASIC | ₦3,500 | Insurance | All providers | 4 |
| STANDARD | ₦5,500 | Insurance | All providers | 4 |
| PREMIUM | ₦10,000 | Insurance | All providers | 6 |

- Single source of truth: `backend/src/constants/packages.js` — all other files re-export
- Each tier now has `allowedProviderTypes` array for provider access control
- New exports: `PACKAGE_CATEGORIES`, `SERVICE_TYPES`, `AILMENT_CATEGORIES`, `DRUG_CATEGORIES`, `SURGERY_TYPES`, `LAB_TEST_TYPES`, `IMAGING_TYPES`

---

### 2. Entitlement Enforcement — WIRED IN

**Files Changed**:
- `backend/src/utils/entitlementChecker.js` — New `checkProviderAccess()` method
- `backend/src/services/doctorService.js` — Entitlement checks added to `createConsultation()`
- `backend/src/services/hospitalService.js` — Entitlement checks added to `scheduleSurgery()`
- `backend/src/services/pharmacyService.js` — Entitlement checks added to `dispensePrescription()`

**What Changed**:
- `EntitlementChecker` was previously orphaned (never called). Now enforced at every service entry point.
- **GENERAL plan patients are blocked from pharmacy and hospital access** (doctors only)
- Before creating a consultation/surgery/dispensing, the system now checks:
  1. Active subscription (existing check)
  2. Provider type access (`checkProviderAccess`) — enforces GENERAL = doctors only
  3. Service-specific entitlement (`isServiceEntitled`) — checks coverage limits for surgeries, drugs, etc.
- If any check fails, a `BusinessLogicError` is thrown with a human-readable reason

---

### 3. Medical → Payment Bridge — CONNECTED

**Files Changed**:
- `backend/src/services/doctorService.js` — Calls `processServicePayment` after consultation
- `backend/src/services/hospitalService.js` — Calls `processServicePayment` after surgery
- `backend/src/services/pharmacyService.js` — Calls `processServicePayment` after dispensing

**What Changed**:
- `paymentService.processServicePayment()` existed but was never called — medical actions created no financial records
- Now every consultation, surgery, and prescription dispensing automatically creates a payment record
- Payment creation is wrapped in try/catch — if it fails, the medical action still succeeds (logged as warning)
- Payment records link: `patientId`, `providerId`, `providerType`, `serviceType`, `packageType`

---

### 4. Frontend Service Layer — FIXED

**Files Changed**:
- `frontend/src/services/index.js`

**What Changed**:
Added 7 missing service methods that views were calling but didn't exist:
- `patientService.uploadProfilePhoto(formData)` → POST /patients/profile/photo
- `doctorService.getConsultation(id)` → GET /doctors/consultations/:id
- `pharmacyService.getPrescription(id)` → GET /pharmacies/prescriptions/:id
- `hospitalService.getSurgery(id)` → GET /hospitals/surgeries/:id
- `hospitalService.getBeds(params)` → GET /hospitals/beds
- `hospitalService.updateBed(id, data)` → PUT /hospitals/beds/:id
- `hospitalService.uploadLogo(formData)` → POST /hospitals/logo

---

### 5. Security Fixes

**Files Changed**:
- `frontend/src/views/admin/Settings.vue` — Removed Paystack secret key field

**What Changed**:
- **Paystack secret key input removed from admin UI** — secret keys must never exist on the frontend
- Replaced with informational text: "Secret key is configured server-side via environment variable (PAYSTACK_SECRET_KEY)"
- `paystack_secret_key` removed from the settings reactive ref

---

### 6. Router Guard Fix

**Files Changed**:
- `frontend/src/router/index.js`

**What Changed**:
- Patients without active subscriptions were locked out of ALL pages, including the subscription page itself
- Added whitelist: `['patient-subscription', 'patient-profile', 'patient-settings']`
- Patients can now access profile and settings even without a subscription

---

### 7. Admin Settings — NOW PERSISTS

**Files Changed**:
- `backend/src/routes/adminRoutes.js`

**What Changed**:
- **GET /api/admin/settings** was returning hardcoded defaults — now reads from `data/settings.json`
- **PUT /api/admin/settings** was a complete no-op (echoed body back) — now persists to `data/settings.json`
- Sensitive fields (`smtp_password`) are stripped before persisting
- Default settings include all platform config, feature flags, and Paystack public key

---

### 8. Audit Logging — ENABLED

**Files Changed**:
- `backend/src/server.js` — Uncommented and fixed `auditLog` middleware
- `backend/src/database/init.js` — Added all missing schema files (06–16)
- `backend/src/database/schemas/16_audit_logs.sql` — New file

**What Changed**:
- `audit_logs` table now created automatically on startup
- Audit logging middleware enabled globally — logs all API requests with user context
- Database init now runs ALL 16 schema files (was only running 01–05, missing 11 schemas including pricing, consultations, prescriptions, surgeries, lab tests, payments, dependents)

---

### 9. Registration Default — FIXED

**Files Changed**:
- `backend/src/models/patientRepository.js`

**What Changed**:
- Default `current_package` changed from `'BASIC'` to `'GENERAL'` in `createPatient()`
- New patients start on the cheapest General plan (₦1,500/month) which gives doctor access only

---

### 10. Response Pattern — VERIFIED (No Bug)

**Investigation Result**: The Axios interceptor (`return response.data`) and store usage (`response.data`) are correct — the interceptor strips the Axios envelope, and `.data` accesses the API response's inner data field. This is the standard pattern, not a double-unwrap.

---

## Files Modified (Full List)

| File | Action |
|------|--------|
| `backend/src/constants/packages.js` | Rewritten — 4-tier model, single source of truth |
| `backend/src/config/constants.js` | Rewritten — re-exports from packages.js |
| `backend/src/utils/entitlementChecker.js` | Enhanced — `checkProviderAccess()` added |
| `backend/src/services/doctorService.js` | Updated — entitlement checks + payment record |
| `backend/src/services/hospitalService.js` | Updated — entitlement checks + payment record |
| `backend/src/services/pharmacyService.js` | Updated — entitlement checks + payment record |
| `backend/src/models/patientRepository.js` | Updated — default package → GENERAL |
| `backend/src/routes/adminRoutes.js` | Rewritten — settings persistence via JSON file |
| `backend/src/server.js` | Updated — audit logging enabled |
| `backend/src/database/init.js` | Updated — all 16 schemas in init list |
| `backend/src/database/schemas/16_audit_logs.sql` | **New** — audit_logs table |
| `frontend/src/services/index.js` | Updated — 7 missing methods added |
| `frontend/src/views/patient/Subscription.vue` | Rewritten — 4-tier plan cards |
| `frontend/src/views/admin/Settings.vue` | Updated — secret key removed |
| `frontend/src/stores/patient.js` | Updated — maxDependents mapping |
| `frontend/src/router/index.js` | Updated — subscription guard whitelist |
| `database/schemas/01_core_tables.sql` | Updated — CHECK constraint |
| `database/schemas/03_payment_tables.sql` | Updated — CHECK constraint |

---

## Remaining Work (Week 2+)

- **Queue/Matching System**: No patient-to-provider matching exists yet
- **Paystack Payment Gateway Integration**: Subscription page still calls `createSubscription` without payment flow
- **Provider Verification Workflow**: Admin approval flow incomplete
- **Real-time Notifications**: Socket.IO commented out
- **Payment Reminder Service**: Commented out in server.js
- **Comprehensive Test Coverage**: Existing tests reference old 3-tier model
