export class MCPIsolateError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'MCPIsolateError'
  }
}

export class ValidationError extends MCPIsolateError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class WorkerError extends MCPIsolateError {
  constructor(message: string, details?: unknown) {
    super(message, 'WORKER_ERROR', 500, details)
    this.name = 'WorkerError'
  }
}

export class MCPConnectionError extends MCPIsolateError {
  constructor(message: string, details?: unknown) {
    super(message, 'MCP_CONNECTION_ERROR', 502, details)
    this.name = 'MCPConnectionError'
  }
}

export class SecurityError extends MCPIsolateError {
  constructor(message: string, details?: unknown) {
    super(message, 'SECURITY_ERROR', 403, details)
    this.name = 'SecurityError'
  }
}
