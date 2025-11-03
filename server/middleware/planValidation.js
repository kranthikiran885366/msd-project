const jwt = require('jsonwebtoken');
const Plan = require('../models/Plan');

// Map of plan names to rate limits
const RATE_LIMITS = {
  free: { requestsPerSecond: 1, burstLimit: 5 },
  hobby: { requestsPerSecond: 5, burstLimit: 10 },
  pro: { requestsPerSecond: 20, burstLimit: 50 },
  business: { requestsPerSecond: 50, burstLimit: 100 },
  enterprise: { requestsPerSecond: 100, burstLimit: 200 },
};

// Map of plan names to feature flags
const PLAN_FEATURES = {
  free: {
    maxProjects: 1,
    maxTeamMembers: 1,
    customDomains: false,
    ssoEnabled: false,
    advancedSecurity: false,
  },
  hobby: {
    maxProjects: 3,
    maxTeamMembers: 2,
    customDomains: true,
    ssoEnabled: false,
    advancedSecurity: false,
  },
  pro: {
    maxProjects: 10,
    maxTeamMembers: 5,
    customDomains: true,
    ssoEnabled: false,
    advancedSecurity: true,
  },
  business: {
    maxProjects: 25,
    maxTeamMembers: 15,
    customDomains: true,
    ssoEnabled: true,
    advancedSecurity: true,
  },
  enterprise: {
    maxProjects: -1, // unlimited
    maxTeamMembers: -1, // unlimited
    customDomains: true,
    ssoEnabled: true,
    advancedSecurity: true,
  },
};

// Middleware to check plan limits and permissions
const planValidation = {
  // Validate the user's plan allows access to a feature
  validateFeature: (feature) => {
    return async (req, res, next) => {
      try {
        const subscription = await req.user.getSubscription();
        const plan = await Plan.findById(subscription.plan);
        
        const features = PLAN_FEATURES[plan.name] || PLAN_FEATURES.free;
        if (!features[feature]) {
          return res.status(403).json({
            error: 'Feature not available',
            message: `The ${feature} feature requires a higher plan level.`,
            requiredPlan: Object.keys(PLAN_FEATURES).find(p => PLAN_FEATURES[p][feature]),
          });
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  },

  // Validate the user hasn't exceeded their plan limits
  validateLimit: (limitType) => {
    return async (req, res, next) => {
      try {
        const subscription = await req.user.getSubscription();
        const plan = await Plan.findById(subscription.plan);
        const currentUsage = await subscription.checkUsage();
        
        switch (limitType) {
          case 'projects':
            if (plan.limits.projects !== -1 && currentUsage.projects >= plan.limits.projects) {
              return res.status(403).json({
                error: 'Project limit reached',
                message: `Your plan allows up to ${plan.limits.projects} projects.`,
                current: currentUsage.projects,
                limit: plan.limits.projects,
              });
            }
            break;

          case 'teamMembers':
            if (plan.limits.teamMembers !== -1 && currentUsage.teamMembers >= plan.limits.teamMembers) {
              return res.status(403).json({
                error: 'Team member limit reached',
                message: `Your plan allows up to ${plan.limits.teamMembers} team members.`,
                current: currentUsage.teamMembers,
                limit: plan.limits.teamMembers,
              });
            }
            break;

          case 'storage':
            if (currentUsage.storage.used >= plan.limits.storage.gb) {
              return res.status(403).json({
                error: 'Storage limit reached',
                message: `You have reached your storage limit of ${plan.limits.storage.gb}GB.`,
                current: currentUsage.storage.used,
                limit: plan.limits.storage.gb,
              });
            }
            break;

          case 'bandwidth':
            if (currentUsage.bandwidth.used >= plan.limits.bandwidth.gb) {
              return res.status(403).json({
                error: 'Bandwidth limit reached',
                message: `You have reached your bandwidth limit of ${plan.limits.bandwidth.gb}GB.`,
                current: currentUsage.bandwidth.used,
                limit: plan.limits.bandwidth.gb,
              });
            }
            break;

          case 'functions':
            if (currentUsage.functions.used >= plan.limits.functions.executionTime) {
              return res.status(403).json({
                error: 'Function execution limit reached',
                message: `You have reached your function execution limit.`,
                current: currentUsage.functions.used,
                limit: plan.limits.functions.executionTime,
              });
            }
            break;
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  },

  // Generate a token with rate limiting info
  generateApiToken: async (userId, planName) => {
    const limits = RATE_LIMITS[planName] || RATE_LIMITS.free;
    return jwt.sign(
      {
        userId,
        plan: planName,
        rateLimit: limits.requestsPerSecond,
        burstLimit: limits.burstLimit,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  // Validate a plan change is allowed
  validatePlanChange: async (req, res, next) => {
    try {
      const { newPlanId } = req.body;
      const subscription = await req.user.getSubscription();
      const currentPlan = await Plan.findById(subscription.plan);
      const newPlan = await Plan.findById(newPlanId);

      // Check if downgrade is allowed
      if (newPlan.price.amount < currentPlan.price.amount) {
        const currentUsage = await subscription.checkUsage();
        
        // Check if new plan limits can accommodate current usage
        if (currentUsage.projects > PLAN_FEATURES[newPlan.name].maxProjects) {
          return res.status(400).json({
            error: 'Invalid plan change',
            message: 'You must reduce your number of projects before downgrading.',
            current: currentUsage.projects,
            allowed: PLAN_FEATURES[newPlan.name].maxProjects,
          });
        }

        if (currentUsage.teamMembers > PLAN_FEATURES[newPlan.name].maxTeamMembers) {
          return res.status(400).json({
            error: 'Invalid plan change',
            message: 'You must reduce your team size before downgrading.',
            current: currentUsage.teamMembers,
            allowed: PLAN_FEATURES[newPlan.name].maxTeamMembers,
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = planValidation;