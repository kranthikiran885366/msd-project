const formService = require("../services/formService")
const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })

class FormController {
  async listForms(req, res, next) {
    try {
      const { projectId } = req.params
      const forms = await formService.getForms(projectId)
      res.json(forms)
    } catch (error) {
      next(error)
    }
  }

  async createForm(req, res, next) {
    try {
      const form = await formService.createForm({
        ...req.body,
        projectId: req.params.projectId,
      })
      res.status(201).json(form)
    } catch (error) {
      next(error)
    }
  }

  async updateForm(req, res, next) {
    try {
      const { id } = req.params
      const form = await formService.updateForm(id, req.body)
      res.json(form)
    } catch (error) {
      next(error)
    }
  }

  async deleteForm(req, res, next) {
    try {
      const { id } = req.params
      await formService.deleteForm(id)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const { formId } = req.params
      const { startDate, endDate } = req.query
      
      const query = {}
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        }
      }

      const submissions = await formService.getSubmissions(formId, query)
      res.json(submissions)
    } catch (error) {
      next(error)
    }
  }

  async handleSubmission(req, res, next) {
    try {
      const { formId } = req.params
      const metadata = {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        referer: req.headers.referer,
      }

      const submission = await formService.handleSubmission(
        formId,
        req.body,
        req.files,
        metadata
      )

      res.status(201).json(submission)
    } catch (error) {
      next(error)
    }
  }

  async exportSubmissions(req, res, next) {
    try {
      const { formId } = req.params
      const { format = "csv" } = req.query
      
      const data = await formService.exportSubmissions(formId, format)
      
      res.setHeader("Content-Type", format === "csv" ? "text/csv" : "application/json")
      res.setHeader("Content-Disposition", `attachment; filename=submissions.${format}`)
      res.send(data)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new FormController()