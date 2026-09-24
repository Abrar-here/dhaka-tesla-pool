class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflict with current state") {
    super(message, 409);
  }
}

class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
};
