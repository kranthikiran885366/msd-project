// Response Formatter Utilities
class ResponseFormatter {
  static success(data, message = "Success", statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
  }

  static error(message, statusCode = 400, errors = null) {
    return {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
    }
  }

  static paginated(data, total, page = 1, limit = 10) {
    const totalPages = Math.ceil(total / limit)
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
      timestamp: new Date().toISOString(),
    }
  }

  static listWithStats(items, stats) {
    return {
      success: true,
      data: items,
      stats,
      timestamp: new Date().toISOString(),
    }
  }
}

module.exports = ResponseFormatter
