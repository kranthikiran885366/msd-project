/**
 * Cost Optimization Service
 * Provides cost analysis, recommendations, and optimization strategies
 */

const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const logger = require('../utils/logger');

class CostOptimizationService {
  /**
   * Get cost optimization recommendations for a user
   */
  async getRecommendations(userId) {
    try {
      const subscription = await Subscription.findOne({ userId })
        .populate('plan')
        .lean();

      if (!subscription) {
        return [];
      }

      const recommendations = [];
      const currentPlan = subscription.plan;

      // Analyze usage patterns
      const usage = await this._analyzeUsagePatterns(subscription);

      // Recommendation 1: Check for underutilized resources
      if (usage.utilizationRate < 30) {
        recommendations.push({
          id: 'downgrade-plan',
          title: 'Consider Downgrading Your Plan',
          description: 'Your resource utilization is below 30%. You might be able to save money with a lower-tier plan.',
          estimatedSavings: this._calculateDowngradeSavings(currentPlan),
          priority: 'medium',
          action: 'downgrade_plan',
          applicable: true,
        });
      }

      // Recommendation 2: Reserved capacity savings
      if (usage.spikesDetected) {
        recommendations.push({
          id: 'reserved-capacity',
          title: 'Utilize Reserved Capacity',
          description: 'Our data shows you have predictable usage patterns. Reserved capacity could save you 20-30%.',
          estimatedSavings: this._calculateReservedSavings(currentPlan),
          priority: 'high',
          action: 'upgrade_to_reserved',
          applicable: true,
        });
      }

      // Recommendation 3: Unused services
      if (usage.unusedServices.length > 0) {
        recommendations.push({
          id: 'cleanup-services',
          title: 'Remove Unused Services',
          description: `You have ${usage.unusedServices.length} unused service(s) that you're paying for.`,
          estimatedSavings: usage.unusedServicesCost,
          priority: 'high',
          action: 'cleanup_services',
          services: usage.unusedServices,
          applicable: true,
        });
      }

      // Recommendation 4: Storage optimization
      if (usage.storageUsage > 80) {
        recommendations.push({
          id: 'storage-cleanup',
          title: 'Optimize Storage Usage',
          description: 'Your storage usage is very high. Archiving old data could reduce costs.',
          estimatedSavings: this._calculateStorageSavings(usage.storageUsage),
          priority: 'medium',
          action: 'archive_storage',
          applicable: true,
        });
      }

      // Recommendation 5: Bandwidth optimization
      if (usage.bandwidthCost > currentPlan.price.amount * 0.3) {
        recommendations.push({
          id: 'bandwidth-optimization',
          title: 'Optimize Bandwidth Usage',
          description: 'Bandwidth costs are high relative to your plan. Consider CDN optimization or compression.',
          estimatedSavings: usage.bandwidthCost * 0.15,
          priority: 'medium',
          action: 'optimize_bandwidth',
          applicable: true,
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Error getting recommendations', { error: error.message });
      return [];
    }
  }

  /**
   * Get detailed cost breakdown
   */
  async getCostBreakdown(userId) {
    try {
      const subscription = await Subscription.findOne({ userId })
        .populate('plan')
        .lean();

      if (!subscription) {
        return null;
      }

      const currentCycle = subscription.billing_cycles[subscription.billing_cycles.length - 1];

      return {
        period: {
          start: currentCycle.startDate,
          end: currentCycle.endDate,
        },
        costs: {
          basePlan: {
            amount: currentCycle.costs.basePlan,
            percentage: this._calculatePercentage(currentCycle.costs.basePlan, currentCycle.costs.total),
          },
          overages: {
            bandwidth: {
              amount: currentCycle.costs.overages.bandwidth,
              percentage: this._calculatePercentage(currentCycle.costs.overages.bandwidth, currentCycle.costs.total),
            },
            functions: {
              amount: currentCycle.costs.overages.functions,
              percentage: this._calculatePercentage(currentCycle.costs.overages.functions, currentCycle.costs.total),
            },
            storage: {
              amount: currentCycle.costs.overages.storage,
              percentage: this._calculatePercentage(currentCycle.costs.overages.storage, currentCycle.costs.total),
            },
            deployments: {
              amount: currentCycle.costs.overages.deployments,
              percentage: this._calculatePercentage(currentCycle.costs.overages.deployments, currentCycle.costs.total),
            },
            total: {
              amount: currentCycle.costs.overages.total,
              percentage: this._calculatePercentage(currentCycle.costs.overages.total, currentCycle.costs.total),
            },
          },
          addons: currentCycle.costs.addons.map(addon => ({
            name: addon.name,
            amount: addon.cost,
            percentage: this._calculatePercentage(addon.cost, currentCycle.costs.total),
          })),
          total: currentCycle.costs.total,
        },
        usage: {
          bandwidth: currentCycle.usage.bandwidth.total,
          functions: currentCycle.usage.functions.totalMs,
          storage: currentCycle.usage.storage.total,
          deployments: currentCycle.usage.deployments.length,
        },
      };
    } catch (error) {
      logger.error('Error getting cost breakdown', { error: error.message });
      return null;
    }
  }

  /**
   * Get cost projections for the next periods
   */
  async getCostProjections(userId) {
    try {
      const subscription = await Subscription.findOne({ userId })
        .populate('plan')
        .lean();

      if (!subscription) {
        return null;
      }

      const currentCycle = subscription.billing_cycles[subscription.billing_cycles.length - 1];
      const historicalCycles = subscription.billing_cycles.slice(-12); // Last 12 cycles

      // Calculate average costs
      const averageCost = historicalCycles.reduce((sum, cycle) => sum + cycle.costs.total, 0) / historicalCycles.length;
      const averageOverages = historicalCycles.reduce((sum, cycle) => sum + cycle.costs.overages.total, 0) / historicalCycles.length;

      // Calculate trend (increasing, stable, decreasing)
      const trend = this._calculateTrend(historicalCycles);

      // Project future costs
      const projections = [];
      for (let i = 1; i <= 6; i++) {
        const projectedCost = this._projectCost(averageCost, trend, i);
        projections.push({
          month: i,
          projectedCost,
          baseCost: subscription.plan.price.amount,
          projectedOverages: projectedCost - subscription.plan.price.amount,
          confidence: Math.max(0.6, 1 - i * 0.05), // Confidence decreases with time
        });
      }

      return {
        currentCost: currentCycle.costs.total,
        averageCost,
        averageOverages,
        trend,
        projections,
      };
    } catch (error) {
      logger.error('Error getting cost projections', { error: error.message });
      return null;
    }
  }

  /**
   * Apply a cost optimization recommendation
   */
  async applyRecommendation(recommendationId, userId) {
    try {
      const subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      switch (recommendationId) {
        case 'downgrade-plan':
          return await this._applyDowngrade(subscription);

        case 'cleanup-services':
          return await this._cleanupServices(subscription);

        case 'storage-cleanup':
          return await this._archiveStorage(subscription);

        case 'bandwidth-optimization':
          return await this._optimizeBandwidth(subscription);

        case 'reserved-capacity':
          return await this._upgradeToReserved(subscription);

        default:
          throw new Error('Unknown recommendation');
      }
    } catch (error) {
      logger.error('Error applying recommendation', { error: error.message });
      throw error;
    }
  }

  // ==================== Private Helper Methods ====================

  async _analyzeUsagePatterns(subscription) {
    const cycles = subscription.billing_cycles.slice(-6); // Last 6 cycles
    
    let totalUsage = 0;
    let totalCapacity = 0;
    const usageValues = [];

    cycles.forEach(cycle => {
      const usage = cycle.usage.bandwidth.total + cycle.usage.functions.totalMs + cycle.usage.storage.total;
      usageValues.push(usage);
      totalUsage += usage;
    });

    const utilizationRate = (totalUsage / (cycles.length * 1000)) * 100; // Simplified calculation
    const spikesDetected = this._detectSpikes(usageValues);

    return {
      utilizationRate,
      spikesDetected,
      unusedServices: [],
      unusedServicesCost: 0,
      storageUsage: this._calculateStoragePercentage(subscription),
      bandwidthCost: cycles[cycles.length - 1].usage.bandwidth.total,
    };
  }

  _calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  _calculateDowngradeSavings(plan) {
    return plan.price.amount * 0.3; // Estimate 30% savings
  }

  _calculateReservedSavings(plan) {
    return plan.price.amount * 0.25; // Estimate 25% savings
  }

  _calculateStorageSavings(storageUsage) {
    return storageUsage > 80 ? 50 : 0; // Estimate $50 savings
  }

  _detectSpikes(values) {
    if (values.length < 2) return false;
    const average = values.reduce((a, b) => a + b) / values.length;
    const maxSpike = Math.max(...values);
    return maxSpike > average * 1.5;
  }

  _calculateStoragePercentage(subscription) {
    const lastCycle = subscription.billing_cycles[subscription.billing_cycles.length - 1];
    return Math.min(100, (lastCycle.usage.storage.total / 1000) * 100); // Simplified
  }

  _calculateTrend(cycles) {
    if (cycles.length < 2) return 'stable';
    const recent = cycles.slice(-3);
    const older = cycles.slice(-6, -3);
    const recentAvg = recent.reduce((s, c) => s + c.costs.total, 0) / recent.length;
    const olderAvg = older.reduce((s, c) => s + c.costs.total, 0) / older.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  _projectCost(averageCost, trend, months) {
    let projected = averageCost;
    const trendFactor = trend === 'increasing' ? 1.05 : trend === 'decreasing' ? 0.95 : 1;
    return Math.round(projected * Math.pow(trendFactor, months));
  }

  async _applyDowngrade(subscription) {
    logger.info('Applying downgrade recommendation', { userId: subscription.userId });
    return { message: 'Downgrade plan scheduled', status: 'pending' };
  }

  async _cleanupServices(subscription) {
    logger.info('Cleaning up services', { userId: subscription.userId });
    return { message: 'Services cleanup scheduled', status: 'pending' };
  }

  async _archiveStorage(subscription) {
    logger.info('Archiving storage', { userId: subscription.userId });
    return { message: 'Storage archival scheduled', status: 'pending' };
  }

  async _optimizeBandwidth(subscription) {
    logger.info('Optimizing bandwidth', { userId: subscription.userId });
    return { message: 'Bandwidth optimization scheduled', status: 'pending' };
  }

  async _upgradeToReserved(subscription) {
    logger.info('Upgrading to reserved capacity', { userId: subscription.userId });
    return { message: 'Reserved capacity upgrade scheduled', status: 'pending' };
  }
}

module.exports = new CostOptimizationService();
