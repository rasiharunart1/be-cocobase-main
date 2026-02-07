const handleErrorResponse = (res, error) => {
    console.error(error);

    if (error.isJoi) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            error: error.details.map(detail => detail.message).join(', ')
        });
    }

    if (error.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: 'Unique constraint failed',
            error: error.meta?.target
        });
    }

    if (error.code === 'P2025') {
        return res.status(404).json({
            success: false,
            message: 'Record not found',
            error: error.meta?.cause
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error.message
    });
};

module.exports = {
    handleErrorResponse
};
