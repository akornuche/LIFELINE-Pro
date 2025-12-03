import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from './logger.js';

// Token blacklist (in-memory, consider Redis for production)
const tokenBlacklist = new Set();

class JWTManager {
  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          lifelineId: payload.lifelineId,
        },
        config.jwt.secret,
        {
          expiresIn: config.jwt.expiresIn,
          issuer: 'lifeline-pro',
          audience: 'lifeline-api',
        }
      );

      return token;
    } catch (error) {
      logger.error('Failed to generate access token', {
        error: error.message,
        userId: payload.userId,
      });
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          tokenType: 'refresh',
        },
        config.jwt.refreshSecret,
        {
          expiresIn: config.jwt.refreshExpiresIn,
          issuer: 'lifeline-pro',
          audience: 'lifeline-api',
        }
      );

      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token', {
        error: error.message,
        userId: payload.userId,
      });
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  generateTokenPair(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: config.jwt.expiresIn,
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      // Check if token is blacklisted
      if (tokenBlacklist.has(token)) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'lifeline-pro',
        audience: 'lifeline-api',
      });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Token not yet active');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      // Check if token is blacklisted
      if (tokenBlacklist.has(token)) {
        throw new Error('Refresh token has been revoked');
      }

      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'lifeline-pro',
        audience: 'lifeline-api',
      });

      if (decoded.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (for inspection)
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Failed to decode token', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Generate new access token
      const newAccessToken = this.generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        lifelineId: decoded.lifelineId,
      });

      return {
        accessToken: newAccessToken,
        expiresIn: config.jwt.expiresIn,
      };
    } catch (error) {
      logger.error('Failed to refresh access token', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Blacklist a token (logout)
   */
  blacklistToken(token) {
    try {
      tokenBlacklist.add(token);
      
      // Optionally, auto-remove after expiry time
      const decoded = this.decodeToken(token);
      if (decoded && decoded.payload.exp) {
        const expiryTime = decoded.payload.exp * 1000 - Date.now();
        if (expiryTime > 0) {
          setTimeout(() => {
            tokenBlacklist.delete(token);
          }, expiryTime);
        }
      }

      logger.info('Token blacklisted', {
        tokenPrefix: token.substring(0, 20) + '...',
      });
    } catch (error) {
      logger.error('Failed to blacklist token', {
        error: error.message,
      });
    }
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token) {
    return tokenBlacklist.has(token);
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(token) {
    try {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.payload.exp) {
        return new Date(decoded.payload.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    try {
      const expiry = this.getTokenExpiry(token);
      if (!expiry) {
        return true;
      }
      return Date.now() > expiry.getTime();
    } catch (error) {
      return true;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Clear blacklist (for testing or maintenance)
   */
  clearBlacklist() {
    tokenBlacklist.clear();
    logger.info('Token blacklist cleared');
  }

  /**
   * Get blacklist size (for monitoring)
   */
  getBlacklistSize() {
    return tokenBlacklist.size;
  }
}

// Export singleton instance
const jwtManager = new JWTManager();
export default jwtManager;
export { JWTManager };

// Export convenience functions
export const blacklistToken = (token) => jwtManager.blacklistToken(token);
export const verifyAccessToken = (token) => jwtManager.verifyAccessToken(token);
export const verifyToken = (token) => jwtManager.verifyAccessToken(token);
export const verifyRefreshToken = (token) => jwtManager.verifyRefreshToken(token);
export const generateTokenPair = (payload) => jwtManager.generateTokenPair(payload);
export const generateAccessToken = (payload) => jwtManager.generateAccessToken(payload);
export const generateRefreshToken = (payload) => jwtManager.generateRefreshToken(payload);
export const refreshAccessToken = (refreshToken) => jwtManager.refreshAccessToken(refreshToken);
export const decodeToken = (token) => jwtManager.decodeToken(token);
export const isTokenBlacklisted = (token) => jwtManager.isTokenBlacklisted(token);
export const extractTokenFromHeader = (authHeader) => jwtManager.extractTokenFromHeader(authHeader);
