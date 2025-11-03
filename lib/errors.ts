export class APIError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status?: number,
    public readonly code?: string,
    message?: string
  ) {
    super(message || `API Error: ${endpoint}`);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(public readonly endpoint: string) {
    super(`Network error while fetching ${endpoint}`);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends APIError {
  constructor(endpoint: string) {
    super(endpoint, 401, 'UNAUTHENTICATED', 'Authentication required');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(endpoint: string) {
    super(endpoint, 403, 'UNAUTHORIZED', 'Not authorized to access this resource');
    this.name = 'AuthorizationError';
  }
}