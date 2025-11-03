const ldap = require('ldapjs');
const { User, Team } = require('../models');
const { auditLog } = require('../middleware/auditLogger');
const bcrypt = require('bcrypt');

class LDAPService {
  constructor() {
    this.client = null;
    this.config = {
      url: process.env.LDAP_URL || 'ldap://localhost:389',
      bindDN: process.env.LDAP_BIND_DN,
      bindPassword: process.env.LDAP_BIND_PASSWORD,
      baseDN: process.env.LDAP_BASE_DN,
      userSearchBase: process.env.LDAP_USER_SEARCH_BASE,
      groupSearchBase: process.env.LDAP_GROUP_SEARCH_BASE,
      userFilter: process.env.LDAP_USER_FILTER || '(sAMAccountName={{username}})',
      groupFilter: process.env.LDAP_GROUP_FILTER || '(member={{dn}})',
      attributes: {
        user: ['sAMAccountName', 'mail', 'givenName', 'sn', 'department', 'title', 'memberOf'],
        group: ['cn', 'description', 'member']
      }
    };
    this.syncInterval = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.client = ldap.createClient({
        url: this.config.url,
        timeout: 5000,
        connectTimeout: 10000,
        reconnect: true
      });

      this.client.on('connect', () => {
        console.log('LDAP client connected');
        resolve();
      });

      this.client.on('error', (err) => {
        console.error('LDAP connection error:', err);
        reject(err);
      });
    });
  }

  async bind() {
    return new Promise((resolve, reject) => {
      this.client.bind(this.config.bindDN, this.config.bindPassword, (err) => {
        if (err) {
          reject(new Error(`LDAP bind failed: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async authenticate(username, password) {
    try {
      await this.connect();
      await this.bind();

      // Search for user
      const user = await this.searchUser(username);
      if (!user) {
        throw new Error('User not found in LDAP');
      }

      // Authenticate user
      const isValid = await this.validatePassword(user.dn, password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Get user groups
      const groups = await this.getUserGroups(user.dn);

      return {
        username: user.sAMAccountName,
        email: user.mail,
        firstName: user.givenName,
        lastName: user.sn,
        department: user.department,
        title: user.title,
        groups: groups,
        dn: user.dn
      };
    } catch (error) {
      throw new Error(`LDAP authentication failed: ${error.message}`);
    } finally {
      if (this.client) {
        this.client.unbind();
      }
    }
  }

  async searchUser(username) {
    return new Promise((resolve, reject) => {
      const filter = this.config.userFilter.replace('{{username}}', username);
      const opts = {
        filter: filter,
        scope: 'sub',
        attributes: this.config.attributes.user
      };

      this.client.search(this.config.userSearchBase, opts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        let user = null;
        res.on('searchEntry', (entry) => {
          user = entry.object;
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(user);
        });
      });
    });
  }

  async validatePassword(userDN, password) {
    return new Promise((resolve) => {
      const testClient = ldap.createClient({ url: this.config.url });
      
      testClient.bind(userDN, password, (err) => {
        testClient.unbind();
        resolve(!err);
      });
    });
  }

  async getUserGroups(userDN) {
    return new Promise((resolve, reject) => {
      const filter = this.config.groupFilter.replace('{{dn}}', userDN);
      const opts = {
        filter: filter,
        scope: 'sub',
        attributes: this.config.attributes.group
      };

      const groups = [];
      this.client.search(this.config.groupSearchBase, opts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res.on('searchEntry', (entry) => {
          groups.push({
            name: entry.object.cn,
            description: entry.object.description,
            dn: entry.object.dn
          });
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(groups);
        });
      });
    });
  }

  async syncUsers() {
    try {
      await this.connect();
      await this.bind();

      console.log('Starting LDAP user sync...');
      const users = await this.getAllUsers();
      
      for (const ldapUser of users) {
        await this.syncUser(ldapUser);
      }

      console.log(`Synced ${users.length} users from LDAP`);
    } catch (error) {
      console.error('LDAP sync failed:', error);
    } finally {
      if (this.client) {
        this.client.unbind();
      }
    }
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      const opts = {
        filter: '(objectClass=user)',
        scope: 'sub',
        attributes: this.config.attributes.user
      };

      const users = [];
      this.client.search(this.config.userSearchBase, opts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res.on('searchEntry', (entry) => {
          users.push(entry.object);
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(users);
        });
      });
    });
  }

  async syncUser(ldapUser) {
    try {
      let user = await User.findOne({ 
        where: { email: ldapUser.mail } 
      });

      const userData = {
        email: ldapUser.mail,
        firstName: ldapUser.givenName,
        lastName: ldapUser.sn,
        department: ldapUser.department,
        title: ldapUser.title,
        authProvider: 'ldap',
        ldapDN: ldapUser.dn,
        isVerified: true
      };

      if (!user) {
        user = await User.create(userData);
      } else {
        await user.update(userData);
      }

      // Sync group memberships
      const groups = await this.getUserGroups(ldapUser.dn);
      await this.syncUserGroups(user, groups);

      return user;
    } catch (error) {
      console.error(`Failed to sync user ${ldapUser.mail}:`, error);
    }
  }

  async syncUserGroups(user, ldapGroups) {
    const groupMappings = {
      'Domain Admins': 'admin',
      'Developers': 'developer',
      'DevOps Engineers': 'devops',
      'Project Managers': 'manager'
    };

    for (const ldapGroup of ldapGroups) {
      const role = groupMappings[ldapGroup.name] || 'member';
      
      let team = await Team.findOne({ 
        where: { name: ldapGroup.name } 
      });

      if (!team) {
        team = await Team.create({
          name: ldapGroup.name,
          description: ldapGroup.description || `Synced from LDAP: ${ldapGroup.name}`,
          ldapDN: ldapGroup.dn,
          syncSource: 'ldap'
        });
      }

      // Add user to team if not already member
      const membership = await team.getMembers({ where: { id: user.id } });
      if (membership.length === 0) {
        await team.addMember(user, { through: { role } });
      }
    }
  }

  async processLogin(ldapData, req) {
    try {
      let user = await User.findOne({ 
        where: { email: ldapData.email } 
      });

      if (!user) {
        user = await User.create({
          email: ldapData.email,
          firstName: ldapData.firstName,
          lastName: ldapData.lastName,
          department: ldapData.department,
          title: ldapData.title,
          authProvider: 'ldap',
          ldapDN: ldapData.dn,
          isVerified: true,
          lastLogin: new Date()
        });
      } else {
        await user.update({
          department: ldapData.department,
          title: ldapData.title,
          lastLogin: new Date()
        });
      }

      // Sync groups on login
      await this.syncUserGroups(user, ldapData.groups);

      // Audit log
      await auditLog(req, 'LDAP_LOGIN', {
        userId: user.id,
        groups: ldapData.groups.map(g => g.name)
      });

      return user;
    } catch (error) {
      throw new Error(`LDAP login processing failed: ${error.message}`);
    }
  }

  startAutoSync() {
    // Sync every 6 hours
    this.syncInterval = setInterval(() => {
      this.syncUsers();
    }, 6 * 60 * 60 * 1000);

    console.log('LDAP auto-sync started (every 6 hours)');
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('LDAP auto-sync stopped');
    }
  }
}

module.exports = new LDAPService();