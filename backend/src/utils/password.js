import bcrypt from 'bcryptjs';
import config from '../config/index.js';
import logger from './logger.js';

class PasswordManager {
  /**
   * Hash a password
   */
  async hash(password) {
    try {
      const salt = await bcrypt.genSalt(config.security.bcryptRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      logger.error('Password hashing failed', {
        error: error.message,
      });
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare password with hash
   */
  async compare(password, hash) {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      logger.error('Password comparison failed', {
        error: error.message,
      });
      throw new Error('Failed to verify password');
    }
  }

  /**
   * Validate password strength
   */
  validateStrength(password) {
    const errors = [];
    const requirements = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialChar: true,
    };

    // Check length
    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }

    if (password.length > requirements.maxLength) {
      errors.push(`Password must not exceed ${requirements.maxLength} characters`);
    }

    // Check uppercase
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check lowercase
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check number
    if (requirements.requireNumber && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check special character
    if (requirements.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', 'Password123', '12345678', 'qwerty', 'abc123',
      'password1', 'Password1', '123456789', 'admin', 'letmein'
    ];

    if (commonPasswords.includes(password)) {
      errors.push('Password is too common. Please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculateStrength(password),
    };
  }

  /**
   * Calculate password strength score (0-100)
   */
  calculateStrength(password) {
    let score = 0;

    // Length bonus
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

    // Multiple character types
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (varietyCount >= 3) score += 10;
    if (varietyCount === 4) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Get password strength label
   */
  getStrengthLabel(score) {
    if (score < 40) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Good';
    return 'Strong';
  }

  /**
   * Generate a random password
   */
  generateRandom(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + numbers + special;

    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    return password;
  }

  /**
   * Check if password has been compromised (basic check)
   */
  async isCompromised(password) {
    // In production, integrate with HaveIBeenPwned API or similar
    // For now, just check against common passwords
    const commonPasswords = [
      'password', 'Password123', '12345678', 'qwerty', 'abc123',
      'password1', 'Password1', '123456789', 'admin', 'letmein',
      'welcome', 'monkey', '1234567890', 'password123', 'Password1!'
    ];

    return commonPasswords.includes(password);
  }

  /**
   * Generate password reset token (6-digit OTP)
   */
  generateResetToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash a reset token for storage
   */
  async hashResetToken(token) {
    return await this.hash(token);
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(token, hashedToken) {
    return await this.compare(token, hashedToken);
  }
}

// Export singleton instance
const passwordManager = new PasswordManager();
export default passwordManager;
export { PasswordManager };

// Export convenience functions
export const hashPassword = (password) => passwordManager.hash(password);
export const comparePassword = (password, hash) => passwordManager.compare(password, hash);
export const verifyPassword = (password, hash) => passwordManager.compare(password, hash);
export const validatePasswordStrength = (password) => passwordManager.validateStrength(password);
export const generateRandomPassword = (length) => passwordManager.generateRandom(length);
export const generateResetToken = () => passwordManager.generateResetToken();
export const hashResetToken = (token) => passwordManager.hashResetToken(token);
export const verifyResetToken = (token, hashedToken) => passwordManager.verifyResetToken(token, hashedToken);
