const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Not Found: ${req.originalUrl}`,
        data: null
    });
};

const serverError = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
        data: null
    });
};

module.exports = {
    notFound,
    serverError
};
