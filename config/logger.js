const winston = require("winston");
const colors = require("./colors");

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${colors.timestamp}${timestamp}${colors.reset} | ${
      colors[level]
    }${level.toUpperCase()}${colors.reset} | ${message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: customFormat,
  transports: [new winston.transports.Console()],
});

module.exports = logger;
