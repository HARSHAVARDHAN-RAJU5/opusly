// src/middleware/errorHandler.js
// Centralized error handler for express
module.exports = (err, req, res, next) => {
  // If a route passed an error object with status, use it; otherwise 500
  const status = err.status || err.statusCode || 500;

  // Friendly error shape for the client
  const payload = {
    message: err.message || 'Internal Server Error',
  };

  // Only include stack trace in non-production for debugging
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
    // optionally include additional details if provided
    if (err.details) payload.details = err.details;
  }

  // Log the error server-side for debugging/alerts
  // Use console.error so logs show with severity — replace with your logger if you have one
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    status,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    body: req.body,
  });

  res.status(status).json(payload);
};
