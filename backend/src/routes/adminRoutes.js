import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/rbac.js';
import { successResponse, errorResponse } from '../utils/response.js';
import database from '../database/connection.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json');

const DEFAULT_SETTINGS = {
    platform_name: 'LIFELINE Pro',
    support_email: 'support@lifelinepro.com',
    support_phone: '+234 800 000 0000',
    commission_rate: 5.0,
    paystack_public_key: '',
    enable_test_mode: true,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    maintenanceMode: false,
    allowRegistration: true,
    defaultSubscriptionType: 'GENERAL',
    features: {
        consultations: true,
        prescriptions: true,
        surgeries: true,
        subscriptions: true,
    },
};

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        }
    } catch (err) {
        logger.warn('Failed to read settings file, using defaults', { error: err.message });
    }
    return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    // Never persist sensitive fields that belong in env vars
    const { smtp_password, ...safeSettings } = settings;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(safeSettings, null, 2), 'utf8');
}

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, checkRole('admin'));

/**
 * @route   GET /api/admin/statistics
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/statistics', async (req, res, next) => {
    try {
        const db = database;

        // Get total users count
        const usersResult = await db.query("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
        const totalUsers = parseInt(usersResult.rows[0]?.count || 0);

        // Get total patients count
        const patientsResult = await db.query("SELECT COUNT(*) as count FROM patients");
        const totalPatients = parseInt(patientsResult.rows[0]?.count || 0);

        // Get total providers (doctors + pharmacies + hospitals)
        const doctorsResult = await db.query("SELECT COUNT(*) as count FROM doctors");
        const pharmaciesResult = await db.query("SELECT COUNT(*) as count FROM pharmacies");
        const hospitalsResult = await db.query("SELECT COUNT(*) as count FROM hospitals");
        const totalProviders = parseInt(doctorsResult.rows[0]?.count || 0) +
            parseInt(pharmaciesResult.rows[0]?.count || 0) +
            parseInt(hospitalsResult.rows[0]?.count || 0);

        // Get pending verifications count
        let pendingVerifications = 0;
        try {
            const pendingDoctors = await db.query("SELECT COUNT(*) as count FROM doctors WHERE verification_status = 'pending'");
            const pendingPharmacies = await db.query("SELECT COUNT(*) as count FROM pharmacies WHERE verification_status = 'pending'");
            const pendingHospitals = await db.query("SELECT COUNT(*) as count FROM hospitals WHERE verification_status = 'pending'");
            pendingVerifications = parseInt(pendingDoctors.rows[0]?.count || 0) +
                parseInt(pendingPharmacies.rows[0]?.count || 0) +
                parseInt(pendingHospitals.rows[0]?.count || 0);
        } catch (e) {
            logger.warn('Could not fetch pending verifications', { error: e.message });
        }

        // Get total revenue
        let totalRevenue = 0;
        try {
            const revenueResult = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM payment_records WHERE status = 'completed' OR status = 'success'");
            totalRevenue = parseFloat(revenueResult.rows[0]?.total || 0);
        } catch (e) {
            logger.warn('Could not fetch revenue from payment_records', { error: e.message });
        }

        const statistics = {
            totalUsers,
            totalPatients,
            totalProviders,
            totalRevenue,
            pendingVerifications,
            userGrowth: 0,
            revenueGrowth: 0
        };

        return successResponse(res, statistics, 'Statistics retrieved successfully');
    } catch (error) {
        logger.error('Get admin statistics error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/users', async (req, res, next) => {
    try {
        const { limit = 10, page = 1, role, search, status } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;

        let query = 'SELECT id, lifeline_id, email, first_name, last_name, phone, role, status, email_verified, created_at FROM users';
        let countQuery = 'SELECT COUNT(*) as count FROM users';
        const conditions = [];
        const params = [];

        if (role) {
            params.push(role);
            conditions.push(`role = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(first_name LIKE $${params.length} OR last_name LIKE $${params.length} OR email LIKE $${params.length})`);
        }
        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`;

        const result = await database.query(query, params);
        const countResult = await database.query(countQuery, params);
        
        const total = parseInt(countResult.rows[0]?.count || 0);

        return successResponse(res, {
            users: result.rows,
            total,
            page: parseInt(page),
            limit: perPage
        }, 'Users retrieved successfully');
    } catch (error) {
        logger.error('Get admin users error', { error: error.message });
        next(error);
    }
});

router.get('/users/:id', async (req, res, next) => {
    try {
        const userResult = await database.query(
            'SELECT id, lifeline_id, email, first_name, last_name, phone, role, status, email_verified, date_of_birth, gender, address, city, state, country, profile_image_url, created_at, updated_at FROM users WHERE id = $1',
            [req.params.id]
        );

        if (userResult.rows.length === 0) {
            return errorResponse(res, 'User not found', 404);
        }

        const user = userResult.rows[0];
        let profile = null;

        // Fetch specialized profile data based on role
        if (user.role === 'patient') {
            const result = await database.query('SELECT * FROM patients WHERE user_id = $1', [user.id]);
            profile = result.rows[0] || null;
        } else if (user.role === 'doctor') {
            const result = await database.query('SELECT * FROM doctors WHERE user_id = $1', [user.id]);
            profile = result.rows[0] || null;
        } else if (user.role === 'pharmacy') {
            const result = await database.query('SELECT * FROM pharmacies WHERE user_id = $1', [user.id]);
            profile = result.rows[0] || null;
        } else if (user.role === 'hospital') {
            const result = await database.query('SELECT * FROM hospitals WHERE user_id = $1', [user.id]);
            profile = result.rows[0] || null;
        }

        return successResponse(res, { ...user, profile }, 'User details retrieved successfully');
    } catch (error) {
        logger.error('Get admin user detail error', { error: error.message });
        next(error);
    }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put('/users/:id', async (req, res, next) => {
    try {
        const { status, email_verified, role } = req.body;
        const updates = [];
        const params = [];

        if (status !== undefined) {
            params.push(status);
            updates.push(`status = $${params.length}`);
        }
        if (email_verified !== undefined) {
            params.push(email_verified);
            updates.push(`email_verified = $${params.length}`);
        }
        if (role) {
            params.push(role);
            updates.push(`role = $${params.length}`);
        }

        if (updates.length === 0) {
            return errorResponse(res, 'No fields to update', 400);
        }

        params.push(req.params.id);
        const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}`;

        await database.query(query, params);

        const updatedUser = await database.query(
            'SELECT id, lifeline_id, email, first_name, last_name, role, status, email_verified FROM users WHERE id = $1',
            [req.params.id]
        );

        return successResponse(res, updatedUser.rows[0], 'User updated successfully');
    } catch (error) {
        logger.error('Update admin user error', { error: error.message });
        next(error);
    }
});

/**
 * @route   POST /api/admin/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin)
 */
router.post('/users/:id/deactivate', async (req, res, next) => {
    try {
        await database.query(
            "UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            [req.params.id]
        );

        const result = await database.query(
            'SELECT id, email, status FROM users WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return errorResponse(res, 'User not found', 404);
        }

        return successResponse(res, result.rows[0], 'User deactivated successfully');
    } catch (error) {
        logger.error('Deactivate user error', { error: error.message });
        next(error);
    }
});

/**
 * @route   POST /api/admin/users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin)
 */
router.post('/users/:id/activate', async (req, res, next) => {
    try {
        await database.query(
            "UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            [req.params.id]
        );

        const result = await database.query(
            'SELECT id, email, status FROM users WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return errorResponse(res, 'User not found', 404);
        }

        return successResponse(res, result.rows[0], 'User activated successfully');
    } catch (error) {
        logger.error('Activate user error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/patients
 * @desc    Get all patients
 * @access  Private (Admin)
 */
router.get('/patients', async (req, res, next) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;
        const result = await database.query(
            `SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.lifeline_id 
       FROM patients p 
       JOIN users u ON p.user_id = u.id 
       ORDER BY p.created_at DESC 
       LIMIT ${perPage} OFFSET ${offset}`
        );
        const countResult = await database.query('SELECT COUNT(*) as count FROM patients');
        const total = parseInt(countResult.rows[0]?.count || 0);

        return successResponse(res, {
            patients: result.rows,
            total,
            page: parseInt(page),
            limit: perPage
        }, 'Patients retrieved successfully');
    } catch (error) {
        logger.error('Get admin patients error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/doctors
 * @desc    Get all doctors
 * @access  Private (Admin)  
 */
router.get('/doctors', async (req, res, next) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;
        const result = await database.query(
            `SELECT d.*, u.email, u.first_name, u.last_name, u.phone, u.lifeline_id 
       FROM doctors d 
       JOIN users u ON d.user_id = u.id 
       ORDER BY d.created_at DESC 
       LIMIT ${perPage} OFFSET ${offset}`
        );
        const countResult = await database.query('SELECT COUNT(*) as count FROM doctors');
        const total = parseInt(countResult.rows[0]?.count || 0);

        return successResponse(res, {
            doctors: result.rows,
            total,
            page: parseInt(page),
            limit: perPage
        }, 'Doctors retrieved successfully');
    } catch (error) {
        logger.error('Get admin doctors error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/pharmacies
 * @desc    Get all pharmacies
 * @access  Private (Admin)
 */
router.get('/pharmacies', async (req, res, next) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;
        const result = await database.query(
            `SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.lifeline_id 
       FROM pharmacies p 
       JOIN users u ON p.user_id = u.id 
       ORDER BY p.created_at DESC 
       LIMIT ${perPage} OFFSET ${offset}`
        );
        const countResult = await database.query('SELECT COUNT(*) as count FROM pharmacies');
        const total = parseInt(countResult.rows[0]?.count || 0);

        return successResponse(res, {
            pharmacies: result.rows,
            total,
            page: parseInt(page),
            limit: perPage
        }, 'Pharmacies retrieved successfully');
    } catch (error) {
        logger.error('Get admin pharmacies error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/hospitals
 * @desc    Get all hospitals
 * @access  Private (Admin)
 */
router.get('/hospitals', async (req, res, next) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;
        const result = await database.query(
            `SELECT h.*, u.email, u.first_name, u.last_name, u.phone, u.lifeline_id 
       FROM hospitals h 
       JOIN users u ON h.user_id = u.id 
       ORDER BY h.created_at DESC 
       LIMIT ${perPage} OFFSET ${offset}`
        );
        const countResult = await database.query('SELECT COUNT(*) as count FROM hospitals');
        const total = parseInt(countResult.rows[0]?.count || 0);

        return successResponse(res, {
            hospitals: result.rows,
            total,
            page: parseInt(page),
            limit: perPage
        }, 'Hospitals retrieved successfully');
    } catch (error) {
        logger.error('Get admin hospitals error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/verifications
 * @desc    Get pending verifications
 * @access  Private (Admin)
 */
router.get('/verifications', async (req, res, next) => {
    try {
        const doctors = await database.query(
            "SELECT d.*, u.email, u.first_name, u.last_name, 'doctor' as provider_type FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.verification_status = 'pending'"
        );
        const pharmacies = await database.query(
            "SELECT p.*, u.email, u.first_name, u.last_name, 'pharmacy' as provider_type FROM pharmacies p JOIN users u ON p.user_id = u.id WHERE p.verification_status = 'pending'"
        );
        const hospitals = await database.query(
            "SELECT h.*, u.email, u.first_name, u.last_name, 'hospital' as provider_type FROM hospitals h JOIN users u ON h.user_id = u.id WHERE h.verification_status = 'pending'"
        );

        const verifications = [
            ...doctors.rows,
            ...pharmacies.rows,
            ...hospitals.rows
        ];

        return successResponse(res, verifications, 'Verifications retrieved successfully');
    } catch (error) {
        logger.error('Get admin verifications error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/payments
 * @desc    Get all payments
 * @access  Private (Admin)
 */
router.get('/payments', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0, status } = req.query;
        let query = 'SELECT * FROM payment_records';
        const params = [];

        if (status) {
            params.push(status);
            query += ` WHERE status = $${params.length}`;
        }

        query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const result = await database.query(query, params);
        return successResponse(res, result.rows, 'Payments retrieved successfully');
    } catch (error) {
        logger.error('Get admin payments error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/payments/:id
 * @desc    Get payment by ID
 * @access  Private (Admin)
 */
router.get('/payments/:id', async (req, res, next) => {
    try {
        const result = await database.query('SELECT * FROM payment_records WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            return errorResponse(res, 'Payment not found', 404);
        }

        return successResponse(res, result.rows[0], 'Payment retrieved successfully');
    } catch (error) {
        logger.error('Get admin payment error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/statements
 * @desc    Get all statements
 * @access  Private (Admin)
 */
router.get('/statements', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const result = await database.query(
            `SELECT * FROM monthly_statements ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`
        );
        return successResponse(res, result.rows, 'Statements retrieved successfully');
    } catch (error) {
        logger.error('Get admin statements error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/settings
 * @desc    Get admin settings
 * @access  Private (Admin)
 */
router.get('/settings', async (req, res, next) => {
    try {
        const settings = loadSettings();
        return successResponse(res, settings, 'Settings retrieved successfully');
    } catch (error) {
        logger.error('Get admin settings error', { error: error.message });
        next(error);
    }
});

/**
 * @route   PUT /api/admin/settings
 * @desc    Update admin settings
 * @access  Private (Admin)
 */
router.put('/settings', async (req, res, next) => {
    try {
        const current = loadSettings();
        const updated = { ...current, ...req.body };
        saveSettings(updated);
        logger.info('Admin settings updated', { updatedBy: req.user.userId });
        return successResponse(res, updated, 'Settings updated successfully');
    } catch (error) {
        logger.error('Update admin settings error', { error: error.message });
        next(error);
    }
});

export default router;
