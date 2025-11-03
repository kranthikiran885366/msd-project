const { Session } = require('../models');
const { Op } = require('sequelize');

class SessionService {
  async createSession(userId, req) {
    try {
      const session = await Session.create({
        userId,
        token: req.sessionID,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours
      });

      // Cleanup old sessions
      await this.cleanupExpiredSessions();

      return session;
    } catch (error) {
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  async validateSession(token) {
    try {
      const session = await Session.findOne({
        where: {
          token,
          isRevoked: false,
          expiresAt: {
            [Op.gt]: new Date()
          }
        }
      });

      if (session) {
        // Update last activity
        await session.update({
          lastActivity: new Date()
        });
        return session;
      }

      return null;
    } catch (error) {
      throw new Error(`Session validation failed: ${error.message}`);
    }
  }

  async revokeSession(sessionId) {
    try {
      const session = await Session.findByPk(sessionId);
      if (session) {
        await session.update({
          isRevoked: true
        });
        return true;
      }
      return false;
    } catch (error) {
      throw new Error(`Session revocation failed: ${error.message}`);
    }
  }

  async revokeAllUserSessions(userId) {
    try {
      await Session.update(
        { isRevoked: true },
        {
          where: {
            userId,
            isRevoked: false
          }
        }
      );
      return true;
    } catch (error) {
      throw new Error(`Session revocation failed: ${error.message}`);
    }
  }

  async getUserSessions(userId) {
    try {
      const sessions = await Session.findAll({
        where: {
          userId,
          isRevoked: false,
          expiresAt: {
            [Op.gt]: new Date()
          }
        },
        order: [['lastActivity', 'DESC']]
      });

      return sessions.map(session => ({
        id: session.id,
        ip: session.ip,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt
      }));
    } catch (error) {
      throw new Error(`Session retrieval failed: ${error.message}`);
    }
  }

  async cleanupExpiredSessions() {
    try {
      await Session.destroy({
        where: {
          [Op.or]: [
            {
              expiresAt: {
                [Op.lt]: new Date()
              }
            },
            {
              lastActivity: {
                [Op.lt]: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) // 7 days
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
  }

  async extendSession(sessionId) {
    try {
      const session = await Session.findOne({
        where: {
          id: sessionId,
          isRevoked: false,
          expiresAt: {
            [Op.gt]: new Date()
          }
        }
      });

      if (session) {
        await session.update({
          expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // Extend by 24 hours
          lastActivity: new Date()
        });
        return true;
      }

      return false;
    } catch (error) {
      throw new Error(`Session extension failed: ${error.message}`);
    }
  }

  async getSessionInfo(sessionId) {
    try {
      const session = await Session.findByPk(sessionId);
      if (!session) throw new Error('Session not found');

      return {
        id: session.id,
        userId: session.userId,
        ip: session.ip,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        isRevoked: session.isRevoked
      };
    } catch (error) {
      throw new Error(`Session info retrieval failed: ${error.message}`);
    }
  }

  async getActiveSessionCount(userId) {
    try {
      const count = await Session.count({
        where: {
          userId,
          isRevoked: false,
          expiresAt: {
            [Op.gt]: new Date()
          }
        }
      });

      return count;
    } catch (error) {
      throw new Error(`Session count failed: ${error.message}`);
    }
  }
}

module.exports = new SessionService();