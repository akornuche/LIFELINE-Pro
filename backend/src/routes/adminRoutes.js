import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/rbac.js';
import { successResponse, errorResponse } from '../utils/response.js';
import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { auditAdmin, auditDataAccess } from '../middleware/auditLog.js';

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
            revenueGrowth: 0,
            activeProviders: totalProviders,
            doctorCount: parseInt(doctorsResult.rows[0]?.count || 0),
            pharmacyCount: parseInt(pharmaciesResult.rows[0]?.count || 0),
            hospitalCount: parseInt(hospitalsResult.rows[0]?.count || 0),
            totalTransactions: 0,
        };

        // Get transaction count
        try {
            const txResult = await db.query('SELECT COUNT(*) as count FROM payment_records');
            statistics.totalTransactions = parseInt(txResult.rows[0]?.count || 0);
        } catch (e) {
            // payment_records may not exist yet
        }

        // Get recent activities (last 10 user registrations + verifications)
        const recentActivities = [];
        try {
            const recentUsers = await db.query(
                "SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"
            );
            for (const u of recentUsers.rows) {
                recentActivities.push({
                    id: 'user-' + u.id,
                    type: 'user',
                    title: `New ${u.role} registered`,
                    description: `${u.first_name || ''} ${u.last_name || ''} (${u.email})`.trim(),
                    date: u.created_at,
                });
            }
        } catch (e) { /* ignore */ }
        try {
            const recentPayments = await db.query(
                "SELECT id, amount, status, payment_type, created_at FROM payment_records ORDER BY created_at DESC LIMIT 5"
            );
            for (const p of recentPayments.rows) {
                recentActivities.push({
                    id: 'pay-' + p.id,
                    type: 'payment',
                    title: `Payment ${p.status}`,
                    description: `₦${Number(p.amount || 0).toLocaleString()} - ${p.payment_type || 'general'}`,
                    date: p.created_at,
                });
            }
        } catch (e) { /* ignore */ }
        // Sort by date descending
        recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
        statistics.recentActivities = recentActivities.slice(0, 10);

        return successResponse(res, statistics, 'Statistics retrieved successfully');
    } catch (error) {
        logger.error('Get admin statistics error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/analytics/time-series
 * @desc    Get time-series data for analytics charts (user growth + revenue by month)
 * @access  Private (Admin)
 */
router.get('/analytics/time-series', async (req, res, next) => {
    try {
        const db = database;
        const { months = 6 } = req.query;
        const monthCount = Math.min(parseInt(months) || 6, 12);

        // Build month labels dynamically
        const labels = [];
        const userCounts = [];
        const revenueCounts = [];
        const now = new Date();

        for (let i = monthCount - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const monthStr = d.toLocaleString('en-US', { month: 'short' });
            labels.push(monthStr);

            // Pad month for SQLite date comparison
            const monthPad = String(month).padStart(2, '0');
            const startDate = `${year}-${monthPad}-01`;
            const endMonth = month === 12 ? 1 : month + 1;
            const endYear = month === 12 ? year + 1 : year;
            const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

            // User registrations in this month
            try {
                const userResult = await db.query(
                    `SELECT COUNT(*) as count FROM users WHERE created_at >= $1 AND created_at < $2`,
                    [startDate, endDate]
                );
                userCounts.push(parseInt(userResult.rows[0]?.count || 0));
            } catch (e) {
                userCounts.push(0);
            }

            // Revenue in this month
            try {
                const revResult = await db.query(
                    `SELECT COALESCE(SUM(amount), 0) as total FROM payment_records WHERE (status = 'completed' OR status = 'success') AND created_at >= $1 AND created_at < $2`,
                    [startDate, endDate]
                );
                revenueCounts.push(parseFloat(revResult.rows[0]?.total || 0));
            } catch (e) {
                revenueCounts.push(0);
            }
        }

        return successResponse(res, {
            labels,
            userGrowth: userCounts,
            revenue: revenueCounts,
        }, 'Time-series data retrieved');
    } catch (error) {
        logger.error('Get analytics time-series error', { error: error.message });
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
router.put('/users/:id', auditAdmin('user_update'), async (req, res, next) => {
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
router.post('/users/:id/deactivate', auditAdmin('user_deactivate'), async (req, res, next) => {
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
router.post('/users/:id/activate', auditAdmin('user_activate'), async (req, res, next) => {
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
        const { limit = 10, page = 1, search, package: pkg } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;

        let query = `SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.lifeline_id 
       FROM patients p 
       JOIN users u ON p.user_id = u.id`;
        let countQuery = 'SELECT COUNT(*) as count FROM patients p JOIN users u ON p.user_id = u.id';
        const conditions = [];
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(u.first_name LIKE $${params.length} OR u.last_name LIKE $${params.length} OR u.email LIKE $${params.length} OR u.phone LIKE $${params.length})`);
        }
        if (pkg) {
            params.push(pkg);
            conditions.push(`p.current_package = $${params.length}`);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY p.created_at DESC LIMIT ${perPage} OFFSET ${offset}`;

        const result = await database.query(query, params);
        const countResult = await database.query(countQuery, params);
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
 * @route   GET /api/admin/patients/:id/export
 * @desc    Export patient data (profile, consultations, prescriptions, payments)
 * @access  Private (Admin)
 */
router.get('/patients/:id/export', auditDataAccess('export'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const db = database;

        // Get patient + user info
        const patientResult = await db.query(
            `SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.lifeline_id, u.date_of_birth, u.gender, u.city, u.state
             FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
            [id]
        );
        if (patientResult.rows.length === 0) {
            return errorResponse(res, 'Patient not found', 404);
        }
        const patient = patientResult.rows[0];

        // Get consultations
        let consultations = [];
        try {
            const cResult = await db.query(
                `SELECT c.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
                 FROM consultations c
                 LEFT JOIN doctors d ON c.doctor_id = d.id
                 LEFT JOIN users u ON d.user_id = u.id
                 WHERE c.patient_id = $1 ORDER BY c.created_at DESC`,
                [id]
            );
            consultations = cResult.rows;
        } catch (e) { /* table may not have data */ }

        // Get prescriptions
        let prescriptions = [];
        try {
            const pResult = await db.query(
                `SELECT pr.* FROM prescriptions pr WHERE pr.patient_id = $1 ORDER BY pr.created_at DESC`,
                [id]
            );
            prescriptions = pResult.rows;
        } catch (e) { /* ignore */ }

        // Get payment records
        let payments = [];
        try {
            const payResult = await db.query(
                `SELECT * FROM payment_records WHERE patient_id = $1 ORDER BY created_at DESC`,
                [id]
            );
            payments = payResult.rows;
        } catch (e) { /* ignore */ }

        // Get dependents
        let dependents = [];
        try {
            const depResult = await db.query(
                `SELECT * FROM dependents WHERE patient_id = $1`,
                [id]
            );
            dependents = depResult.rows;
        } catch (e) { /* ignore */ }

        // Build text export
        const lines = [
            '=======================================',
            'LIFELINE Pro - Patient Data Export',
            '=======================================',
            '',
            'PATIENT INFORMATION',
            '-------------------',
            `Name:            ${patient.first_name || ''} ${patient.last_name || ''}`,
            `LifeLine ID:     ${patient.lifeline_id || 'N/A'}`,
            `Email:           ${patient.email}`,
            `Phone:           ${patient.phone || 'N/A'}`,
            `Date of Birth:   ${patient.date_of_birth || 'N/A'}`,
            `Gender:          ${patient.gender || 'N/A'}`,
            `City:            ${patient.city || 'N/A'}`,
            `State:           ${patient.state || 'N/A'}`,
            `Package:         ${patient.current_package || 'GENERAL'}`,
            `Subscription:    ${patient.subscription_status || 'N/A'}`,
            `Blood Type:      ${patient.blood_type || 'N/A'}`,
            `Allergies:       ${patient.allergies || 'None reported'}`,
            '',
        ];

        if (dependents.length > 0) {
            lines.push('DEPENDENTS', '---------');
            dependents.forEach((d, i) => {
                lines.push(`  ${i + 1}. ${d.first_name} ${d.last_name} (${d.relationship}) - DOB: ${d.date_of_birth}`);
            });
            lines.push('');
        }

        if (consultations.length > 0) {
            lines.push(`CONSULTATIONS (${consultations.length})`, '-------------');
            consultations.forEach((c, i) => {
                lines.push(`  ${i + 1}. [${c.status}] ${c.consultation_type || 'General'} on ${c.appointment_date || c.created_at}`);
                if (c.doctor_first_name) lines.push(`     Doctor: Dr. ${c.doctor_first_name} ${c.doctor_last_name}`);
                if (c.diagnosis) lines.push(`     Diagnosis: ${c.diagnosis}`);
                if (c.referral_needed) lines.push(`     Referral: ${c.referral_to || 'Yes'}`);
            });
            lines.push('');
        }

        if (prescriptions.length > 0) {
            lines.push(`PRESCRIPTIONS (${prescriptions.length})`, '--------------');
            prescriptions.forEach((p, i) => {
                lines.push(`  ${i + 1}. [${p.status}] Created: ${p.created_at}`);
                if (p.medications) lines.push(`     Medications: ${p.medications}`);
            });
            lines.push('');
        }

        if (payments.length > 0) {
            lines.push(`PAYMENT RECORDS (${payments.length})`, '----------------');
            payments.forEach((p, i) => {
                lines.push(`  ${i + 1}. [${p.status}] ₦${Number(p.amount || 0).toLocaleString()} - ${p.payment_type || 'N/A'} (${p.created_at})`);
            });
            lines.push('');
        }

        lines.push('', `Export generated: ${new Date().toISOString()}`);

        const content = lines.join('\n');
        const filename = `patient-${patient.lifeline_id || id}.txt`;

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(content);
    } catch (error) {
        logger.error('Export patient data error', { error: error.message, id: req.params.id });
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
        const { limit = 10, page = 1, search, specialization, verified } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;

        let query = `SELECT d.*, u.email, u.first_name, u.last_name, u.phone, u.lifeline_id 
       FROM doctors d 
       JOIN users u ON d.user_id = u.id`;
        let countQuery = 'SELECT COUNT(*) as count FROM doctors d JOIN users u ON d.user_id = u.id';
        const conditions = [];
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(u.first_name LIKE $${params.length} OR u.last_name LIKE $${params.length} OR u.email LIKE $${params.length} OR d.specialization LIKE $${params.length})`);
        }
        if (specialization) {
            params.push(`%${specialization}%`);
            conditions.push(`d.specialization LIKE $${params.length}`);
        }
        if (verified === 'true') {
            conditions.push("d.verification_status = 'verified'");
        } else if (verified === 'false') {
            conditions.push("d.verification_status != 'verified'");
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY d.created_at DESC LIMIT ${perPage} OFFSET ${offset}`;

        const result = await database.query(query, params);
        const countResult = await database.query(countQuery, params);
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
        const { limit = 10, page = 1, search, verified } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;

        let query = `SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.lifeline_id 
       FROM pharmacies p 
       JOIN users u ON p.user_id = u.id`;
        let countQuery = 'SELECT COUNT(*) as count FROM pharmacies p JOIN users u ON p.user_id = u.id';
        const conditions = [];
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(p.pharmacy_name LIKE $${params.length} OR u.email LIKE $${params.length} OR u.phone LIKE $${params.length})`);
        }
        if (verified === 'true') {
            conditions.push("p.verification_status = 'verified'");
        } else if (verified === 'false') {
            conditions.push("p.verification_status != 'verified'");
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY p.created_at DESC LIMIT ${perPage} OFFSET ${offset}`;

        const result = await database.query(query, params);
        const countResult = await database.query(countQuery, params);
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
        const { limit = 10, page = 1, search, verified } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;

        let query = `SELECT h.*, u.email, u.first_name, u.last_name, u.phone, u.lifeline_id 
       FROM hospitals h 
       JOIN users u ON h.user_id = u.id`;
        let countQuery = 'SELECT COUNT(*) as count FROM hospitals h JOIN users u ON h.user_id = u.id';
        const conditions = [];
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(h.hospital_name LIKE $${params.length} OR u.email LIKE $${params.length} OR u.phone LIKE $${params.length})`);
        }
        if (verified === 'true') {
            conditions.push("h.verification_status = 'verified'");
        } else if (verified === 'false') {
            conditions.push("h.verification_status != 'verified'");
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ` ORDER BY h.created_at DESC LIMIT ${perPage} OFFSET ${offset}`;

        const result = await database.query(query, params);
        const countResult = await database.query(countQuery, params);
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
        const { provider_type, status: filterStatus } = req.query;
        const verificationStatus = filterStatus || 'pending';

        const allVerifications = [];

        if (!provider_type || provider_type === 'doctor') {
            const doctors = await database.query(
                `SELECT d.*, u.email, u.first_name, u.last_name, 'doctor' as provider_type FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.verification_status = $1`,
                [verificationStatus]
            );
            allVerifications.push(...doctors.rows.map(r => ({
                ...r,
                provider_name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email,
                license: r.license_number,
                submitted_date: r.created_at,
                status: r.verification_status,
            })));
        }
        if (!provider_type || provider_type === 'pharmacy') {
            const pharmacies = await database.query(
                `SELECT p.*, u.email, u.first_name, u.last_name, 'pharmacy' as provider_type FROM pharmacies p JOIN users u ON p.user_id = u.id WHERE p.verification_status = $1`,
                [verificationStatus]
            );
            allVerifications.push(...pharmacies.rows.map(r => ({
                ...r,
                provider_name: r.pharmacy_name || r.email,
                license: r.license_number,
                submitted_date: r.created_at,
                status: r.verification_status,
            })));
        }
        if (!provider_type || provider_type === 'hospital') {
            const hospitals = await database.query(
                `SELECT h.*, u.email, u.first_name, u.last_name, 'hospital' as provider_type FROM hospitals h JOIN users u ON h.user_id = u.id WHERE h.verification_status = $1`,
                [verificationStatus]
            );
            allVerifications.push(...hospitals.rows.map(r => ({
                ...r,
                provider_name: r.hospital_name || r.email,
                license: r.license_number,
                submitted_date: r.created_at,
                status: r.verification_status,
            })));
        }

        return successResponse(res, allVerifications, 'Verifications retrieved successfully');
    } catch (error) {
        logger.error('Get admin verifications error', { error: error.message });
        next(error);
    }
});

/**
 * @route   POST /api/admin/verifications/:id/verify
 * @desc    Approve a provider verification
 * @access  Private (Admin)
 */
router.post('/verifications/:id/verify', auditAdmin('provider_verify'), async (req, res, next) => {
    try {
        const providerId = req.params.id;
        const { providerType } = req.body;

        if (!providerType || !['doctor', 'pharmacy', 'hospital'].includes(providerType)) {
            return errorResponse(res, 'Valid providerType (doctor/pharmacy/hospital) is required', 400);
        }

        const tableMap = { doctor: 'doctors', pharmacy: 'pharmacies', hospital: 'hospitals' };
        const table = tableMap[providerType];

        const result = await database.query(
            `UPDATE ${table} SET verification_status = 'verified', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [providerId]
        );

        if (result.changes === 0) {
            return errorResponse(res, 'Provider not found', 404);
        }

        logger.info('Provider verified', { providerId, providerType, approvedBy: req.user.userId });

        return successResponse(res, { id: providerId, verification_status: 'verified' }, 'Provider verified successfully');
    } catch (error) {
        logger.error('Verify provider error', { error: error.message });
        next(error);
    }
});

/**
 * @route   POST /api/admin/verifications/:id/reject
 * @desc    Reject a provider verification
 * @access  Private (Admin)
 */
router.post('/verifications/:id/reject', auditAdmin('provider_reject'), async (req, res, next) => {
    try {
        const providerId = req.params.id;
        const { providerType, reason = 'Verification rejected by admin' } = req.body;

        if (!providerType || !['doctor', 'pharmacy', 'hospital'].includes(providerType)) {
            return errorResponse(res, 'Valid providerType (doctor/pharmacy/hospital) is required', 400);
        }

        const tableMap = { doctor: 'doctors', pharmacy: 'pharmacies', hospital: 'hospitals' };
        const table = tableMap[providerType];

        const result = await database.query(
            `UPDATE ${table} SET verification_status = 'rejected', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [reason, providerId]
        );

        if (result.changes === 0) {
            return errorResponse(res, 'Provider not found', 404);
        }

        logger.info('Provider rejected', { providerId, providerType, reason, rejectedBy: req.user.userId });

        return successResponse(res, { id: providerId, verification_status: 'rejected', reason }, 'Provider verification rejected');
    } catch (error) {
        logger.error('Reject provider error', { error: error.message });
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
        const { limit = 10, page = 1, status, search, type } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;

        let query = 'SELECT * FROM payment_records';
        let countQuery = 'SELECT COUNT(*) as count FROM payment_records';
        const conditions = [];
        const params = [];

        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }
        if (type) {
            params.push(type);
            conditions.push(`payment_type = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(reference LIKE $${params.length} OR transaction_reference LIKE $${params.length})`);
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

        // Compute stats
        let stats = { totalRevenue: 0, totalTransactions: total, successRate: 0, pendingPayments: 0 };
        try {
            const revenueResult = await database.query("SELECT COALESCE(SUM(amount), 0) as total FROM payment_records WHERE status = 'completed' OR status = 'success'");
            stats.totalRevenue = parseFloat(revenueResult.rows[0]?.total || 0);
            const successResult = await database.query("SELECT COUNT(*) as count FROM payment_records WHERE status = 'completed' OR status = 'success'");
            const successCount = parseInt(successResult.rows[0]?.count || 0);
            const allResult = await database.query('SELECT COUNT(*) as count FROM payment_records');
            const allCount = parseInt(allResult.rows[0]?.count || 0);
            stats.totalTransactions = allCount;
            stats.successRate = allCount > 0 ? Math.round((successCount / allCount) * 100) : 0;
            const pendingResult = await database.query("SELECT COUNT(*) as count FROM payment_records WHERE status = 'pending'");
            stats.pendingPayments = parseInt(pendingResult.rows[0]?.count || 0);
        } catch (e) { /* ignore */ }

        return successResponse(res, {
            payments: result.rows,
            stats,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / perPage),
            perPage,
        }, 'Payments retrieved successfully');
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
        const { limit = 10, page = 1, provider_type, period } = req.query;
        const perPage = parseInt(limit);
        const offset = (parseInt(page) - 1) * perPage;

        let query = 'SELECT * FROM monthly_statements';
        let countQuery = 'SELECT COUNT(*) as count FROM monthly_statements';
        const conditions = [];
        const params = [];

        if (provider_type) {
            params.push(provider_type);
            conditions.push(`provider_type = $${params.length}`);
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
            statements: result.rows,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / perPage),
            perPage,
        }, 'Statements retrieved successfully');
    } catch (error) {
        logger.error('Get admin statements error', { error: error.message });
        next(error);
    }
});

/**
 * @route   GET /api/admin/statements/:id/download
 * @desc    Download a statement as PDF
 * @access  Private (Admin)
 */
router.get('/statements/:id/download', async (req, res, next) => {
    try {
        const result = await database.query('SELECT * FROM monthly_statements WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
            return errorResponse(res, 'Statement not found', 404);
        }

        const stmt = result.rows[0];

        // Generate a simple text-based receipt as PDF alternative
        const content = [
            'LIFELINE Pro - Monthly Statement',
            '================================',
            '',
            `Statement ID: ${stmt.id}`,
            `Provider Type: ${stmt.provider_type}`,
            `Period: ${stmt.month}/${stmt.year}`,
            `Status: ${stmt.status}`,
            '',
            'Financial Summary',
            '-----------------',
            `Total Amount:      \u20a6${Number(stmt.total_amount || 0).toLocaleString()}`,
            `Transaction Count: ${stmt.transaction_count || 0}`,
            `Platform Fee:      \u20a6${Number(stmt.platform_fee || 0).toLocaleString()}`,
            `Net Amount:        \u20a6${Number(stmt.net_amount || 0).toLocaleString()}`,
            '',
            `Generated: ${new Date().toISOString()}`,
        ].join('\n');

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="statement-${stmt.id}.txt"`);
        return res.send(content);
    } catch (error) {
        logger.error('Download statement error', { error: error.message });
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
router.put('/settings', auditAdmin('config_change'), async (req, res, next) => {
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
