// src/middleware/errorHandler.js
// Centralized error handler for Express

module.exports = (err, req, res, next) => {
  // status & message defaults
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // log server-side (always keep logs verbose)
  const logger = require('../utils/logger');
// then inside handler:
  logger.error({
     message: err.message,
    status,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    body: req.body,
  });


  // response payload
  const payload = {
    success: false,
    message,
  };

  // show stack/details only in non-production
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
    if (err.details) payload.details = err.details;
  }

  res.status(status).json(payload);
};
