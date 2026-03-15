export default function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
  });
}
