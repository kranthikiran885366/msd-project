const crypto = require('crypto');
const { AuditLog } = require('../../models/AuditLog');
const { User } = require('../../models/User');
const { Team } = require('../../models/Team');

class SAMLService {
  constructor() {
    this.providers = new Map();
    this.initializeDefaultProviders();
  }

  initializeDefaultProviders() {
    this.providers.set('azure', {
      entryPoint: process.env.AZURE_SAML_ENTRY_POINT,
      issuer: process.env.AZURE_SAML_ISSUER,
      cert: process.env.AZURE_SAML_CERT,
      callbackUrl: `${process.env.BASE_URL}/auth/saml/azure/callback`
    });
  }

  async configureSAMLProvider(teamId, provider, config) {
    try {
      const samlConfig = {
        entryPoint: config.entryPoint,
        issuer: config.issuer,
        cert: config.cert,
        callbackUrl: `${process.env.BASE_URL}/auth/saml/${teamId}/callback`,
        wantAssertionsSigned: true,
        signatureAlgorithm: 'sha256'
      };

      await this.storeSAMLConfig(teamId, provider, samlConfig);

      await AuditLog.create({
        teamId,
        action: 'saml_provider_configured',
        details: { provider, issuer: config.issuer },
        timestamp: new Date()
      });

      return { success: true, config: samlConfig };
    } catch (error) {
      throw new Error(`SAML configuration failed: ${error.message}`);
    }
  }

  async storeSAMLConfig(teamId, provider, config) {
    const encryptedConfig = this.encryptConfig(config);
    
    await Team.update(
      { 
        samlConfig: {
          provider,
          config: encryptedConfig,
          enabled: true,
          createdAt: new Date()
        }
      },
      { where: { id: teamId } }
    );
  }

  encryptConfig(config) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.SAML_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  async handleSAMLResponse(teamId, samlResponse) {
    try {
      const team = await Team.findByPk(teamId);
      if (!team?.samlConfig?.enabled) {
        throw new Error('SAML not configured for team');
      }

      const profile = this.parseSAMLResponse(samlResponse);
      const user = await this.createOrUpdateSAMLUser(teamId, profile);

      await AuditLog.create({
        teamId,
        userId: user.id,
        action: 'saml_login_success',
        details: { email: profile.email },
        timestamp: new Date()
      });

      return user;
    } catch (error) {
      await AuditLog.create({
        teamId,
        action: 'saml_login_failed',
        details: { error: error.message },
        timestamp: new Date()
      });
      throw error;
    }
  }

  parseSAMLResponse(samlResponse) {
    // Simplified SAML response parsing
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf8');
    const emailMatch = decoded.match(/emailaddress[^>]*>([^<]+)</i);
    const nameMatch = decoded.match(/givenname[^>]*>([^<]+)</i);
    
    return {
      email: emailMatch ? emailMatch[1] : null,
      firstName: nameMatch ? nameMatch[1] : null,
      lastName: 'User'
    };
  }

  async createOrUpdateSAMLUser(teamId, profile) {
    const [user] = await User.findOrCreate({
      where: { email: profile.email },
      defaults: {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        authProvider: 'saml',
        emailVerified: true,
        teamId
      }
    });

    return user;
  }

  generateSAMLMetadata(teamId, config) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" 
                     entityID="${config.issuer}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                Location="${config.callbackUrl}"
                                index="1" />
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }

  async getSAMLLoginURL(teamId, provider) {
    const team = await Team.findByPk(teamId);
    if (!team?.samlConfig?.enabled) {
      throw new Error('SAML not configured');
    }

    const config = team.samlConfig.config;
    const samlRequest = this.generateSAMLRequest(config);
    
    return `${config.entryPoint}?SAMLRequest=${encodeURIComponent(samlRequest)}`;
  }

  generateSAMLRequest(config) {
    const id = '_' + crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();
    
    const samlRequest = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                                           ID="${id}"
                                           Version="2.0"
                                           IssueInstant="${timestamp}"
                                           Destination="${config.entryPoint}">
      <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${config.issuer}</saml:Issuer>
    </samlp:AuthnRequest>`;

    return Buffer.from(samlRequest).toString('base64');
  }
}

module.exports = new SAMLService();