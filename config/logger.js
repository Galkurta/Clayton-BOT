const winston = require("winston");

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    const color = {
      error: "\x1b[31m",
      warn: "\x1b[33m",
      info: "\x1b[36m",
      debug: "\x1b[37m",
      reset: "\x1b[0m",
    };
    return `${timestamp} | ${color[level]}${level.toUpperCase()}${
      color.reset
    } | ${message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: customFormat,
  transports: [new winston.transports.Console()],
});

module.exports = logger;
