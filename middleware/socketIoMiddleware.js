const socketIoMiddleware = (io) => (req, res, next) => {
    req.io = io; // Attach io to the request object
    next();
};

module.exports = socketIoMiddleware;
