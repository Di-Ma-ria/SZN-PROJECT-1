export const errorHandler = (err, req, res, next) => {
  // This will show in terminal
  console.error('=== ERROR ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('=============');

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
};