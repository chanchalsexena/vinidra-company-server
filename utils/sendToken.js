// sendToken.js

const sendToken = (user, statusCode, res, next, message) => {
    const token = user.getJwtToken();
    const options = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    };
    res.cookie('token', token, options);
    res.status(statusCode).json({
        success: true,
        token,
        message
    });
    if (next) {
        next();
    }
};

export default sendToken;
