// ErrorHandler.js

class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;

        Error.captureStackTrace(this, this.constructor);
    }
}

const handleError = (err, res) => {
    const { statusCode, message } = err;
    res.status(statusCode || 500).json({
        success: false,
        message: message || 'Internal Server Error',
    });
};

export { ErrorHandler, handleError };
