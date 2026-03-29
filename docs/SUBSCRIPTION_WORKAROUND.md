# 📋 Subscription Management - Pre-Payment Gateway Workaround

## Current Implementation (Before Payment Integration)

### Overview
Until payment gateway integration is complete, subscriptions are managed directly in the **patients table** without payment processing.

---

## 🎯 Subscription Model

### Database Structure
Subscriptions are stored in the `patients` table with these fields:
- `current_package`: VARCHAR(50) - 'BASIC', 'MEDIUM', or 'ADVANCED'
- `subscription_status`: VARCHAR(20) - 'active', 'inactive', 'cancelled', 'expired'
- `subscription_start_date`: DATE
- `subscription_end_date`: DATE
- `auto_renew`: BOOLEAN

### Package Types
```javascript
BASIC    → ₦3,500/month
MEDIUM   → ₦5,000/month
ADVANCED → ₦10,000/month
```

---

## 🔄 Current Workflow (Manual Activation)

### 1. **Create/Update Subscription**

**Endpoint**: `PUT /api/patients/subscriptions`

**Request Body**:
```json
{
  "packageType": "BASIC",     // or 'basic', 'MEDIUM', 'ADVANCED'
  "autoRenew": true,
  "subscriptionStatus": "active"
}
```

**What Happens**:
- ✅ Package type is normalized to uppercase ('BASIC', 'MEDIUM', 'ADVANCED')
- ✅ Subscription dates are auto-calculated (30 days from today)
- ✅ Status is set to 'active'
- ❌ **NO payment processing** (payment gateway not integrated yet)
- ❌ **NO payment record created**

### 2. **Get Current Subscription**

**Endpoint**: `GET /api/patients/subscriptions`

**Response**:
```json
[
  {
    "package_type": "BASIC",
    "status": "active",
    "start_date": "2026-02-14",
    "end_date": "2026-03-16",
    "auto_renew": true
  }
]
```

---

## ⚙️ How It Works

### Backend Logic

1. **Validation** - Accepts both uppercase and lowercase package types
   ```javascript
   // Valid: 'basic', 'BASIC', 'medium', 'MEDIUM', 'advanced', 'ADVANCED'
   ```

2. **Normalization** - Converts to uppercase
   ```javascript
   const normalizedPackageType = packageType.toUpperCase();
   // 'basic' → 'BASIC'
   ```

3. **Auto-dating** - Calculates 30-day subscription
   ```javascript
   const startDate = new Date();
   const endDate = new Date();
   endDate.setDate(endDate.getDate() + 30);
   ```

4. **Direct Update** - Updates `patients` table directly
   ```sql
   UPDATE patients
   SET current_package = 'BASIC',
       subscription_start_date = '2026-02-14',
       subscription_end_date = '2026-03-16',
       subscription_status = 'active',
       auto_renew = true
   WHERE id = $1
   ```

---

## 🚀 Usage Examples

### Frontend - Activate Subscription
```vue
<script setup>
const activateSubscription = async (packageType) => {
  try {
    await api.put('/api/patients/subscriptions', {
      packageType: packageType.toUpperCase(),
      autoRenew: true,
      subscriptionStatus: 'active'
    });
    
    showToast('Subscription activated successfully!');
  } catch (error) {
    showError('Failed to activate subscription');
  }
};
</script>
```

### Backend - Service Layer
```javascript
// File: services/patientService.js
export const updateSubscription = async (userId, { packageType, autoRenew }) => {
  // 1. Get patient
  const patient = await patientRepository.findByUserId(userId);
  
  // 2. Normalize package type
  const normalized = packageType.toUpperCase();
  
  // 3. Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  
  // 4. Update subscription (NO payment)
  return await patientRepository.updateSubscription(patient.id, {
    packageType: normalized,
    subscriptionStartDate: startDate,
    subscriptionEndDate: endDate,
    subscriptionStatus: 'active',
    autoRenew: autoRenew ?? true,
  });
};
```

---

## ⚠️ Limitations (Current Workaround)

| Feature | Status | Notes |
|---------|--------|-------|
| Package Selection | ✅ Working | Can choose BASIC, MEDIUM, ADVANCED |
| Subscription Activation | ✅ Working | Instant (no payment) |
| 30-day Period | ✅ Working | Auto-calculated |
| Payment Processing | ❌ **Not Implemented** | Requires Paystack/Flutterwave |
| Payment Records | ❌ **Not Created** | No entries in payment_records table |
| Invoice Generation | ❌ **Not Available** | Needs payment integration |
| Auto-renewal Charging | ❌ **Not Implemented** | Manual renewal only |
| Usage Limits | ⚠️ **Not Enforced** | Tracked but not blocked |

---

## 🔮 Future: Payment Gateway Integration

### What Will Change:

#### 1. **Payment Flow**
```
User selects package → Payment gateway → Payment verified → Subscription activated
```

#### 2. **New Endpoints**
```javascript
POST /api/payments/initialize       // Start payment
GET  /api/payments/verify/:ref      // Verify payment
POST /api/payments/webhook/:gateway // Webhook handler
```

#### 3. **Payment Records Table**
```sql
INSERT INTO payment_records (
  patient_id,
  package_type,
  amount,
  payment_reference,
  payment_gateway,
  status
) VALUES (...)
```

#### 4. **Auto-renewal**
```javascript
// Cron job runs daily
if (subscription.end_date < today && subscription.auto_renew) {
  initiatePayment();
}
```

---

## 📝 Migration Plan

### Phase 1: Current (Manual)
- ✅ Direct database updates
- ✅ No payment processing
- ✅ Manual activation

### Phase 2: Payment Integration
- 🔄 Add Paystack/Flutterwave
- 🔄 Create payment records
- 🔄 Webhook handlers
- 🔄 Payment verification

### Phase 3: Automation
- 🔄 Auto-renewal charging
- 🔄 Payment reminders
- 🔄 Invoice generation
- 🔄 Usage limit enforcement

---

## 🎯 Quick Reference

### Activate Subscription (Manual)
```bash
PUT /api/patients/subscriptions
{
  "packageType": "BASIC",
  "autoRenew": true,
  "subscriptionStatus": "active"
}
```

### Check Subscription
```bash
GET /api/patients/subscriptions
```

### Package Prices
```
BASIC:    ₦3,500/month (limited services)
MEDIUM:   ₦5,000/month (more services)
ADVANCED: ₦10,000/month (all services)
```

### Valid Statuses
```
active    - Subscription is active
inactive  - Not yet activated
cancelled - User cancelled
expired   - Past end date
```

---

## 🐛 Troubleshooting

### 422 Error: "Package type must be basic, medium, or advanced"
**Solution**: Validation now accepts both uppercase and lowercase

### Subscription not showing
**Solution**: Run `PUT /api/patients/subscriptions` to create one

### Can't update package
**Solution**: Ensure you're sending `packageType` in the request body

---

**Note**: This is a temporary workaround. Full payment integration will replace manual activation with automated payment processing.
