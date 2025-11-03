const Incident = require('../models/Incident');
const EscalationPolicy = require('../models/EscalationPolicy');
const notificationService = require('./notificationService');

class IncidentService {
  async createIncident(data) {
    const incident = new Incident({
      ...data,
      timeline: [{
        timestamp: new Date(),
        event: 'Incident created',
        detail: data.detectedBy === 'manual' ? 'Incident created manually' : `Incident detected by ${data.detectedBy}`,
        userId: data.createdBy
      }]
    });

    await incident.save();

    // Trigger escalation if needed
    if (incident.severity === 'critical') {
      await this.triggerEscalation(incident);
    }

    return incident.populate(['assignee', 'createdBy']);
  }

  async getIncidents(projectId, filters = {}) {
    const query = { projectId, ...filters };
    return await Incident.find(query)
      .populate(['assignee', 'createdBy', 'resolvedBy'])
      .sort({ createdAt: -1 });
  }

  async getIncidentById(incidentId) {
    return await Incident.findById(incidentId)
      .populate(['assignee', 'createdBy', 'resolvedBy']);
  }

  async updateIncidentStatus(incidentId, status, userId) {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.status = status;
    incident.timeline.push({
      timestamp: new Date(),
      event: `Status changed to ${status}`,
      detail: `Status updated by user`,
      userId
    });

    if (status === 'acknowledged' && !incident.assignee) {
      incident.assignee = userId;
    }

    await incident.save();
    return incident.populate(['assignee', 'createdBy', 'resolvedBy']);
  }

  async resolveIncident(incidentId, resolution, userId) {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.status = 'resolved';
    incident.resolution = resolution;
    incident.resolvedAt = new Date();
    incident.resolvedBy = userId;
    incident.timeline.push({
      timestamp: new Date(),
      event: 'Incident resolved',
      detail: resolution,
      userId
    });

    await incident.save();
    return incident.populate(['assignee', 'createdBy', 'resolvedBy']);
  }

  async assignIncident(incidentId, assigneeId, userId) {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.assignee = assigneeId;
    incident.timeline.push({
      timestamp: new Date(),
      event: 'Incident assigned',
      detail: `Assigned to user`,
      userId
    });

    await incident.save();
    return incident.populate(['assignee', 'createdBy', 'resolvedBy']);
  }

  async addTimelineEntry(incidentId, event, detail, userId) {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.timeline.push({
      timestamp: new Date(),
      event,
      detail,
      userId
    });

    await incident.save();
    return incident;
  }

  async triggerEscalation(incident) {
    try {
      const policies = await EscalationPolicy.find({
        projectId: incident.projectId,
        severity: incident.severity,
        enabled: true
      });

      for (const policy of policies) {
        // Schedule escalation notifications based on policy rules
        for (const rule of policy.escalationRules) {
          setTimeout(async () => {
            await this.executeEscalationRule(incident, rule);
          }, rule.delayMinutes * 60 * 1000);
        }

        // Update policy stats
        policy.lastTriggered = new Date();
        policy.triggerCount += 1;
        await policy.save();
      }
    } catch (error) {
      console.error('Error triggering escalation:', error);
    }
  }

  async executeEscalationRule(incident, rule) {
    try {
      // Check if incident is still unresolved
      const currentIncident = await Incident.findById(incident._id);
      if (!currentIncident || currentIncident.status === 'resolved') {
        return;
      }

      // Send notifications based on rule configuration
      for (const method of rule.notificationMethods) {
        await notificationService.sendNotification({
          type: method,
          recipient: rule.contact || rule.userId,
          subject: `Incident Escalation - Level ${rule.level}`,
          message: `Incident "${incident.title}" has been escalated to level ${rule.level}`,
          data: {
            incidentId: incident._id,
            severity: incident.severity,
            component: incident.component
          }
        });
      }

      // Add timeline entry
      await this.addTimelineEntry(
        incident._id,
        `Escalated to Level ${rule.level}`,
        `Escalated to ${rule.assignedTo}`,
        null
      );
    } catch (error) {
      console.error('Error executing escalation rule:', error);
    }
  }

  async getIncidentStats(projectId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const incidents = await Incident.find({
      projectId,
      createdAt: { $gte: startDate }
    });

    const stats = {
      total: incidents.length,
      byStatus: {},
      bySeverity: {},
      averageResolutionTime: 0,
      resolvedCount: 0
    };

    let totalResolutionTime = 0;

    incidents.forEach(incident => {
      // Count by status
      stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;

      // Calculate resolution time
      if (incident.resolvedAt) {
        const resolutionTime = incident.resolvedAt - incident.createdAt;
        totalResolutionTime += resolutionTime;
        stats.resolvedCount++;
      }
    });

    if (stats.resolvedCount > 0) {
      stats.averageResolutionTime = Math.round(totalResolutionTime / stats.resolvedCount / (1000 * 60)); // minutes
    }

    return stats;
  }
}

module.exports = new IncidentService();