const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { User } = require('../models');
const { auditLog } = require('../middleware/auditLogger');

class WebAuthnService {
  constructor() {
    this.rpName = process.env.WEBAUTHN_RP_NAME || 'Enterprise Deployment Platform';
    this.rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
    this.origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    this.challenges = new Map(); // In production, use Redis
  }

  async generateRegistrationOptions(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const options = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userID: user.id.toString(),
        userName: user.email,
        userDisplayName: `${user.firstName} ${user.lastName}`,
        attestationType: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        supportedAlgorithmIDs: [-7, -257], // ES256, RS256
      });

      // Store challenge temporarily
      this.challenges.set(userId, options.challenge);

      return options;
    } catch (error) {
      throw new Error(`Registration options generation failed: ${error.message}`);
    }
  }

  async verifyRegistration(userId, credential) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const expectedChallenge = this.challenges.get(userId);
      if (!expectedChallenge) throw new Error('Challenge not found');

      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });

      if (verification.verified && verification.registrationInfo) {
        const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

        // Store authenticator in database
        const authenticator = {
          credentialID: Buffer.from(credentialID).toString('base64'),
          credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
          counter,
          transports: credential.response.transports || [],
        };

        // Update user with WebAuthn data
        const existingAuthenticators = user.webauthnAuthenticators || [];
        existingAuthenticators.push(authenticator);

        await user.update({
          webauthnAuthenticators: existingAuthenticators,
          webauthnEnabled: true,
        });

        // Clean up challenge
        this.challenges.delete(userId);

        return { verified: true, authenticator };
      }

      return { verified: false };
    } catch (error) {
      throw new Error(`Registration verification failed: ${error.message}`);
    }
  }

  async generateAuthenticationOptions(email) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user || !user.webauthnEnabled) {
        throw new Error('WebAuthn not enabled for user');
      }

      const authenticators = user.webauthnAuthenticators || [];
      const allowCredentials = authenticators.map(auth => ({
        id: Buffer.from(auth.credentialID, 'base64'),
        type: 'public-key',
        transports: auth.transports,
      }));

      const options = await generateAuthenticationOptions({
        rpID: this.rpID,
        allowCredentials,
        userVerification: 'preferred',
      });

      // Store challenge
      this.challenges.set(user.id, options.challenge);

      return { options, userId: user.id };
    } catch (error) {
      throw new Error(`Authentication options generation failed: ${error.message}`);
    }
  }

  async verifyAuthentication(userId, credential, req) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const expectedChallenge = this.challenges.get(userId);
      if (!expectedChallenge) throw new Error('Challenge not found');

      // Find the authenticator
      const authenticators = user.webauthnAuthenticators || [];
      const credentialIDBuffer = Buffer.from(credential.id, 'base64url');
      
      const authenticator = authenticators.find(auth => {
        const storedID = Buffer.from(auth.credentialID, 'base64');
        return credentialIDBuffer.equals(storedID);
      });

      if (!authenticator) throw new Error('Authenticator not found');

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: Buffer.from(authenticator.credentialID, 'base64'),
          credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64'),
          counter: authenticator.counter,
        },
      });

      if (verification.verified) {
        // Update counter
        authenticator.counter = verification.authenticationInfo.newCounter;
        await user.update({
          webauthnAuthenticators: authenticators,
          lastLogin: new Date(),
        });

        // Clean up challenge
        this.challenges.delete(userId);

        // Audit log
        await auditLog(req, 'WEBAUTHN_LOGIN', {
          userId: user.id,
          authenticatorId: authenticator.credentialID,
        });

        return { verified: true, user };
      }

      return { verified: false };
    } catch (error) {
      throw new Error(`Authentication verification failed: ${error.message}`);
    }
  }

  async removeAuthenticator(userId, credentialId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const authenticators = user.webauthnAuthenticators || [];
      const filteredAuthenticators = authenticators.filter(
        auth => auth.credentialID !== credentialId
      );

      await user.update({
        webauthnAuthenticators: filteredAuthenticators,
        webauthnEnabled: filteredAuthenticators.length > 0,
      });

      return true;
    } catch (error) {
      throw new Error(`Authenticator removal failed: ${error.message}`);
    }
  }

  async listAuthenticators(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const authenticators = user.webauthnAuthenticators || [];
      return authenticators.map(auth => ({
        id: auth.credentialID,
        transports: auth.transports,
        counter: auth.counter,
        createdAt: auth.createdAt || new Date(),
      }));
    } catch (error) {
      throw new Error(`Authenticator listing failed: ${error.message}`);
    }
  }

  async isWebAuthnAvailable(userAgent) {
    // Check if WebAuthn is supported by the browser
    const supportedBrowsers = [
      'Chrome/67', 'Firefox/60', 'Safari/14', 'Edge/18'
    ];

    return supportedBrowsers.some(browser => 
      userAgent.includes(browser.split('/')[0])
    );
  }

  async getRegistrationStatus(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      return {
        enabled: user.webauthnEnabled || false,
        authenticatorCount: (user.webauthnAuthenticators || []).length,
        lastUsed: user.lastLogin,
      };
    } catch (error) {
      throw new Error(`Registration status check failed: ${error.message}`);
    }
  }

  // Cleanup expired challenges (run periodically)
  cleanupExpiredChallenges() {
    const now = Date.now();
    const expiredTime = 5 * 60 * 1000; // 5 minutes

    for (const [userId, challenge] of this.challenges.entries()) {
      if (now - challenge.timestamp > expiredTime) {
        this.challenges.delete(userId);
      }
    }
  }
}

module.exports = new WebAuthnService();