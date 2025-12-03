# LifeLine Pro - HMO & Health Insurance Platform

A comprehensive full-stack medical insurance and health services management system built with Node.js, Express, PostgreSQL, and Vue.js.

## 🚀 Features

### For Patients
- **Three-tier subscription packages**: Basic, Medium, Advanced
- **Dependent management** with package-based limits
- **Medical history tracking** (consultations, prescriptions, surgeries, lab tests)
- **Usage statistics** and entitlement tracking
- **Secure payment processing** with Paystack/Flutterwave integration

### For Healthcare Providers
- **Doctor profiles** with specialization and verification
- **Pharmacy management** with prescription dispensing
- **Hospital operations** with bed availability and surgery scheduling
- **Monthly statements** and compensation tracking
- **Provider ratings** and reviews

### For Administrators
- **User management** across all roles
- **Provider verification** workflow
- **Payment oversight** with statement approval
- **Analytics and reporting**
- **Audit logging** for all critical operations

## 🏗️ Architecture

```
lifeline-pro/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # HTTP request handlers
│   │   ├── database/         # Database schemas, migrations, seeds
│   │   ├── middleware/       # Auth, RBAC, validation, error handling
│   │   ├── models/           # Data repositories (9 repositories)
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic layer
│   │   ├── utils/            # Utilities (JWT, password, logger, etc.)
│   │   ├── validation/       # Joi validation schemas
│   │   └── server.js         # Application entry point
│   └── package.json
└── README.md
```

## 📋 Prerequisites

- **Node.js** v18+ 
- **PostgreSQL** 14+
- **npm** or **yarn**

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd "LIFELINE Pro"
```

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lifeline_pro
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Payment Gateway (Paystack)
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Payment Gateway (Flutterwave)
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key

# Redis (Optional - for rate limiting)
REDIS_URL=redis://localhost:6379
```

### 4. Database Setup

```bash
# Create database
createdb lifeline_pro

# Run migrations
npm run migrate

# Seed database with initial data
npm run seed

# Create admin user
npm run seed:admin
```

### 5. Start the server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

Server will be running at `http://localhost:5000`

## 🔑 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login user | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | Logout user | Private |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password | Public |
| POST | `/auth/change-password` | Change password | Private |
| GET | `/auth/verify-email/:token` | Verify email | Public |
| POST | `/auth/resend-verification` | Resend verification email | Private |
| GET | `/auth/me` | Get current user | Private |
| PUT | `/auth/profile` | Update profile | Private |
| POST | `/auth/deactivate` | Deactivate account | Private |

### Patient Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/patients/profile` | Get patient profile | Patient |
| PUT | `/patients/profile` | Update profile | Patient |
| POST | `/patients/subscriptions` | Create subscription | Patient |
| GET | `/patients/subscriptions` | Get subscription | Patient |
| PUT | `/patients/subscriptions` | Update subscription | Patient |
| DELETE | `/patients/subscriptions` | Cancel subscription | Patient |
| POST | `/patients/dependents` | Add dependent | Patient |
| GET | `/patients/dependents` | Get dependents | Patient |
| PUT | `/patients/dependents/:id` | Update dependent | Patient |
| DELETE | `/patients/dependents/:id` | Remove dependent | Patient |
| GET | `/patients/medical-history` | Get medical history | Patient |
| GET | `/patients/usage-statistics` | Get usage stats | Patient |
| GET | `/patients/search` | Search patients | Admin |
| GET | `/patients/:id` | Get patient by ID | Provider/Admin |

### Doctor Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/doctors/profile` | Get doctor profile | Doctor |
| PUT | `/doctors/profile` | Update profile | Doctor |
| PUT | `/doctors/license` | Update license | Doctor |
| GET | `/doctors/consultations` | Get consultations | Doctor |
| POST | `/doctors/consultations` | Create consultation | Doctor |
| PUT | `/doctors/consultations/:id` | Update consultation | Doctor |
| POST | `/doctors/prescriptions` | Create prescription | Doctor |
| GET | `/doctors/statistics` | Get statistics | Doctor |
| GET | `/doctors/search` | Search doctors | Public |
| GET | `/doctors/specialization/:spec` | Get by specialization | Public |
| GET | `/doctors/top-rated` | Get top-rated | Public |
| GET | `/doctors/:id` | Get doctor by ID | Public |
| PUT | `/doctors/:id/verification` | Update verification | Admin |
| POST | `/doctors/:id/rating` | Rate doctor | Patient |

### Pharmacy Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/pharmacies/profile` | Get pharmacy profile | Pharmacy |
| PUT | `/pharmacies/profile` | Update profile | Pharmacy |
| GET | `/pharmacies/prescriptions` | Get prescriptions | Pharmacy |
| POST | `/pharmacies/prescriptions/:id/dispense` | Dispense prescription | Pharmacy |
| GET | `/pharmacies/prescriptions/:id/verify` | Verify prescription | Pharmacy |
| GET | `/pharmacies/statistics` | Get statistics | Pharmacy |
| GET | `/pharmacies/search` | Search pharmacies | Public |
| GET | `/pharmacies/with-delivery` | Get with delivery | Public |
| POST | `/pharmacies/:id/rating` | Rate pharmacy | Patient |

### Hospital Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/hospitals/profile` | Get hospital profile | Hospital |
| PUT | `/hospitals/profile` | Update profile | Hospital |
| PUT | `/hospitals/beds` | Update bed availability | Hospital |
| GET | `/hospitals/surgeries` | Get surgeries | Hospital |
| POST | `/hospitals/surgeries` | Schedule surgery | Hospital |
| PUT | `/hospitals/surgeries/:id` | Update surgery | Hospital |
| POST | `/hospitals/surgeries/:id/complete` | Complete surgery | Hospital |
| GET | `/hospitals/statistics` | Get statistics | Hospital |
| GET | `/hospitals/search` | Search hospitals | Public |
| GET | `/hospitals/with-emergency` | Get with emergency | Public |
| GET | `/hospitals/with-available-beds` | Get with beds | Public |
| POST | `/hospitals/:id/rating` | Rate hospital | Patient |

### Payment Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/payments/initialize` | Initialize payment | Patient |
| GET | `/payments/verify/:ref` | Verify payment | Public |
| POST | `/payments/webhook/:gateway` | Payment webhook | Gateway |
| GET | `/payments/history` | Get payment history | Patient |
| GET | `/payments/provider` | Get provider payments | Provider |
| POST | `/payments/statements/generate` | Generate statement | Provider |
| GET | `/payments/statements` | Get statements | Provider |
| GET | `/payments/statements/pending` | Get pending | Admin |
| POST | `/payments/statements/:id/approve` | Approve statement | Admin |
| POST | `/payments/statements/:id/reject` | Reject statement | Admin |
| GET | `/payments/revenue` | Calculate revenue | Admin |
| GET | `/payments/analytics` | Get analytics | Admin |
| POST | `/payments/:id/refund` | Process refund | Admin |

## 📊 Database Schema

### Core Tables
- `users` - User accounts across all roles
- `patients` - Patient-specific data
- `doctors` - Doctor profiles and credentials
- `pharmacies` - Pharmacy information
- `hospitals` - Hospital facilities
- `dependents` - Patient dependents
- `patient_subscriptions` - Subscription records

### Medical Records
- `consultations` - Doctor consultations
- `prescriptions` - Prescription records
- `surgeries` - Surgery records
- `lab_tests` - Laboratory test results

### Financial Tables
- `payment_records` - All payment transactions
- `payment_webhooks` - Payment gateway webhooks
- `monthly_statements` - Provider compensation
- `patient_payments` - Patient payment tracking
- `pricing` - Service pricing by package

### System Tables
- `audit_logs` - System audit trail
- `jwt_blacklist` - Invalidated tokens

## 🔒 Security Features

- **JWT Authentication** with access and refresh tokens
- **Role-Based Access Control (RBAC)** for all endpoints
- **Password hashing** with bcrypt
- **Rate limiting** on sensitive endpoints
- **Request validation** with Joi schemas
- **SQL injection protection** with parameterized queries
- **Audit logging** for all critical operations
- **Token blacklisting** for logout
- **Helmet.js** for HTTP security headers

## 📦 Package Information

### Subscription Packages

#### Basic Package
- Max Dependents: 2
- Consultations: 5/month
- Prescriptions: 10/month
- Lab Tests: 5/month
- Surgeries: 1/year

#### Medium Package
- Max Dependents: 4
- Consultations: 10/month
- Prescriptions: 20/month
- Lab Tests: 10/month
- Surgeries: 2/year

#### Advanced Package
- Max Dependents: 6
- Consultations: Unlimited
- Prescriptions: Unlimited
- Lab Tests: 20/month
- Surgeries: 4/year

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start with nodemon

# Production
npm start            # Start server

# Database
npm run migrate      # Run migrations
npm run seed         # Seed database
npm run seed:admin   # Create admin user

# Testing
npm test             # Run tests
npm run test:watch   # Test watch mode
npm run test:coverage # Test coverage

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Project Structure

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic layer
- **Repositories**: Data access layer
- **Middleware**: Request processing (auth, validation, etc.)
- **Routes**: API endpoint definitions
- **Validation**: Joi schemas for request validation
- **Utils**: Helper functions and utilities

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📝 Logging

The application uses Winston for structured logging:

- **Development**: Console output with colors
- **Production**: File-based logging
  - `logs/error.log` - Error logs
  - `logs/combined.log` - All logs
  - `logs/audit.log` - Audit trail (365-day retention)

## 🔄 Migration System

Database migrations are managed through custom migration scripts:

```bash
# Run all pending migrations
npm run migrate

# Create new migration
npm run migrate:create migration_name
```

## 🌐 Environment Variables

See `.env.example` for all required environment variables.

Critical variables:
- `JWT_SECRET` - Must be changed in production
- `JWT_REFRESH_SECRET` - Must be changed in production
- `DB_PASSWORD` - Database password
- Payment gateway keys (Paystack/Flutterwave)

## 🚀 Deployment

### Production Checklist

- [ ] Change all secret keys in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Configure production database
- [ ] Set up database backups
- [ ] Configure Redis for rate limiting
- [ ] Set up monitoring and alerts
- [ ] Review and update CORS settings
- [ ] Configure payment gateway webhooks
- [ ] Set up log rotation
- [ ] Enable database connection pooling

### Recommended Production Setup

- **Server**: Node.js with PM2 process manager
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for rate limiting and sessions
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt certificates
- **Monitoring**: PM2 monitoring + custom health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 👥 Support

For support and inquiries, contact the development team.

---

**Built with ❤️ for better healthcare management**
