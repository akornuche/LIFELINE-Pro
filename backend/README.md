# LifeLine Pro Backend

A comprehensive healthcare management system backend API built with Node.js, supporting both SQLite (development) and PostgreSQL (production).

## 🚀 Quick Start

### Development with SQLite (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup database:**
   ```bash
   npm run db:setup:sqlite
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000` with SQLite database.

### Production with PostgreSQL

1. **Install PostgreSQL** on your server

2. **Configure environment:**
   ```bash
   cp .env.production .env
   # Edit .env with your PostgreSQL credentials
   ```

3. **Setup database:**
   ```bash
   npm run db:setup:postgres
   ```

4. **Start production server:**
   ```bash
   npm start
   ```

## 🗄️ Database Configuration

### SQLite (Development)
- **File-based:** `./data/lifeline.db`
- **No installation required**
- **Perfect for development and testing**
- **Automatic setup**

### PostgreSQL (Production)
- **Client-server architecture**
- **Better performance for high traffic**
- **ACID compliance**
- **Advanced features and scalability**

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server (SQLite by default)
- `npm run dev:sqlite` - Force SQLite for development
- `npm run dev:postgres` - Use PostgreSQL for development

### Database
- `npm run db:init` - Initialize database and create tables
- `npm run db:setup:sqlite` - Full SQLite setup (init + seed + admin)
- `npm run db:setup:postgres` - Full PostgreSQL setup
- `npm run seed` - Seed initial data
- `npm run seed:admin` - Create admin user

### Production
- `npm start` - Start production server

### Testing & Quality
- `npm test` - Run all tests
- `npm run lint` - Check code style
- `npm run format` - Format code

## 🔧 Environment Variables

### Database Type
```env
# Development (default)
DB_TYPE=sqlite
DB_SQLITE_PATH=./data/lifeline.db

# Production
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lifeline_pro_prod
DB_USER=your_user
DB_PASSWORD=your_password
```

### Other Important Variables
```env
NODE_ENV=development|production
PORT=5000
JWT_SECRET=your-secret-key
DB_PASSWORD=your-db-password
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── database/        # Database adapters and schemas
│   │   ├── connection.js    # Multi-database adapter
│   │   ├── init.js         # Database initialization
│   │   └── schemas/        # SQL schema files
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route handlers
│   ├── controllers/     # Business logic
│   ├── models/          # Data models
│   ├── services/        # External services
│   ├── utils/           # Utility functions
│   └── validations/     # Input validation schemas
├── data/                # SQLite database files (auto-created)
├── logs/                # Application logs
├── uploads/             # File uploads
├── tests/               # Test files
├── .env                 # Development environment
├── .env.production      # Production environment
└── package.json
```

## 🔄 Switching Between Databases

### From SQLite to PostgreSQL
1. Install PostgreSQL
2. Update `.env` with PostgreSQL settings
3. Run `npm run db:setup:postgres`
4. Restart the server

### From PostgreSQL to SQLite
1. Update `.env` to use SQLite settings
2. Run `npm run db:setup:sqlite`
3. Restart the server

## 🧪 Testing

The application supports both database types for testing:

```bash
# Test with SQLite
DB_TYPE=sqlite npm test

# Test with PostgreSQL
DB_TYPE=postgresql npm test
```

## 📊 API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/patients` - Patient management
- `GET /api/doctors` - Doctor management
- `GET /api/pharmacies` - Pharmacy management
- `GET /api/hospitals` - Hospital management
- `POST /api/payments` - Payment processing

## 🔒 Security Features

- JWT authentication
- Rate limiting
- Input validation with Joi
- SQL injection prevention
- CORS configuration
- Helmet security headers

## 📈 Performance

- Database connection pooling
- Query optimization
- Caching strategies
- Compression middleware
- Efficient logging

## 🚀 Deployment

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Traditional Server
1. Install Node.js 18+
2. Install PostgreSQL (production)
3. Configure environment variables
4. Run `npm run db:setup:postgres`
5. Start with `npm start`

## 🤝 Contributing

1. Use SQLite for local development
2. Ensure tests pass with both databases
3. Follow ESLint configuration
4. Write comprehensive tests
5. Update documentation

## 📝 License

Proprietary - LifeLine Pro Team