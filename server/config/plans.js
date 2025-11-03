const plans = {
  free: {
    name: 'Free',
    price: 0,
    stripeProductId: process.env.STRIPE_FREE_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_FREE_PRICE_ID,
    limits: {
      deployments: {
        perMonth: 100,
        overage: 0,
      },
      teamMembers: {
        count: 3,
        overage: 5,
      },
      bandwidth: {
        gb: 100,
        overage: 0.09, // $0.09 per GB
      },
      storage: {
        gb: 10,
        overage: 0.05, // $0.05 per GB
      },
      functions: {
        executionMinutes: 100,
        overage: 0.0001, // $0.0001 per minute
      },
      builds: {
        concurrent: 1,
        minutes: 300,
        overage: 0.008, // $0.008 per minute
      },
      apiRateLimit: {
        requestsPerSecond: 10,
        burstLimit: 25,
      },
      features: {
        customDomains: true,
        autoDeploy: true,
        buildCache: false,
        teamRoles: false,
        auditLog: false,
        sso: false,
        multiRegion: false,
        dedicatedBuild: false,
      }
    }
  },
  pro: {
    name: 'Pro',
    price: 20,
    stripeProductId: process.env.STRIPE_PRO_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: {
      deployments: {
        perMonth: 1000,
        overage: 0,
      },
      teamMembers: {
        count: 10,
        overage: 4,
      },
      bandwidth: {
        gb: 400,
        overage: 0.08,
      },
      storage: {
        gb: 50,
        overage: 0.04,
      },
      functions: {
        executionMinutes: 500,
        overage: 0.00008,
      },
      builds: {
        concurrent: 3,
        minutes: 1000,
        overage: 0.006,
      },
      apiRateLimit: {
        requestsPerSecond: 25,
        burstLimit: 50,
      },
      features: {
        customDomains: true,
        autoDeploy: true,
        buildCache: true,
        teamRoles: true,
        auditLog: true,
        sso: false,
        multiRegion: false,
        dedicatedBuild: false,
      }
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 100,
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    limits: {
      deployments: {
        perMonth: -1, // unlimited
        overage: 0,
      },
      teamMembers: {
        count: -1, // unlimited
        overage: 0,
      },
      bandwidth: {
        gb: 1000,
        overage: 0.07,
      },
      storage: {
        gb: 200,
        overage: 0.03,
      },
      functions: {
        executionMinutes: 2000,
        overage: 0.00005,
      },
      builds: {
        concurrent: 10,
        minutes: 5000,
        overage: 0.004,
      },
      apiRateLimit: {
        requestsPerSecond: 100,
        burstLimit: 200,
      },
      features: {
        customDomains: true,
        autoDeploy: true,
        buildCache: true,
        teamRoles: true,
        auditLog: true,
        sso: true,
        multiRegion: true,
        dedicatedBuild: true,
      }
    }
  }
}

module.exports = plans