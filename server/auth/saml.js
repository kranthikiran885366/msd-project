const saml = require('passport-saml');
const crypto = require('crypto');
const xml2js = require('xml2js');
const { User, Team } = require('../models');
const { auditLog } = require('../middleware/auditLogger');

class SAMLService {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // Okta Configuration
    this.providers.set('okta', {
      entryPoint: process.env.OKTA_SSO_URL,
      issuer: process.env.OKTA_ISSUER,
      cert: process.env.OKTA_CERT,
      callbackUrl: `${process.env.BASE_URL}/auth/saml/okta/callback`,
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
    });

    // Azure AD Configuration
    this.providers.set('azure', {
      entryPoint: process.env.AZURE_SSO_URL,
      issuer: process.env.AZURE_ISSUER,
      cert: process.env.AZURE_CERT,
      callbackUrl: `${process.env.BASE_URL}/auth/saml/azure/callback`,
      identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'
    });

    // Google Workspace Configuration
    this.providers.set('google', {
      entryPoint: process.env.GOOGLE_SSO_URL,
      issuer: process.env.GOOGLE_ISSUER,
      cert: process.env.GOOGLE_CERT,
      callbackUrl: `${process.env.BASE_URL}/auth/saml/google/callback`,
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
    });
  }

  async validateAssertion(assertion, provider) {
    try {
      const config = this.providers.get(provider);
      if (!config) throw new Error(`Unknown SAML provider: ${provider}`);

      // Parse SAML assertion
      const parser = new xml2js.Parser();
      const parsed = await parser.parseStringPromise(assertion);
      
      // Validate signature
      const isValid = this.validateSignature(assertion, config.cert);
      if (!isValid) throw new Error('Invalid SAML signature');

      // Extract user attributes
      const attributes = this.extractAttributes(parsed);
      
      return {
        nameID: attributes.nameID,
        email: attributes.email,
        firstName: attributes.firstName,
        lastName: attributes.lastName,
        groups: attributes.groups || [],
        department: attributes.department,
        title: attributes.title
      };
    } catch (error) {
      throw new Error(`SAML validation failed: ${error.message}`);
    }
  }

  validateSignature(assertion, cert) {
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(assertion);
      return verify.verify(cert, assertion, 'base64');
    } catch (error) {
      return false;
    }
  }

  extractAttributes(parsed) {
    const assertion = parsed['saml2:Assertion'] || parsed.Assertion;
    const attributeStatement = assertion.AttributeStatement[0];
    const attributes = {};

    attributeStatement.Attribute.forEach(attr => {
      const name = attr.$.Name;
      const value = attr.AttributeValue[0]._;
      
      switch (name) {
        case 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress':
          attributes.email = value;
          break;
        case 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname':
          attributes.firstName = value;
          break;
        case 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname':
          attributes.lastName = value;
          break;
        case 'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups':
          attributes.groups = Array.isArray(value) ? value : [value];
          break;
        case 'department':
          attributes.department = value;
          break;
        case 'title':
          attributes.title = value;
          break;
      }
    });

    attributes.nameID = assertion.Subject[0].NameID[0]._;
    return attributes;
  }

  async processLogin(samlData, provider, req) {
    try {
      let user = await User.findOne({ where: { email: samlData.email } });
      
      if (!user) {
        // Create new user from SAML data
        user = await User.create({
          email: samlData.email,
          firstName: samlData.firstName,
          lastName: samlData.lastName,
          authProvider: `saml_${provider}`,
          samlNameID: samlData.nameID,
          department: samlData.department,
          title: samlData.title,
          isVerified: true,
          lastLogin: new Date()
        });
      } else {
        // Update existing user
        await user.update({
          samlNameID: samlData.nameID,
          department: samlData.department,
          title: samlData.title,
          lastLogin: new Date()
        });
      }

      // Process group memberships
      await this.processGroupMemberships(user, samlData.groups, provider);

      // Audit log
      await auditLog(req, 'SAML_LOGIN', {
        userId: user.id,
        provider,
        groups: samlData.groups
      });

      return user;
    } catch (error) {
      throw new Error(`SAML login processing failed: ${error.message}`);
    }
  }

  async processGroupMemberships(user, groups, provider) {
    // Map SAML groups to internal teams/roles
    const groupMappings = {
      'Administrators': 'admin',
      'Developers': 'developer',
      'DevOps': 'devops',
      'Managers': 'manager'
    };

    for (const group of groups) {
      const role = groupMappings[group];
      if (role) {
        // Find or create team
        let team = await Team.findOne({ where: { name: group } });
        if (!team) {
          team = await Team.create({
            name: group,
            description: `Auto-created from SAML group: ${group}`,
            samlGroup: group,
            provider
          });
        }

        // Add user to team if not already member
        const membership = await team.getMembers({ where: { id: user.id } });
        if (membership.length === 0) {
          await team.addMember(user, { through: { role } });
        }
      }
    }
  }

  generateMetadata(provider) {
    const config = this.providers.get(provider);
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${process.env.BASE_URL}/auth/saml/${provider}/metadata">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true"
                      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${config.callbackUrl}"
                                 index="1" />
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }

  async revokeSession(nameID, provider) {
    try {
      const user = await User.findOne({ where: { samlNameID: nameID } });
      if (user) {
        // Invalidate all user sessions
        await user.update({ sessionToken: null });
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(`Session revocation failed: ${error.message}`);
    }
  }
}

module.exports = new SAMLService();