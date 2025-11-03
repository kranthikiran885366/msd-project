const Api = require("../models/Api")
const fetch = require("node-fetch")

class ApiService {
  async getApisByProject(projectId) {
    return await Api.find({ projectId })
  }

  async createApi(apiData) {
    const api = new Api(apiData)
    return await api.save()
  }

  async updateApi(id, updates) {
    return await Api.findByIdAndUpdate(id, updates, { new: true })
  }

  async deleteApi(id) {
    return await Api.findByIdAndDelete(id)
  }

  async testEndpoint(url, method, headers = {}, body = null) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      }
    } catch (error) {
      throw new Error(`API test failed: ${error.message}`)
    }
  }

  async generateApiDocs(id) {
    const api = await Api.findById(id)
    if (!api) throw new Error("API not found")

    const docs = {
      openapi: "3.0.0",
      info: {
        title: api.name,
        description: api.description,
        version: api.version || "1.0.0",
      },
      servers: [
        {
          url: api.baseUrl,
          description: "API base URL",
        },
      ],
      paths: {},
    }

    // Generate OpenAPI specification
    api.endpoints.forEach((endpoint) => {
      if (!docs.paths[endpoint.path]) {
        docs.paths[endpoint.path] = {}
      }

      docs.paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        parameters: endpoint.parameters,
        responses: endpoint.responses.reduce((acc, response) => {
          acc[response.code] = {
            description: response.description,
            content: {
              "application/json": {
                schema: response.schema,
              },
            },
          }
          return acc
        }, {}),
        security: endpoint.security,
      }
    })

    return docs
  }
}

module.exports = new ApiService()