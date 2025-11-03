const ldap = require('ldapjs');
const crypto = require('crypto');
const { AuditLog } = require('../../models/AuditLog');
const { User } = require('../../models/User');
const { Team } = require('../../models/Team');

class LDAPService {
  constructor() {
    this.connections = new Map();
    this.config = {
      url: process.env.LDAP_URL || 'ldap://localhost:389',
      bindDN: process.env.LDAP_BIND_DN,
      bindPassword: process.env.LDAP_BIND_PASSWORD,
      searchBase: process.env.LDAP_SEARCH_BASE || 'dc=example,dc=com',
      searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
      timeout: 5000,
      connectTimeout: 10000
    };
  }

  async configureLDAP(teamId, config) {
    try {
      const ldapConfig = {
        url: config.url,
        bindDN: config.bindDN,
        bindPassword: config.bindPassword,
        searchBase: config.searchBase,
        searchFilter: config.searchFilter || '(uid={{username}})',
        userAttributes: config.userAttributes || ['uid', 'cn', 'mail', 'memberOf'],
        groupSearchBase: config.groupSearchBase,
        groupSearchFilter: config.groupSearchFilter || '(member={{userDN}})',
        enabled: true
      };

      // Test LDAP connection
      await this.testConnection(ldapConfig);

      // Store encrypted LDAP configuration
      await this.storeLDAPConfig(teamId, ldapConfig);

      await AuditLog.create({
        teamId,
        action: 'ldap_configured',
        details: { url: config.url, searchBase: config.searchBase },
        timestamp: new Date()
      });

      return { success: true, message: 'LDAP configured successfully' };
    } catch (error) {
      throw new Error(`LDAP configuration failed: ${error.message}`);
    }
  }

  async testConnection(config) {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: config.url,
        timeout: this.config.timeout,
        connectTimeout: this.config.connectTimeout
      });

      client.bind(config.bindDN, config.bindPassword, (err) => {
        if (err) {
          client.destroy();
          return reject(new Error(`LDAP bind failed: ${err.message}`));
        }

        client.search(config.searchBase, {
          scope: 'sub',
          filter: '(objectClass=*)',
          sizeLimit: 1
        }, (searchErr, res) => {
          if (searchErr) {
            client.destroy();
            return reject(new Error(`LDAP search failed: ${searchErr.message}`));
          }

          let found = false;
          res.on('searchEntry', () => { found = true; });
          res.on('end', () => {
            client.destroy();
            if (found) {
              resolve(true);
            } else {
              reject(new Error('LDAP search returned no results'));
            }
          });
          res.on('error', (resErr) => {
            client.destroy();
            reject(new Error(`LDAP search error: ${resErr.message}`));
          });
        });
      });

      client.on('error', (connErr) => {
        reject(new Error(`LDAP connection error: ${connErr.message}`));
      });
    });
  }

  async storeLDAPConfig(teamId, config) {
    const encryptedConfig = this.encryptConfig(config);
    
    await Team.update(
      { 
        ldapConfig: {
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
    const key = crypto.scryptSync(process.env.LDAP_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  async authenticateUser(teamId, username, password) {
    try {
      const team = await Team.findByPk(teamId);
      if (!team?.ldapConfig?.enabled) {
        throw new Error('LDAP not configured for team');
      }

      const config = await this.decryptConfig(team.ldapConfig.config);
      const userDN = await this.findUserDN(config, username);
      
      if (!userDN) {
        throw new Error('User not found in LDAP');
      }

      // Authenticate user
      await this.bindUser(config.url, userDN, password);

      // Get user attributes
      const userAttributes = await this.getUserAttributes(config, userDN);
      
      // Create or update user
      const user = await this.createOrUpdateLDAPUser(teamId, userAttributes);

      await AuditLog.create({
        teamId,
        userId: user.id,
        action: 'ldap_login_success',
        details: { username, userDN },
        timestamp: new Date()
      });

      return user;
    } catch (error) {
      await AuditLog.create({
        teamId,
        action: 'ldap_login_failed',
        details: { username, error: error.message },
        timestamp: new Date()
      });
      throw error;
    }
  }

  async findUserDN(config, username) {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({ url: config.url });
      
      client.bind(config.bindDN, config.bindPassword, (bindErr) => {
        if (bindErr) {
          client.destroy();
          return reject(bindErr);
        }

        const searchFilter = config.searchFilter.replace('{{username}}', username);
        
        client.search(config.searchBase, {
          scope: 'sub',
          filter: searchFilter,
          attributes: ['dn']
        }, (searchErr, res) => {
          if (searchErr) {
            client.destroy();
            return reject(searchErr);
          }

          let userDN = null;
          res.on('searchEntry', (entry) => {
            userDN = entry.dn.toString();
          });

          res.on('end', () => {
            client.destroy();
            resolve(userDN);
          });

          res.on('error', (resErr) => {
            client.destroy();
            reject(resErr);
          });
        });
      });
    });
  }

  async bindUser(url, userDN, password) {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({ url });
      
      client.bind(userDN, password, (err) => {
        client.destroy();
        if (err) {
          reject(new Error('Invalid credentials'));
        } else {
          resolve(true);
        }
      });
    });
  }

  async getUserAttributes(config, userDN) {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({ url: config.url });
      
      client.bind(config.bindDN, config.bindPassword, (bindErr) => {
        if (bindErr) {
          client.destroy();
          return reject(bindErr);
        }

        client.search(userDN, {
          scope: 'base',
          attributes: config.userAttributes
        }, (searchErr, res) => {
          if (searchErr) {
            client.destroy();
            return reject(searchErr);
          }

          let attributes = {};
          res.on('searchEntry', (entry) => {
            entry.attributes.forEach(attr => {
              attributes[attr.type] = attr.vals;
            });
          });

          res.on('end', () => {
            client.destroy();
            resolve(attributes);
          });

          res.on('error', (resErr) => {
            client.destroy();
            reject(resErr);
          });
        });
      });
    });
  }

  async decryptConfig(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.LDAP_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  async createOrUpdateLDAPUser(teamId, attributes) {
    const email = attributes.mail?.[0];
    const displayName = attributes.cn?.[0] || attributes.displayName?.[0];
    const [firstName, ...lastNameParts] = (displayName || '').split(' ');
    const lastName = lastNameParts.join(' ') || 'User';

    if (!email) {
      throw new Error('User email not found in LDAP attributes');
    }

    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        email,
        firstName: firstName || 'User',
        lastName,
        authProvider: 'ldap',
        emailVerified: true,
        teamId,
        ldapDN: attributes.dn?.[0]
      }
    });

    // Update user info if exists
    if (user.firstName !== firstName || user.lastName !== lastName) {
      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        ldapDN: attributes.dn?.[0]
      });
    }

    return user;
  }

  async syncLDAPUsers(teamId) {
    try {
      const team = await Team.findByPk(teamId);
      if (!team?.ldapConfig?.enabled) {
        throw new Error('LDAP not configured');
      }

      const config = await this.decryptConfig(team.ldapConfig.config);
      const users = await this.getAllLDAPUsers(config);
      
      let syncedCount = 0;
      for (const userAttrs of users) {
        try {
          await this.createOrUpdateLDAPUser(teamId, userAttrs);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync user ${userAttrs.mail?.[0]}: ${error.message}`);
        }
      }

      await AuditLog.create({
        teamId,
        action: 'ldap_users_synced',
        details: { syncedCount, totalFound: users.length },
        timestamp: new Date()
      });

      return { syncedCount, totalFound: users.length };
    } catch (error) {
      throw new Error(`LDAP sync failed: ${error.message}`);
    }
  }

  async getAllLDAPUsers(config) {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({ url: config.url });
      const users = [];
      
      client.bind(config.bindDN, config.bindPassword, (bindErr) => {
        if (bindErr) {
          client.destroy();
          return reject(bindErr);
        }

        client.search(config.searchBase, {
          scope: 'sub',
          filter: '(objectClass=person)',
          attributes: config.userAttributes
        }, (searchErr, res) => {
          if (searchErr) {
            client.destroy();
            return reject(searchErr);
          }

          res.on('searchEntry', (entry) => {
            const attributes = {};
            entry.attributes.forEach(attr => {
              attributes[attr.type] = attr.vals;
            });
            users.push(attributes);
          });

          res.on('end', () => {
            client.destroy();
            resolve(users);
          });

          res.on('error', (resErr) => {
            client.destroy();
            reject(resErr);
          });
        });
      });
    });
  }
}

module.exports = new LDAPService();