import database from '../database/connection.js';
import passwordManager from '../utils/password.js';
import logger from '../utils/logger.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import { randomUUID } from 'crypto';

/**
 * User Repository
 * Database operations for the users table
 */

/**
 * Create a new user
 */
export const createUser = async (userData) => {
  const {
    lifelineId,
    email,
    password: hashedPassword,
    role,
    firstName,
    lastName,
    phone,
    city = null,
    state = null,
    isActive = true,
    isEmailVerified = true,
  } = userData;

  try {
    // Generate UUID for id
    const id = randomUUID();

    const result = await database.query(
      `INSERT INTO users (
        id, lifeline_id, email, password_hash, role,
        first_name, last_name, phone,
        city, state,
        status, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        lifelineId,
        email.toLowerCase(),
        hashedPassword,
        role,
        firstName,
        lastName,
        phone,
        city,
        state,
        isActive ? 'active' : 'inactive',
        isEmailVerified ? 1 : 0,
      ]
    );

    // For SQLite, get the inserted user data
    logger.info('INSERT result', { lastID: result.lastID, changes: result.changes });
    
    const userResult = await database.query(
      `SELECT id, lifeline_id, email, role, first_name, last_name, 
              phone, status, email_verified, created_at
       FROM users 
       WHERE id = $1`,
      [id]
    );

    logger.info('SELECT result', { rowCount: userResult.rows.length, id });

    if (userResult.rows.length === 0) {
      logger.error('User not found after INSERT', { id, email });
      throw new Error('User creation failed - user not found after insert');
    }

    logger.info('User created', {
      userId: userResult.rows[0].id,
      email,
      role,
    });

    return userResult.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      if (error.constraint === 'users_email_key') {
        throw new ConflictError('Email already exists');
      }
      if (error.constraint === 'users_lifeline_id_key') {
        throw new ConflictError('LifeLine ID already exists');
      }
    }
    logger.error('Error creating user', {
      error: error.message,
      email,
    });
    throw error;
  }
};

/**
 * Find user by ID
 */
export const findById = async (userId) => {
  try {
    const result = await database.query(
      `SELECT id, lifeline_id, email, password_hash, role,
              first_name, last_name, phone, profile_image_url as profile_picture,
              status, (status = 'active') as is_active, 
              email_verified, (email_verified = 1) as is_email_verified,
              last_login_at, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding user by ID', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Find user by email
 */
export const findByEmail = async (email) => {
  try {
    const result = await database.query(
      `SELECT id, lifeline_id, email, password_hash, role,
              first_name, last_name, phone, profile_image_url as profile_picture,
              status, (status = 'active') as is_active, 
              email_verified, (email_verified = 1) as is_email_verified,
              last_login_at, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error finding user by email', {
      error: error.message,
      email,
    });
    throw error;
  }
};

/**
 * Find user by LifeLine ID
 */
export const findByLifelineId = async (lifelineId) => {
  try {
    const result = await database.query(
      `SELECT id, lifeline_id, email, password_hash, role,
              first_name, last_name, phone, profile_image_url as profile_picture,
              status, (status = 'active') as is_active, 
              email_verified, (email_verified = 1) as is_email_verified,
              last_login_at, created_at, updated_at
       FROM users
       WHERE lifeline_id = $1`,
      [lifelineId]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error finding user by LifeLine ID', {
      error: error.message,
      lifelineId,
    });
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, updates) => {
  const allowedFields = [
    'first_name',
    'last_name',
    'phone',
    'date_of_birth',
    'address',
    'profile_image_url',
  ];

  const mappedUpdates = {};
  const fieldMapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    dateOfBirth: 'date_of_birth',
    profile_picture: 'profile_image_url',
    profilePicture: 'profile_image_url',
  };

  Object.keys(updates).forEach((key) => {
    const dbKey = fieldMapping[key] || key;
    if (allowedFields.includes(dbKey) && updates[key] !== undefined) {
      mappedUpdates[dbKey] = updates[key];
    }
  });

  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(mappedUpdates).forEach((key) => {
    fields.push(`${key} = $${paramCount}`);
    values.push(mappedUpdates[key]);
    paramCount++;
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push(`updated_at = datetime('now')`);
  values.push(userId);

  try {
    const result = await database.query(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}`,
      values
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('User');
    }

    // Since SQLite RETURNING might be inconsistent, fetch the updated user manually
    const updatedUser = await findById(userId);

    logger.info('User profile updated', { userId });

    return updatedUser;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating user profile', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update user email
 */
export const updateEmail = async (userId, newEmail) => {
  try {
    const result = await database.query(
      `UPDATE users
       SET email = $1, email_verified = 0, updated_at = datetime('now')
       WHERE id = $2
       RETURNING id, email, email_verified as is_email_verified`,
      [newEmail.toLowerCase(), userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    logger.info('User email updated', { userId, newEmail });

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      throw new ConflictError('Email already exists');
    }
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating user email', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update user password
 */
export const updatePassword = async (userId, hashedPassword) => {
  try {
    // NOTE: password is expected to be already hashed by the calling service
    const result = await database.query(
      `UPDATE users
       SET password_hash = $1, updated_at = datetime('now')
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('User');
    }

    logger.info('User password updated', { userId });

    return { id: userId };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating user password', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Verify user password
 */
export const verifyPassword = async (userId, password) => {
  try {
    const result = await database.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    const isValid = await passwordManager.compare(password, result.rows[0].password_hash);
    return isValid;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error verifying password', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Mark email as verified
 */
export const verifyEmail = async (userId) => {
  try {
    const result = await database.query(
      `UPDATE users
       SET email_verified = 1, updated_at = datetime('now')
       WHERE id = $1
       RETURNING id, email_verified as is_email_verified`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    logger.info('User email verified', { userId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error verifying email', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (userId) => {
  try {
    await database.query(
      `UPDATE users
       SET last_login_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );

    logger.debug('User last login updated', { userId });
  } catch (error) {
    logger.error('Error updating last login', {
      error: error.message,
      userId,
    });
    // Don't throw - this is a non-critical operation
  }
};

/**
 * Activate user account
 */
export const activateAccount = async (userId) => {
  try {
    const result = await database.query(
      `UPDATE users
       SET status = 'active', updated_at = datetime('now')
       WHERE id = $1
       RETURNING id, status as is_active`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    logger.info('User account activated', { userId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error activating account', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Deactivate user account
 */
export const deactivateAccount = async (userId) => {
  try {
    const result = await database.query(
      `UPDATE users
       SET status = 'inactive', updated_at = datetime('now')
       WHERE id = $1
       RETURNING id, status as is_active`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    logger.info('User account deactivated', { userId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error deactivating account', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Delete user account (soft delete)
 */
export const deleteAccount = async (userId) => {
  try {
    // Soft delete by deactivating and marking email as unique
    const suffix = Date.now();
    const result = await database.query(
      `UPDATE users
       SET status = 'deleted',
           email = email || '.deleted.' || $2,
           updated_at = datetime('now')
       WHERE id = $1`,
      [userId, suffix]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('User');
    }

    logger.warn('User account deleted', { userId });

    return { userId };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error deleting account', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get users by role
 */
export const findByRole = async (role, options = {}) => {
  const { limit = 50, offset = 0, isActive = null } = options;

  try {
    let query = `
      SELECT id, lifeline_id, email, role, first_name, last_name, 
             phone, profile_image_url as profile_picture, status as is_active, email_verified as is_email_verified, created_at
      FROM users
      WHERE role = $1
    `;
    const params = [role];
    let paramCount = 1;

    if (isActive !== null) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(isActive ? 'active' : 'inactive');
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error finding users by role', {
      error: error.message,
      role,
    });
    throw error;
  }
};

/**
 * Count users by role
 */
export const countByRole = async (role, isActive = null) => {
  try {
    let query = 'SELECT COUNT(*) as count FROM users WHERE role = $1';
    const params = [role];

    if (isActive !== null) {
      query += " AND status = $2";
      params.push(isActive ? 'active' : 'inactive');
    }

    const result = await database.query(query, params);

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error counting users by role', {
      error: error.message,
      role,
    });
    throw error;
  }
};

/**
 * Search users
 */
export const searchUsers = async (searchTerm, options = {}) => {
  const { role = null, limit = 50, offset = 0 } = options;

  try {
    let query = `
      SELECT id, lifeline_id, email, role, first_name, last_name, 
             phone, status as is_active, email_verified as is_email_verified, created_at
      FROM users
      WHERE (
        LOWER(first_name) LIKE LOWER($1) OR
        LOWER(last_name) LIKE LOWER($1) OR
        LOWER(email) LIKE LOWER($1) OR
        lifeline_id LIKE $1
      )
    `;
    const params = [`%${searchTerm}%`];
    let paramCount = 1;

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error searching users', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Check if email exists
 */
export const emailExists = async (email) => {
  try {
    const result = await database.query(
      `SELECT COUNT(*) as count FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    return result.rows[0].count > 0;
  } catch (error) {
    logger.error('Error checking email existence', {
      error: error.message,
      email,
    });
    throw error;
  }
};

/**
 * Check if LifeLine ID exists
 */
export const lifelineIdExists = async (lifelineId) => {
  try {
    const result = await database.query(
      `SELECT COUNT(*) as count FROM users WHERE lifeline_id = $1`,
      [lifelineId]
    );

    return result.rows[0].count > 0;
  } catch (error) {
    logger.error('Error checking LifeLine ID existence', {
      error: error.message,
      lifelineId,
    });
    throw error;
  }
};

export default {
  createUser,
  findById,
  findByEmail,
  findByLifelineId,
  updateProfile,
  updateEmail,
  updatePassword,
  verifyPassword,
  verifyEmail,
  updateLastLogin,
  activateAccount,
  deactivateAccount,
  deleteAccount,
  findByRole,
  countByRole,
  searchUsers,
  emailExists,
  lifelineIdExists,
};
