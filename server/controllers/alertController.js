const Alert = require('../models/Alert');
const Deployment = require('../models/Deployment');

class AlertController {
  async getAlerts(req, res, next) {
    try {
      const { projectId } = req.params;
      const alerts = await Alert.find({ projectId })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
      
      res.json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }

  async createAlert(req, res, next) {
    try {
      const { projectId } = req.params;
      const { name, metric, operator, threshold, duration, severity, notificationChannels, enabled } = req.body;
      
      const alert = new Alert({
        projectId,
        name,
        metricType: metric,
        operator: operator === '>' ? 'gt' : operator === '<' ? 'lt' : operator === '>=' ? 'gte' : operator === '<=' ? 'lte' : operator === 'equals' ? 'eq' : 'ne',
        threshold,
        message: `${name} alert triggered`,
        channels: notificationChannels,
        active: enabled,
        createdBy: req.user.id
      });

      await alert.save();
      res.status(201).json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  async updateAlert(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const alert = await Alert.findByIdAndUpdate(id, updates, { new: true });
      if (!alert) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
      }
      
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }

  async deleteAlert(req, res, next) {
    try {
      const { id } = req.params;
      
      const alert = await Alert.findByIdAndDelete(id);
      if (!alert) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
      }
      
      res.json({ success: true, message: 'Alert deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleAlert(req, res, next) {
    try {
      const { id } = req.params;
      
      const alert = await Alert.findById(id);
      if (!alert) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
      }
      
      alert.active = !alert.active;
      await alert.save();
      
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlertController();