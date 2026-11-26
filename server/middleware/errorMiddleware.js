/**
 * A small error type for expected HTTP errors such as invalid input.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Turns unmatched URLs into a normal error handled by the global handler.
 */
export function notFound(req, _res, next) {
  next(new ApiError(404, 'Route not found.'));
}

/**
 * Converts application, database, and unexpected errors into JSON responses.
 */
export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'An unexpected server error occurred.';
  let details = error.details;

  if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON.';
    details = undefined;
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large.';
    details = undefined;
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'Cover image must be 5 MB or smaller.';
    details = undefined;
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Upload one cover image using the cover field.';
    details = undefined;
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with this value already exists.';
    details = undefined;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Please check the submitted information.';
    details = Object.values(error.errors).map(item => item.message);
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'A submitted value is invalid.';
    details = undefined;
  }

  if (statusCode >= 500) {
    console.error('[api] Internal request error:', error.name || 'Error');
    message = process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred.'
      : message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {})
  });
}
