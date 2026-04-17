# LIFELINE-Pro Phase 3 Audit Report

**Date:** 2026-04-13  
**Scope:** Comprehensive gap analysis post Phase 1 + Phase 2  
**Method:** Static analysis of full codebase

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **P0 – Crash** | 2 | Will cause runtime errors when users hit affected paths |
| **P1 – Major** | 8 | Core features missing or non-functional end-to-end |
| **P2 – Moderate** | 7 | Partial implementations, schema drift, dead code |
| **P3 – Polish** | 6 | TODOs, unused deps, cosmetic gaps |

---

## 1. Missing Backend Routes (Frontend → 404)

### 1a. `GET /api/doctors/consultations/:id` — **P0 CRASH**

- **What:** Frontend `doctorService.getConsultation(id)` calls `GET /api/doctors/consultations/:id`. Backend `doctorRoutes.js` only defines `GET /consultations` (list) and `PUT /consultations/:consultationId` (update). **No GET-by-ID route exists.**
- **Views affected:** `frontend/src/views/doctor/ConsultationDetails.vue` (line 292) → `doctorStore.getConsultation(route.params.id)` → 404.
- **Files:** `backend/src/routes/doctorRoutes.js`, `backend/src/controllers/doctorController.js`, `backend/src/services/doctorService.js`
- **Fix:** Add `router.get('/consultations/:consultationId', authenticate, checkRole('doctor'), doctorController.getConsultationById)` route + controller + service method that queries by ID.

### 1b. `GET /api/pharmacies/prescriptions/:id` — **P0 CRASH**

- **What:** Frontend `pharmacyService.getPrescription(id)` calls `GET /api/pharmacies/prescriptions/:id`. Backend only has `GET /prescriptions` (list), `/prescriptions/:id/dispense`, `/prescriptions/:id/verify`, `/prescriptions/:id/eligibility`. **No plain GET-by-ID.**
- **Views affected:** `frontend/src/views/pharmacy/PrescriptionDetails.vue` (line 95) → `pharmacyStore.getPrescription(route.params.id)` → 404.
- **Files:** `backend/src/routes/pharmacyRoutes.js`, `backend/src/controllers/pharmacyController.js`, `backend/src/services/pharmacyService.js`
- **Fix:** Add `router.get('/prescriptions/:prescriptionId', authenticate, checkRole('pharmacy'), pharmacyController.getPrescriptionById)`.

### 1c. `GET /api/hospitals/surgeries/:id` — **P1 MAJOR**

- **What:** Frontend `hospitalService.getSurgery(id)` calls `GET /api/hospitals/surgeries/:id`. Backend only has `GET /surgeries` (list), `PUT /surgeries/:id`, `POST /surgeries/:id/complete`. **No GET-by-ID.**
- **Views affected:** `frontend/src/views/hospital/SurgeryDetails.vue` (lines 30, 44, 57, 72) → `hospitalStore.getSurgery(route.params.id)` → 404.
- **Files:** `backend/src/routes/hospitalRoutes.js`, `backend/src/controllers/hospitalController.js`, `backend/src/services/hospitalService.js`
- **Fix:** Add `router.get('/surgeries/:surgeryId', authenticate, checkRole('hospital'), hospitalController.getSurgeryById)`.

### 1d. `GET /api/hospitals/beds` / `PUT /api/hospitals/beds/:id` — **P1 MAJOR**

- **What:** Frontend `hospitalService.getBeds()` calls `GET /api/hospitals/beds` and `hospitalService.updateBed(id, data)` calls `PUT /api/hospitals/beds/:id`. Backend only has `PUT /beds` (bulk update bed availability — no GET and no per-bed PUT).
- **Views affected:** `frontend/src/views/hospital/Beds.vue` (lines 29, 44, 53, 62) uses `hospitalStore.getBeds()` and `hospitalStore.updateBed()`.
- **Files:** `backend/src/routes/hospitalRoutes.js`, `backend/src/controllers/hospitalController.js`
- **Fix:** Add `GET /beds` route to list beds and `PUT /beds/:bedId` to update individual bed status. May also need a `beds` table or structured bed data in the hospitals table.

---

## 2. Missing Backend Routes for File Uploads

### 2a. `POST /api/patients/profile/photo` — **P1 MAJOR**

- **What:** Frontend `patientService.uploadProfilePhoto(formData)` calls `POST /api/patients/profile/photo`. **No such route in `patientRoutes.js`.** The patient store exposes `uploadProfilePhoto()` and calls the service method. Backend has no controller/service/route for patient photo upload.
- **Contrast:** Doctor photo upload (`POST /api/doctors/profile/photo`) and pharmacy logo (`POST /api/pharmacies/logo`) both have full route→controller→service chains.
- **Files:** `backend/src/routes/patientRoutes.js`, `backend/src/controllers/patientController.js`, `backend/src/services/patientService.js`
- **Fix:** Add multer-backed route: `router.post('/profile/photo', authenticate, isPatient, upload.single('profile_photo'), patientController.uploadProfilePhoto)` + controller + service method.

### 2b. `POST /api/hospitals/logo` — **P1 MAJOR**

- **What:** Frontend `hospitalService.uploadLogo(formData)` calls `POST /api/hospitals/logo`. **No such route in `hospitalRoutes.js`.** Backend has no controller method `uploadLogo` for hospitals, no service method either.
- **Contrast:** Pharmacy logo upload (`POST /api/pharmacies/logo`) is fully wired.
- **Files:** `backend/src/routes/hospitalRoutes.js`, `backend/src/controllers/hospitalController.js`, `backend/src/services/hospitalService.js`
- **Fix:** Add `router.post('/logo', authenticate, checkRole('hospital'), upload.single('logo'), hospitalController.uploadLogo)` + controller + service.

---

## 3. PDF Generation — **P1 MAJOR (NOT WIRED)**

### 3a. Backend `pdfkit` — installed but never imported

- **What:** `pdfkit` is in `backend/package.json` dependencies but **never imported or used anywhere** in backend source. `generateMonthlyStatement` creates a DB record only — no PDF is generated. The `downloadPrescription` endpoint in frontend calls `GET /api/doctors/prescriptions/:id/download` with `responseType: 'blob'` but that route **does not exist** in `doctorRoutes.js`. No route anywhere serves a PDF blob.
- **Files:** `backend/package.json`, `backend/src/services/paymentService.js`, `backend/src/routes/doctorRoutes.js`
- **Fix:** Create a PDF generation utility (`utils/pdfGenerator.js`) using pdfkit. Wire into:
  1. Prescription download route (`/doctors/prescriptions/:id/download`)  
  2. Statement download route (`/payments/statements/:id/download`)
  3. `downloadPaymentStatement` calls from all provider views

### 3b. Frontend `jspdf` / `html2canvas` — installed but never imported

- **What:** Both `jspdf` and `html2canvas` are in `frontend/package.json` but **never imported anywhere in frontend source**. The patient Payments view has `// TODO: Generate and download PDF receipt` at line 282. No client-side PDF generation exists.
- **Files:** `frontend/package.json`, `frontend/src/views/patient/Payments.vue`
- **Fix:** Either use these for client-side receipt PDFs, or remove them and handle all PDFs server-side. Recommend server-side for consistency.

---

## 4. Referral System — **P2 SCHEMA ONLY**

- **What:** The design schema (`database/schemas/02_medical_records_tables.sql`) has `referral_needed BOOLEAN` and `referral_to VARCHAR(255)` on the consultations table. The runtime schema (`backend/src/database/schemas/08_consultations.sql`) also has these columns.  
  A `createReferralSchema` Joi validation exists in `backend/src/validation/medicalSchemas.js` (line 264). However:
  - **No referral routes** exist
  - **No referral controller** exists  
  - **No referral service** method exists
  - **No referral repository** method exists
  - **No frontend referral UI** exists
- **Files:** `backend/src/validation/medicalSchemas.js`, `backend/src/database/schemas/08_consultations.sql`
- **Fix:** Build full referral workflow: repository → service → controller → routes → frontend views. Needs a `referrals` table or use embedded fields on consultations with a referral management UI for doctors.

---

## 5. Paystack Integration — **P1 STUB ONLY**

- **What:** `paymentService.initializePayment()` has commented-out gateway integration:
  ```js
  // In production, integrate with payment gateway (Paystack/Flutterwave)
  // const gatewayResponse = await paymentGateway.initialize(payment);
  ```
  `verifyPayment()` always returns `verified = true` (hardcoded). `processRefund()` also has `// In production, process refund through payment gateway`.
  
  Payment flow creates DB records but **never contacts Paystack**. No Paystack secret key exists in backend (correctly removed from frontend in Phase 1, but never added to backend `.env`).
- **Files:** `backend/src/services/paymentService.js` (lines 79-80, 109-114, 529-530)
- **Fix:** Create `utils/paystack.js` with `initialize()`, `verify()`, and `refund()` using Paystack REST API. Wire into `paymentService`. Add `PAYSTACK_SECRET_KEY` to `.env`.

---

## 6. Socket.IO — **P2 COMMENTED OUT**

- **What:** `socketService.js` is fully implemented (318 lines) with auth, rooms, typing indicators, notifications. However, in `server.js` line 223:
  ```js
  // initializeSocketIO(server);
  ```
  It is **commented out**. The import exists but the call never executes. No `socket.io-client` package exists in `frontend/package.json` — the frontend has zero socket code.
- **Files:** `backend/src/server.js` (line 223), `backend/src/services/socketService.js`, `frontend/package.json`
- **Fix:** 
  1. Uncomment the `initializeSocketIO(server)` call
  2. Add `socket.io-client` to frontend
  3. Create `frontend/src/services/socket.js` composable
  4. Wire real-time queue notifications, typing indicators, status updates

---

## 7. vee-validate / yup — **P3 INSTALLED, NEVER USED**

- **What:** Both `vee-validate@4.12.4` and `yup@1.3.3` are in `frontend/package.json` but **never imported in any `.vue` or `.js` file**. All frontend forms use manual validation with `v-model` and inline checks. No `useForm()`, `useField()`, or Yup schema references exist.
- **Files:** `frontend/package.json`
- **Fix:** Either adopt vee-validate+yup for all forms (significant refactor) or remove from dependencies to reduce bundle size. Recommend keeping for Phase 4 form hardening.

---

## 8. Patient `current_package` at Registration — **FIXED (Verify)**

- **What:** `patientRepository.createPatient()` now sets `current_package = 'GENERAL'` and `subscription_status = 'inactive'` (line 55-56). This was flagged as a Phase 1 fix and **appears correctly implemented**.
- **Remaining risk:** The column `current_package` allows `NULL` in runtime schema (`backend/src/database/schemas/02_patients.sql` — no NOT NULL constraint, no CHECK constraint). If any code path sets it to null, `PACKAGE_ENTITLEMENTS[null]` → TypeError still possible.
- **Services with fallbacks:** `pharmacyService.js:202`, `hospitalService.js:265`, `doctorService.js:227` all use `patient.current_package || 'GENERAL'` fallback. But `patientService.js:308` does `PACKAGE_ENTITLEMENTS[subscription.current_package]` **without fallback** — this could crash if `current_package` is null.
- **Severity:** P2
- **Fix:** Add `NOT NULL DEFAULT 'GENERAL'` constraint to runtime schema. Add fallback in `patientService.js:308`.

---

## 9. Monthly Statements — **P1 SCHEMA MISMATCH**

### 9a. Runtime schema vs code mismatch

- **Runtime schema** (`backend/src/database/schemas/14_monthly_statements.sql`): Patient-oriented. Columns: `patient_id`, `statement_date`, `billing_period_start/end`, `subscription_fee`, `consultation_charges`, etc. **No `provider_id`, `provider_type`, `month`, `year`, `transaction_count`, `platform_fee`, `net_amount` columns.**

- **Code** (`paymentRepository.createMonthlyStatement()`): Inserts `provider_id`, `provider_type`, `month`, `year`, `total_amount`, `transaction_count`, `platform_fee`, `net_amount` — **columns that don't exist in the runtime schema.**

- **Result:** `generateMonthlyStatement()` will crash with a SQL column-not-found error every time it's called.

- **Design schema** (`database/schemas/03_payment_tables.sql`): Has the provider-oriented structure matching the code (with `provider_id`, `month`, `year`, etc.).

- **Fix:** Replace `backend/src/database/schemas/14_monthly_statements.sql` with the provider-oriented schema from the design docs that matches what the code expects.

### 9b. PDF not generated

- Even if the schema matched, `generateMonthlyStatement` only creates a DB row. No PDF document is produced. The `statement_document_url` field (in design schema) is never populated.

---

## 10. Design vs Runtime Schema Divergence — **P2**

| Table | Design Schema | Runtime Schema | Divergence |
|-------|--------------|----------------|------------|
| **patients** | Has `first_name`, `last_name`, `date_of_birth`, `gender`, `address`, `city`, `state`, `package_type`, `blood_group`, `genotype`, NOT NULL constraints | Has `current_package` instead of `package_type`, no personal fields (stored in `users`), `blood_type` instead of `blood_group` | **Significant column name and structural differences** |
| **monthly_statements** | Provider-oriented (provider_id, month, year, platform_fee, net_amount) | Patient-oriented (patient_id, statement_date, billing_period, per-category charges) | **Completely different schemas — code follows design, will crash on runtime** |
| **payment_records** | Has `service_description`, `quantity`, `reviewed_by`, `metadata JSONB` | Simpler: `payment_method`, `payment_type`, `gateway_response TEXT`, `metadata TEXT` | **Different column sets, TEXT vs JSONB** |
| **patient_payments** | Has `payment_type`, `package_type`, `payment_gateway`, `gateway_reference`, `subscription_start/end` | Simpler: `amount`, `payment_method`, `payment_reference`, `payment_date` | **Missing many columns code might expect** |
| **audit_logs** | Rich: `action_type`, `entity_type`, `entity_id`, `old_values`, `new_values` | Simpler: `event_type`, `event_category`, `resource_type`, `changes` | **Different column names** |
| **consultations** | Rich: `medical_record_id`, `vital_signs JSONB`, `chief_complaint`, `history_of_present_illness`, `referral_needed`, `package_validated` | Simpler: just basic fields, no `medical_record_id` FK, no vitals | **Missing advanced medical fields** |
| **medical_records** | Exists in design | **Missing entirely from runtime schemas** | **Master medical record table not created** |
| **error_logs** | Exists in design | **Missing from runtime schemas** | Not created at runtime |
| **system_logs** | Exists in design | **Missing from runtime schemas** | Not created at runtime |
| **session_logs** | Exists in design | **Missing from runtime schemas** | Not created at runtime |
| **api_request_logs** | Exists in design | **Missing from runtime schemas** | Not created at runtime |

**Fix approach:** Decide which is source of truth. Runtime schemas are what actually runs. Either:
1. Update runtime schemas to add missing columns the code needs (priority: monthly_statements), OR
2. Accept that the design schemas are aspirational and update them to match runtime reality

---

## 11. Payment Reminder Service — **P2 COMMENTED OUT**

- **What:** `paymentReminderService` is imported in `server.js` (line 27) and fully implemented (393 lines), but its initialization is commented out (line 228):
  ```js
  //   paymentReminderService.initialize();
  ```
- **Files:** `backend/src/server.js`, `backend/src/services/paymentReminderService.js`
- **Fix:** Uncomment and gate behind env var: `if (process.env.ENABLE_CRON_JOBS === 'true') paymentReminderService.initialize();`

---

## 12. Process Handlers Commented Out — **P2**

- **What:** In `server.js` lines 244-260, all graceful shutdown handlers and unhandled rejection/exception handlers are commented out:
  ```js
  // process.on('unhandledRejection', ...);
  // process.on('uncaughtException', ...);
  // process.on('SIGTERM', ...);
  // process.on('SIGINT', ...);
  ```
  This means unhandled promise rejections silently crash the server in production.
- **Files:** `backend/src/server.js`
- **Fix:** Uncomment these handlers. They're essential for production stability.

---

## 13. Backend TODOs — **P2/P3**

| Location | TODO | Severity |
|----------|------|----------|
| `paymentService.js:393` | `// TODO: Trigger payout process to provider` | P2 — approved statements never trigger actual bank payout |
| `authService.js:308` | `// TODO: Send email with reset link` | P2 — password reset emails never sent |
| `authService.js:490` | `// TODO: Send email with verification link` | P2 — email verification never sent |

---

## 14. Frontend TODOs — **P3**

| Location | TODO |
|----------|------|
| `patient/Settings.vue:178,188` | Load/save notification settings from API |
| `patient/Settings.vue:200` | Implement 2FA setup |
| `patient/Payments.vue:272` | Implement subscription renewal |
| `patient/Payments.vue:277` | Show receipt modal |
| `patient/Payments.vue:282` | Generate and download PDF receipt |
| `patient/MedicalHistory.vue:241` | Implement detail modal |
| `patient/FindPharmacy.vue:251,256` | Show map modal, contact options |
| `patient/FindHospital.vue:283,288` | Show hospital details modal, map modal |
| `patient/FindDoctor.vue:263,268` | Navigate to consultation booking, show profile modal |

---

## 15. `downloadPrescription` Route Missing — **P1 MAJOR**

- **What:** `doctorService.downloadPrescription(id)` calls `GET /api/doctors/prescriptions/:id/download` with `responseType: 'blob'`. **This route does not exist** in `doctorRoutes.js`. The frontend Prescriptions view has download buttons that call this. Will return 404.
- **Files:** `frontend/src/services/index.js` (line 210), `frontend/src/views/doctor/Prescriptions.vue` (lines 73, 129), `backend/src/routes/doctorRoutes.js`
- **Fix:** Add `GET /prescriptions/:prescriptionId/download` route that generates a PDF using pdfkit and streams it back.

---

## 16. `downloadPaymentStatement` Endpoint Returns JSON, Not Blob — **P1 MAJOR**

- **What:** All three provider services (`doctorService`, `pharmacyService`, `hospitalService`) call `POST /payments/statements/generate` with `responseType: 'blob'`. But this endpoint (`paymentController.generateStatement`) returns JSON — it creates a DB record and returns `{ success: true, data: statement }`. The frontend expects a binary blob for download. Result: the "download" saves a JSON blob file, not a PDF.
- **Files:** `frontend/src/services/index.js` (lines 219, 347, 455), `backend/src/controllers/paymentController.js`
- **Fix:** Either create a separate `GET /payments/statements/:id/download` endpoint that serves a PDF, or modify `generateStatement` to return a PDF blob when requested.

---

## Prioritized Action Plan

### Immediate (P0 — Fix First)
1. Add `GET /doctors/consultations/:id` route + controller + service
2. Add `GET /pharmacies/prescriptions/:id` route + controller + service

### High Priority (P1 — Core Functionality)
3. Add `GET /hospitals/surgeries/:id` route + controller + service
4. Add `GET /hospitals/beds` + `PUT /hospitals/beds/:id` routes
5. Add `POST /patients/profile/photo` route (multer)
6. Add `POST /hospitals/logo` route (multer)
7. Fix `monthly_statements` runtime schema to match provider-oriented code
8. Build PDF generation utility with pdfkit (prescriptions + statements)
9. Add `GET /doctors/prescriptions/:id/download` route
10. Create `GET /payments/statements/:id/download` PDF download endpoint

### Medium Priority (P2 — Important Gaps)
11. Add `current_package NOT NULL DEFAULT 'GENERAL'` constraint + fallback in `patientService.js:308`
12. Uncomment Socket.IO initialization + add frontend socket client
13. Uncomment process handlers (SIGTERM/SIGINT, unhandled rejections)
14. Uncomment payment reminder service
15. Wire Paystack API (or clearly document it as Phase 4)
16. Build referral workflow (or document as Phase 4)
17. Reconcile design schemas with runtime schemas

### Low Priority (P3 — Polish)
18. Resolve all frontend TODOs (settings, modals, maps)
19. Either adopt vee-validate/yup or remove from deps
20. Either use jspdf/html2canvas or remove from deps
21. Wire email sending for password reset + email verification
22. Add payout trigger for approved statements
23. Build frontend notification/settings persistence

---

*End of audit report.*
