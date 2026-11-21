function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.path}`);
  error.status = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || error.statusCode || 500;
  let message = error.message || 'Internal server error';
  if (error.name === 'ZodError') {
    status = 400;
    message = 'Validation failed';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'Uploaded file is too large';
  } else if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    status = 409;
    message = 'A record with that value already exists';
  } else if (error.code && error.code.startsWith('SQLITE_CONSTRAINT')) {
    status = 400;
    message = 'Request conflicts with stored data';
  }
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : message });
}

module.exports = { notFound, errorHandler };
