// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  if (!err.isOperational) {
    // Unexpected/programmer errors get logged with full detail server-side
    // but we never leak stack traces to the client.
    console.error("[unexpected error]", err);
  }
  res.status(statusCode).json({
    error: {
      message: err.isOperational ? err.message : "Internal server error",
    },
  });
}

module.exports = { errorHandler };
