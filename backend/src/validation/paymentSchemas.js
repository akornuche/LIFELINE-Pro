import Joi from 'joi';

/**
 * Payment Validation Schemas
 * Joi schemas for payments, webhooks, refunds, and statements
 */

/**
 * Payment creation schema
 */
export const createPaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be greater than 0',
    'any.required': 'Payment amount is required',
  }),
  paymentMethod: Joi.string()
    .valid('card', 'bank_transfer', 'wallet', 'cash')
    .required(),
  paymentType: Joi.string()
    .valid(
      'subscription',
      'consultation',
      'prescription',
      'surgery',
      'lab_test',
      'other'
    )
    .required(),
  description: Joi.string().trim().min(5).max(500).required(),
  patientId: Joi.string().uuid().required(),
  relatedRecordId: Joi.string().uuid(),
  relatedRecordType: Joi.string().valid(
    'subscription',
    'consultation',
    'prescription',
    'surgery',
    'lab_test'
  ),
  metadata: Joi.object({
    packageType: Joi.string().valid('basic', 'medium', 'advanced'),
    billingCycle: Joi.string().valid('monthly', 'quarterly', 'annual'),
    serviceProviderId: Joi.string().uuid(),
    serviceProviderType: Joi.string().valid('doctor', 'pharmacy', 'hospital'),
  }),
});

// Initialize payment schema
export const initializePaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  paymentMethod: Joi.string()
    .valid('card', 'bank_transfer', 'wallet')
    .required(),
  paymentType: Joi.string()
    .valid(
      'subscription',
      'consultation',
      'prescription',
      'surgery',
      'lab_test',
      'other'
    )
    .required(),
  description: Joi.string().trim().min(5).max(500).required(),
  patientId: Joi.string().uuid().required(),
  relatedRecordId: Joi.string().uuid(),
  relatedRecordType: Joi.string().valid(
    'subscription',
    'consultation',
    'prescription',
    'surgery',
    'lab_test'
  ),
  callbackUrl: Joi.string().uri(),
  metadata: Joi.object({
    packageType: Joi.string().valid('basic', 'medium', 'advanced'),
    billingCycle: Joi.string().valid('monthly', 'quarterly', 'annual'),
    serviceProviderId: Joi.string().uuid(),
    serviceProviderType: Joi.string().valid('doctor', 'pharmacy', 'hospital'),
  }),
});

/**
 * Card payment schema
 */
export const cardPaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  email: Joi.string().email().required(),
  paymentType: Joi.string().required(),
  description: Joi.string().trim().required(),
  callbackUrl: Joi.string().uri(),
  metadata: Joi.object(),
});

/**
 * Bank transfer payment schema
 */
export const bankTransferSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  bankName: Joi.string().trim().required(),
  accountNumber: Joi.string().pattern(/^\d{10}$/).required().messages({
    'string.pattern.base': 'Account number must be 10 digits',
  }),
  accountName: Joi.string().trim().required(),
  transferReference: Joi.string().trim().required(),
  transferDate: Joi.date().max('now').required(),
  proofOfPayment: Joi.string().trim(), // File path or URL
});

/**
 * Verify payment schema
 */
export const verifyPaymentSchema = Joi.object({
  paymentReference: Joi.string().trim().required(),
  gateway: Joi.string().valid('paystack', 'flutterwave').required(),
});

/**
 * Payment webhook schemas
 */

// Paystack webhook
export const paystackWebhookSchema = Joi.object({
  event: Joi.string().required(),
  data: Joi.object({
    reference: Joi.string().required(),
    amount: Joi.number().required(),
    status: Joi.string().required(),
    paid_at: Joi.string(),
    customer: Joi.object({
      email: Joi.string().email(),
    }),
    metadata: Joi.object(),
  }).required(),
});

// Flutterwave webhook
export const flutterwaveWebhookSchema = Joi.object({
  event: Joi.string().required(),
  data: Joi.object({
    tx_ref: Joi.string().required(),
    amount: Joi.number().required(),
    status: Joi.string().required(),
    customer: Joi.object({
      email: Joi.string().email(),
    }),
  }).required(),
});

/**
 * Refund schemas
 */

// Create refund
export const createRefundSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  reason: Joi.string()
    .valid(
      'duplicate_payment',
      'service_not_rendered',
      'incorrect_amount',
      'customer_request',
      'other'
    )
    .required(),
  description: Joi.string().trim().min(10).max(1000).required(),
  fullRefund: Joi.boolean().default(false),
});

// Process refund
export const processRefundSchema = Joi.object({
  refundId: Joi.string().uuid().required(),
  status: Joi.string().valid('approved', 'rejected').required(),
  approvedBy: Joi.string().uuid().required(),
  rejectionReason: Joi.string().trim().max(500).when('status', {
    is: 'rejected',
    then: Joi.required(),
  }),
  notes: Joi.string().trim().max(1000),
});

/**
 * Monthly statement schemas
 */

// Generate statement
export const generateStatementSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).max(2100).required(),
  providerId: Joi.string().uuid().required(),
  providerType: Joi.string().valid('doctor', 'pharmacy', 'hospital').required(),
});

// Approve statement
export const approveStatementSchema = Joi.object({
  statementId: Joi.string().uuid().required(),
  approvedBy: Joi.string().uuid().required(),
  notes: Joi.string().trim().max(1000),
});

// Reject statement
export const rejectStatementSchema = Joi.object({
  statementId: Joi.string().uuid().required(),
  rejectedBy: Joi.string().uuid().required(),
  rejectionReason: Joi.string().trim().min(10).max(1000).required(),
  notes: Joi.string().trim().max(1000),
});

// Dispute statement
export const disputeStatementSchema = Joi.object({
  statementId: Joi.string().uuid().required(),
  disputeReason: Joi.string().trim().min(20).max(2000).required(),
  disputedAmount: Joi.number().positive().precision(2),
  disputedTransactions: Joi.array().items(Joi.string().uuid()).min(1).required(),
  supportingDocuments: Joi.array().items(Joi.string().trim()),
});

// Resolve dispute
export const resolveDisputeSchema = Joi.object({
  statementId: Joi.string().uuid().required(),
  resolution: Joi.string()
    .valid('approved', 'rejected', 'adjusted')
    .required(),
  adjustedAmount: Joi.number().precision(2).when('resolution', {
    is: 'adjusted',
    then: Joi.required(),
  }),
  resolutionNotes: Joi.string().trim().min(10).max(2000).required(),
  resolvedBy: Joi.string().uuid().required(),
});

/**
 * Provider payment schemas
 */

// Record provider payment
export const recordProviderPaymentSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  providerType: Joi.string().valid('doctor', 'pharmacy', 'hospital').required(),
  amount: Joi.number().positive().precision(2).required(),
  paymentMethod: Joi.string()
    .valid('bank_transfer', 'cheque', 'mobile_money')
    .required(),
  paymentReference: Joi.string().trim().required(),
  statementIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  paymentDate: Joi.date().max('now').required(),
  notes: Joi.string().trim().max(1000),
});

// Record patient payment
export const recordPatientPaymentSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  paymentMethod: Joi.string()
    .valid('card', 'bank_transfer', 'wallet', 'cash')
    .required(),
  paymentType: Joi.string()
    .valid(
      'subscription',
      'consultation',
      'prescription',
      'surgery',
      'lab_test',
      'other'
    )
    .required(),
  paymentReference: Joi.string().trim().required(),
  relatedRecordId: Joi.string().uuid(),
  relatedRecordType: Joi.string().valid(
    'subscription',
    'consultation',
    'prescription',
    'surgery',
    'lab_test'
  ),
  paymentDate: Joi.date().max('now').required(),
  notes: Joi.string().trim().max(1000),
});

/**
 * Patient payment history schema
 */
export const getPaymentHistorySchema = Joi.object({
  startDate: Joi.date().max('now'),
  endDate: Joi.date().min(Joi.ref('startDate')).max('now'),
  paymentType: Joi.string().valid(
    'subscription',
    'consultation',
    'prescription',
    'surgery',
    'lab_test',
    'all'
  ),
  status: Joi.string().valid('pending', 'completed', 'failed', 'refunded', 'all'),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

/**
 * Invoice generation schema
 */
export const generateInvoiceSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  items: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().trim().required(),
        quantity: Joi.number().integer().positive().required(),
        unitPrice: Joi.number().positive().precision(2).required(),
        discount: Joi.number().min(0).max(100).default(0),
      })
    )
    .min(1)
    .required(),
  dueDate: Joi.date().min('now').required(),
  notes: Joi.string().trim().max(1000),
  taxRate: Joi.number().min(0).max(100).default(0),
});

/**
 * Payment plan schema
 */
export const createPaymentPlanSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  totalAmount: Joi.number().positive().precision(2).required(),
  downPayment: Joi.number().min(0).precision(2).required(),
  numberOfInstallments: Joi.number().integer().min(2).max(12).required(),
  installmentFrequency: Joi.string().valid('weekly', 'biweekly', 'monthly').required(),
  startDate: Joi.date().min('now').required(),
  relatedRecordId: Joi.string().uuid().required(),
  relatedRecordType: Joi.string()
    .valid('surgery', 'treatment_plan', 'equipment')
    .required(),
});

/**
 * Payment plan installment schema
 */
export const payInstallmentSchema = Joi.object({
  paymentPlanId: Joi.string().uuid().required(),
  installmentNumber: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().precision(2).required(),
  paymentMethod: Joi.string().valid('card', 'bank_transfer', 'wallet').required(),
  paymentReference: Joi.string().trim().required(),
});

/**
 * Pricing update schema (Admin)
 */
export const updatePricingSchema = Joi.object({
  serviceType: Joi.string().required(),
  packageType: Joi.string().valid('basic', 'medium', 'advanced'),
  providerType: Joi.string().valid('doctor', 'pharmacy', 'hospital'),
  basePrice: Joi.number().positive().precision(2),
  providerShare: Joi.number().min(0).max(100),
  platformFee: Joi.number().min(0).max(100),
  effectiveDate: Joi.date().min('now').required(),
  notes: Joi.string().trim().max(500),
}).min(2); // At least serviceType and one other field

/**
 * Bulk payment processing schema (Admin)
 */
export const processBulkPaymentsSchema = Joi.object({
  paymentIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  action: Joi.string().valid('approve', 'reject', 'process').required(),
  notes: Joi.string().trim().max(1000),
});

/**
 * Payment analytics schema
 */
export const getPaymentAnalyticsSchema = Joi.object({
  startDate: Joi.date().max('now').required(),
  endDate: Joi.date().min(Joi.ref('startDate')).max('now').required(),
  groupBy: Joi.string()
    .valid('day', 'week', 'month', 'paymentType', 'providerType')
    .default('day'),
  providerType: Joi.string().valid('doctor', 'pharmacy', 'hospital', 'all'),
  includeRefunds: Joi.boolean().default(true),
});

/**
 * Export payments schema
 */
export const exportPaymentsSchema = Joi.object({
  startDate: Joi.date().max('now').required(),
  endDate: Joi.date().min(Joi.ref('startDate')).max('now').required(),
  format: Joi.string().valid('csv', 'excel', 'pdf').default('csv'),
  filters: Joi.object({
    paymentType: Joi.string(),
    status: Joi.string(),
    providerId: Joi.string().uuid(),
    patientId: Joi.string().uuid(),
  }),
});

/**
 * ID parameter validation
 */
export const paymentIdParamSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
});

export const statementIdParamSchema = Joi.object({
  statementId: Joi.string().uuid().required(),
});

export const refundIdParamSchema = Joi.object({
  refundId: Joi.string().uuid().required(),
});

export default {
  createPaymentSchema,
  initializePaymentSchema,
  cardPaymentSchema,
  bankTransferSchema,
  verifyPaymentSchema,
  paystackWebhookSchema,
  flutterwaveWebhookSchema,
  createRefundSchema,
  processRefundSchema,
  generateStatementSchema,
  approveStatementSchema,
  rejectStatementSchema,
  disputeStatementSchema,
  resolveDisputeSchema,
  recordProviderPaymentSchema,
  recordPatientPaymentSchema,
  getPaymentHistorySchema,
  generateInvoiceSchema,
  createPaymentPlanSchema,
  payInstallmentSchema,
  updatePricingSchema,
  processBulkPaymentsSchema,
  getPaymentAnalyticsSchema,
  exportPaymentsSchema,
  paymentIdParamSchema,
  statementIdParamSchema,
  refundIdParamSchema,
};
