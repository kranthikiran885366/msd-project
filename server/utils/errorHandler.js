// Error Handler Utilities
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400)
    this.name = "ValidationError"
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404)
    this.name = "NotFoundError"
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401)
    this.name = "UnauthorizedError"
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access forbidden") {
    super(message, 403)
    this.name = "ForbiddenError"
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409)
    this.name = "ConflictError"
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500)
    this.name = "InternalServerError"
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
}
