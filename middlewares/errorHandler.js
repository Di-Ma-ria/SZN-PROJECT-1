export const errorHandler = (err, req, res, next) => {
  
  console.error(`[${req.method} ${req.originalUrl}]`, err.message);


  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

//mongoose validation error

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      errors:  Object.values(err.errors).map(e => e.message),
    });
  }
//mongoose bad objectedId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field: ${err.path}`,
    });
  }

  // mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Multer file errors (wrong format, too large)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // JWT errors (malformed token — expired is handled in authMiddleware)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }

  // Everything else
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    
    message: status === 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message || 'Server Error',
  });
};