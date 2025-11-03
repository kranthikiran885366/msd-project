const EscalationPolicy = require('../models/EscalationPolicy');
const Team = require('../models/Team');

class EscalationService {
  async createEscalationPolicy(data) {
    const policy = new EscalationPolicy(data);
    await policy.save();
    return policy.populate(['createdBy']);
  }

  async getEscalationPolicies(projectId, filters = {}) {
    const query = { projectId, ...filters };
    return await EscalationPolicy.find(query)
      .populate(['createdBy'])
      .sort({ createdAt: -1 });
  }

  async getEscalationPolicyById(policyId) {
    return await EscalationPolicy.findById(policyId)
      .populate(['createdBy']);
  }

  async updateEscalationPolicy(policyId, updates) {
    return await EscalationPolicy.findByIdAndUpdate(
      policyId,
      updates,
      { new: true }
    ).populate(['createdBy']);
  }

  async deleteEscalationPolicy(policyId) {
    return await EscalationPolicy.findByIdAndDelete(policyId);
  }

  async toggleEscalationPolicy(policyId) {
    const policy = await EscalationPolicy.findById(policyId);
    if (!policy) throw new Error('Escalation policy not found');

    policy.enabled = !policy.enabled;
    await policy.save();
    return policy;
  }

  async addEscalationRule(policyId, rule) {
    const policy = await EscalationPolicy.findById(policyId);
    if (!policy) throw new Error('Escalation policy not found');

    // Set the level based on current rules count
    rule.level = policy.escalationRules.length + 1;
    policy.escalationRules.push(rule);
    
    await policy.save();
    return policy;
  }

  async updateEscalationRule(policyId, ruleIndex, updates) {
    const policy = await EscalationPolicy.findById(policyId);
    if (!policy) throw new Error('Escalation policy not found');

    if (ruleIndex >= policy.escalationRules.length) {
      throw new Error('Escalation rule not found');
    }

    Object.assign(policy.escalationRules[ruleIndex], updates);
    await policy.save();
    return policy;
  }

  async removeEscalationRule(policyId, ruleIndex) {
    const policy = await EscalationPolicy.findById(policyId);
    if (!policy) throw new Error('Escalation policy not found');

    if (ruleIndex >= policy.escalationRules.length) {
      throw new Error('Escalation rule not found');
    }

    policy.escalationRules.splice(ruleIndex, 1);
    
    // Reorder levels
    policy.escalationRules.forEach((rule, index) => {
      rule.level = index + 1;
    });

    await policy.save();
    return policy;
  }

  async getAvailableTeams(projectId) {
    return await Team.find({ projectId }).select('name members');
  }

  async validateEscalationPolicy(policyData) {
    const errors = [];

    if (!policyData.name) {
      errors.push('Policy name is required');
    }

    if (!policyData.escalationRules || policyData.escalationRules.length === 0) {
      errors.push('At least one escalation rule is required');
    }

    if (policyData.escalationRules) {
      policyData.escalationRules.forEach((rule, index) => {
        if (rule.delayMinutes < 0) {
          errors.push(`Rule ${index + 1}: Delay cannot be negative`);
        }

        if (!rule.assignedTo) {
          errors.push(`Rule ${index + 1}: Assigned to is required`);
        }

        if (rule.assignedTo === 'user' && !rule.userId) {
          errors.push(`Rule ${index + 1}: User ID is required when assigned to user`);
        }

        if (rule.assignedTo === 'team' && !rule.teamId) {
          errors.push(`Rule ${index + 1}: Team ID is required when assigned to team`);
        }

        if (!rule.notificationMethods || rule.notificationMethods.length === 0) {
          errors.push(`Rule ${index + 1}: At least one notification method is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async getEscalationStats(projectId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const policies = await EscalationPolicy.find({ projectId });
    
    const stats = {
      totalPolicies: policies.length,
      enabledPolicies: policies.filter(p => p.enabled).length,
      bySeverity: {
        critical: policies.filter(p => p.severity === 'critical').length,
        warning: policies.filter(p => p.severity === 'warning').length,
        info: policies.filter(p => p.severity === 'info').length
      },
      totalTriggers: policies.reduce((sum, p) => sum + (p.triggerCount || 0), 0),
      recentTriggers: policies.filter(p => 
        p.lastTriggered && p.lastTriggered >= startDate
      ).length
    };

    return stats;
  }

  async testEscalationPolicy(policyId, testData = {}) {
    const policy = await EscalationPolicy.findById(policyId);
    if (!policy) throw new Error('Escalation policy not found');

    const testResults = [];

    for (const rule of policy.escalationRules) {
      const result = {
        level: rule.level,
        delayMinutes: rule.delayMinutes,
        assignedTo: rule.assignedTo,
        contact: rule.contact,
        notificationMethods: rule.notificationMethods,
        status: 'success',
        message: 'Test notification would be sent'
      };

      // Validate rule configuration
      if (rule.assignedTo === 'user' && !rule.userId) {
        result.status = 'error';
        result.message = 'User ID not configured';
      } else if (rule.assignedTo === 'team' && !rule.teamId) {
        result.status = 'error';
        result.message = 'Team ID not configured';
      }

      testResults.push(result);
    }

    return {
      policyId,
      policyName: policy.name,
      testResults,
      overallStatus: testResults.every(r => r.status === 'success') ? 'success' : 'warning'
    };
  }
}

module.exports = new EscalationService();