const winston = require('winston');
const moment = require('moment');

// Define log format with custom timestamp
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: () => moment().format('YYYY-MM-DD HH:mm:ss') // Custom format without timezone
    }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
    })
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5,
        })
    ]
});

// Add Morgan stream
logger.stream = {
    write: (message) => logger.info(message.trim())
};

module.exports = logger; 