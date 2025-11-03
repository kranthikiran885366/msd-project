const ApiService = require("../services/apiService")

class ApiController {
  async listApis(req, res, next) {
    try {
      const { projectId } = req.params
      const apis = await ApiService.getApisByProject(projectId)
      res.json(apis)
    } catch (error) {
      next(error)
    }
  }

  async createApi(req, res, next) {
    try {
      const { projectId } = req.params
      const apiData = { ...req.body, projectId }
      const api = await ApiService.createApi(apiData)
      res.status(201).json(api)
    } catch (error) {
      next(error)
    }
  }

  async updateApi(req, res, next) {
    try {
      const { id } = req.params
      const api = await ApiService.updateApi(id, req.body)
      res.json(api)
    } catch (error) {
      next(error)
    }
  }

  async deleteApi(req, res, next) {
    try {
      const { id } = req.params
      await ApiService.deleteApi(id)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  async testEndpoint(req, res, next) {
    try {
      const { url, method, headers, body } = req.body
      const response = await ApiService.testEndpoint(url, method, headers, body)
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  async generateApiDocs(req, res, next) {
    try {
      const { id } = req.params
      const docs = await ApiService.generateApiDocs(id)
      res.json(docs)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ApiController()