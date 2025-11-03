const { PasswordPolicy } = require('../models');
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');

class PasswordService {
  async validatePassword(password, organizationId) {
    try {
      const policy = await PasswordPolicy.findOne({
        where: { organizationId }
      });

      if (!policy) {
        throw new Error('Password policy not found');
      }

      const errors = [];

      // Length check
      if (password.length < policy.minLength) {
        errors.push(`Password must be at least ${policy.minLength} characters long`);
      }

      // Character type checks
      if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must include at least one uppercase letter');
      }
      if (policy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must include at least one lowercase letter');
      }
      if (policy.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must include at least one number');
      }
      if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must include at least one special character');
      }

      // Password strength check using zxcvbn
      const strength = zxcvbn(password);
      if (strength.score < 3) {
        errors.push('Password is too weak. Try using a longer phrase with mixed characters');
      }

      return {
        isValid: errors.length === 0,
        errors,
        strength: strength.score
      };
    } catch (error) {
      throw new Error(`Password validation failed: ${error.message}`);
    }
  }

  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, 12);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`Password verification failed: ${error.message}`);
    }
  }

  async checkPasswordHistory(userId, password, policy) {
    try {
      const user = await User.findByPk(userId, {
        include: ['passwordHistory']
      });

      // Check against previous passwords
      for (const historical of user.passwordHistory.slice(0, policy.passwordHistory)) {
        const matches = await bcrypt.compare(password, historical.hash);
        if (matches) {
          return false;
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Password history check failed: ${error.message}`);
    }
  }

  async updatePasswordPolicy(organizationId, updates) {
    try {
      const [policy] = await PasswordPolicy.upsert({
        organizationId,
        ...updates
      });

      return policy;
    } catch (error) {
      throw new Error(`Password policy update failed: ${error.message}`);
    }
  }

  async getPasswordPolicy(organizationId) {
    try {
      return await PasswordPolicy.findOne({
        where: { organizationId }
      });
    } catch (error) {
      throw new Error(`Password policy retrieval failed: ${error.message}`);
    }
  }

  generateRandomPassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*()'[Math.floor(Math.random() * 10)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  async checkPasswordExpiry(userId, organizationId) {
    try {
      const policy = await this.getPasswordPolicy(organizationId);
      const user = await User.findByPk(userId);

      if (!policy || !user.lastPasswordChange) {
        return { expired: false };
      }

      const daysSinceChange = Math.floor(
        (Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysUntilExpiry = policy.maxAge - daysSinceChange;

      return {
        expired: daysUntilExpiry <= 0,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        requiresChange: daysUntilExpiry <= 7 // Warn user 7 days before expiry
      };
    } catch (error) {
      throw new Error(`Password expiry check failed: ${error.message}`);
    }
  }

  async recordFailedAttempt(userId) {
    try {
      const user = await User.findByPk(userId);
      const attempts = (user.failedLoginAttempts || 0) + 1;
      
      await user.update({
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= policy.lockoutThreshold
          ? new Date(Date.now() + policy.lockoutDuration * 60 * 1000)
          : null
      });

      return {
        attempts,
        locked: attempts >= policy.lockoutThreshold,
        lockExpiry: user.lockedUntil
      };
    } catch (error) {
      throw new Error(`Failed attempt recording failed: ${error.message}`);
    }
  }

  async resetFailedAttempts(userId) {
    try {
      await User.update(
        {
          failedLoginAttempts: 0,
          lockedUntil: null
        },
        {
          where: { id: userId }
        }
      );
      return true;
    } catch (error) {
      throw new Error(`Failed attempts reset failed: ${error.message}`);
    }
  }
}

module.exports = new PasswordService();