const handleErrorResponse = (res, err, statusCode = 400) => {
  const errorMessage = err && err.message ? err.message : 'An unknown error occurred';
  
  return res.status(statusCode).json({
    success: false,
    message: errorMessage,
    data: null,
  });
};

module.exports = {
  handleErrorResponse,
};