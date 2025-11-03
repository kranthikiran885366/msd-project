const Metric = require('../models/Metric');

class MetricsController {
  async getMetrics(req, res, next) {
    try {
      const { projectId } = req.params;
      const metrics = await Metric.find({ projectId })
        .sort({ timestamp: -1 });
      
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  async createMetric(req, res, next) {
    try {
      const { projectId } = req.params;
      const { name, description, type, unit, aggregation, enabled } = req.body;
      
      const metric = new Metric({
        projectId,
        metricType: name.toLowerCase().replace(/\s+/g, '_'),
        resourceType: 'custom',
        value: 0,
        unit,
        tags: new Map([
          ['name', name],
          ['description', description],
          ['type', type],
          ['aggregation', aggregation],
          ['enabled', enabled.toString()]
        ])
      });

      await metric.save();
      res.status(201).json({ success: true, data: metric });
    } catch (error) {
      next(error);
    }
  }

  async updateMetric(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const metric = await Metric.findByIdAndUpdate(id, updates, { new: true });
      if (!metric) {
        return res.status(404).json({ success: false, error: 'Metric not found' });
      }
      
      res.json({ success: true, data: metric });
    } catch (error) {
      next(error);
    }
  }

  async deleteMetric(req, res, next) {
    try {
      const { id } = req.params;
      
      const metric = await Metric.findByIdAndDelete(id);
      if (!metric) {
        return res.status(404).json({ success: false, error: 'Metric not found' });
      }
      
      res.json({ success: true, message: 'Metric deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleMetric(req, res, next) {
    try {
      const { id } = req.params;
      
      const metric = await Metric.findById(id);
      if (!metric) {
        return res.status(404).json({ success: false, error: 'Metric not found' });
      }
      
      const currentEnabled = metric.tags.get('enabled') === 'true';
      metric.tags.set('enabled', (!currentEnabled).toString());
      await metric.save();
      
      res.json({ success: true, data: metric });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MetricsController();