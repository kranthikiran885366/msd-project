const splitTestService = require("../services/splitTestService")

class SplitTestController {
  async listTests(req, res, next) {
    try {
      const { projectId } = req.params
      const tests = await splitTestService.getTests(projectId)
      res.json(tests)
    } catch (error) {
      next(error)
    }
  }

  async createTest(req, res, next) {
    try {
      const test = await splitTestService.createTest({
        ...req.body,
        projectId: req.params.projectId,
      })
      res.status(201).json(test)
    } catch (error) {
      next(error)
    }
  }

  async updateTest(req, res, next) {
    try {
      const { id } = req.params
      const test = await splitTestService.updateTest(id, req.body)
      res.json(test)
    } catch (error) {
      next(error)
    }
  }

  async deleteTest(req, res, next) {
    try {
      const { id } = req.params
      await splitTestService.deleteTest(id)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  async updateVariantWeight(req, res, next) {
    try {
      const { testId, variantName } = req.params
      const { weight } = req.body
      const test = await splitTestService.updateVariantWeight(testId, variantName, weight)
      res.json(test)
    } catch (error) {
      next(error)
    }
  }

  async getTestMetrics(req, res, next) {
    try {
      const { id } = req.params
      const metrics = await splitTestService.getTestMetrics(id)
      res.json(metrics)
    } catch (error) {
      next(error)
    }
  }

  async handleVisit(req, res, next) {
    try {
      const { testId } = req.params
      const { userId } = req.body
      const test = await splitTestService.getTestById(testId)
      
      if (!test) {
        return res.status(404).json({ error: "Test not found" })
      }

      const selectedVariant = splitTestService.selectVariant(test, userId)
      await splitTestService.recordVisit(testId, selectedVariant.name)

      res.json({
        variant: selectedVariant,
        redirectTo: selectedVariant.path,
      })
    } catch (error) {
      next(error)
    }
  }

  async recordConversion(req, res, next) {
    try {
      const { testId } = req.params
      const { variantName } = req.body
      await splitTestService.recordConversion(testId, variantName)
      res.status(200).end()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new SplitTestController()