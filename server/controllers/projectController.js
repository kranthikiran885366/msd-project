// Project Controller
const projectService = require("../services/projectService")

class ProjectController {
  async createProject(req, res, next) {
    try {
      const project = await projectService.createProject(req.user.userId, req.body)
      res.status(201).json(project)
    } catch (error) {
      next(error)
    }
  }

  async getProjects(req, res, next) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      const { overview } = req.query
      if (overview === 'true') {
        const data = await projectService.getProjectsOverview(req.user.userId)
        if (!data) {
          return res.status(404).json({
            error: "No projects found",
            code: "PROJECTS_NOT_FOUND"
          });
        }
        res.json(data)
      } else {
        const projects = await projectService.getProjects(req.user.userId)
        if (!projects) {
          return res.status(404).json({
            error: "No projects found",
            code: "PROJECTS_NOT_FOUND"
          });
        }
        res.json(projects)
      }
    } catch (error) {
      console.error('Project controller error:', error);
      res.status(500).json({
        error: "Failed to fetch projects",
        code: "INTERNAL_SERVER_ERROR",
        details: error.message
      });
    }
  }

  async getProjectById(req, res, next) {
    try {
      const { id } = req.params
      const project = await projectService.getProjectById(id)
      if (!project) {
        return res.status(404).json({ error: "Project not found" })
      }
      res.json(project)
    } catch (error) {
      next(error)
    }
  }

  async updateProject(req, res, next) {
    try {
      const { id } = req.params
      const project = await projectService.updateProject(id, req.body)
      res.json(project)
    } catch (error) {
      next(error)
    }
  }

  async deleteProject(req, res, next) {
    try {
      const { id } = req.params
      await projectService.deleteProject(id)
      res.json({ message: "Project deleted successfully" })
    } catch (error) {
      next(error)
    }
  }

  async getProjectStats(req, res, next) {
    try {
      const { id } = req.params
      const stats = await projectService.getProjectStats(id)
      res.json(stats)
    } catch (error) {
      next(error)
    }
  }

  async getProjectHealth(req, res, next) {
    try {
      const { id } = req.params
      const health = await projectService.getProjectHealth(id)
      res.json(health)
    } catch (error) {
      next(error)
    }
  }

  async updateProjectSettings(req, res, next) {
    try {
      const { id } = req.params
      const settings = req.body
      const project = await projectService.updateProjectSettings(id, settings)
      res.json(project)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ProjectController()
