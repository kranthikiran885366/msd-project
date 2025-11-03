/**
 * Audit Logger Middleware
 * Automatically logs API requests for compliance tracking
 */

const ComplianceAuditService = require('../services/compliance/auditService');

class AuditLoggerMiddleware {
  constructor() {
    this.auditService = new ComplianceAuditService();
    this.sensitiveRoutes = [
      '/api/auth',
      '/api/users',
      '/api/projects',
      '/api/deployments',
      '/api/billing',
      '/api/settings',
      '/api/team',
      '/api/api-tokens'
    ];
  }

  /**
   * Middleware to log API requests for audit trail
   */
  logRequest() {
    return async (req, res, next) => {
      // Skip logging for non-sensitive routes
      const isSensitive = this.sensitiveRoutes.some(route => 
        req.path.startsWith(route)
      );

      if (!isSensitive) {
        return next();
      }

      // Store original res.json to capture response
      const originalJson = res.json;
      let responseData = null;

      res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Store original res.end to capture when response is sent
      const originalEnd = res.end;
      res.end = async function(...args) {
        try {
          // Only log if user is authenticated
          if (req.user) {
            const action = `${req.method.toLowerCase()}_${req.path.replace(/\/api\//, '').replace(/\//g, '_')}`;
            const resourceType = req.path.split('/')[2] || 'unknown';
            const resourceId = req.params.id || req.params.userId || req.params.projectId || null;

            // Prepare changes object
            const changes = {
              method: req.method,
              path: req.path,
              query: req.query,
              statusCode: res.statusCode
            };

            // Include request body for POST/PUT/PATCH (excluding sensitive data)
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
              changes.requestBody = this._sanitizeRequestBody(req.body);
            }

            // Include response data for successful operations (excluding sensitive data)
            if (res.statusCode < 400 && responseData) {
              changes.responseData = this._sanitizeResponseData(responseData);
            }

            // Log the audit event
            await this.auditService.logAuditEvent(
              req.user.id,
              action,
              resourceType,
              resourceId,
              changes,
              req.ip,
              req.get('User-Agent')
            );
          }
        } catch (error) {
          console.error('Audit logging error:', error);
          // Don't fail the request if audit logging fails
        }

        return originalEnd.apply(this, args);
      }.bind(this);

      next();
    };
  }

  /**
   * Remove sensitive data from request body
   */
  _sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password', 'passwordHash', 'token', 'secret', 'key', 
      'apiKey', 'accessToken', 'refreshToken', 'privateKey',
      'creditCard', 'ssn', 'socialSecurityNumber'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Remove sensitive data from response
   */
  _sanitizeResponseData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    
    // Remove sensitive fields from response
    const sensitiveFields = [
      'passwordHash', 'token', 'secret', 'privateKey',
      'accessToken', 'refreshToken', 'apiKey'
    ];

    const removeSensitiveData = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => removeSensitiveData(item));
      } else if (obj && typeof obj === 'object') {
        const cleaned = { ...obj };
        sensitiveFields.forEach(field => {
          if (cleaned[field]) {
            cleaned[field] = '[REDACTED]';
          }
        });
        
        // Recursively clean nested objects
        Object.keys(cleaned).forEach(key => {
          if (typeof cleaned[key] === 'object') {
            cleaned[key] = removeSensitiveData(cleaned[key]);
          }
        });
        
        return cleaned;
      }
      return obj;
    };

    return removeSensitiveData(sanitized);
  }

  /**
   * Log authentication events
   */
  logAuthEvent() {
    return async (req, res, next) => {
      const originalJson = res.json;
      
      res.json = async function(data) {
        try {
          if (req.path.includes('/auth/') || req.path.includes('/login') || req.path.includes('/signup')) {
            const action = req.path.includes('/login') ? 'user_login' : 
                          req.path.includes('/signup') ? 'user_signup' : 
                          req.path.includes('/logout') ? 'user_logout' : 'auth_action';

            const userId = req.user?.id || (data?.user?.id) || null;
            
            if (userId) {
              await this.auditService.logAuditEvent(
                userId,
                action,
                'authentication',
                userId,
                {
                  success: res.statusCode < 400,
                  statusCode: res.statusCode,
                  userAgent: req.get('User-Agent')
                },
                req.ip,
                req.get('User-Agent')
              );
            }
          }
        } catch (error) {
          console.error('Auth audit logging error:', error);
        }

        return originalJson.call(this, data);
      }.bind(this);

      next();
    }.bind(this);
  }
}

module.exports = new AuditLoggerMiddleware();