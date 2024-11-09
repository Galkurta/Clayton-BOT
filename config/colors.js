const colors = {
  // Basic colors
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  // Foreground (text) colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // Bright foreground colors
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",

  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",

  // Bright background colors
  bgBrightRed: "\x1b[101m",
  bgBrightGreen: "\x1b[102m",
  bgBrightYellow: "\x1b[103m",
  bgBrightBlue: "\x1b[104m",
  bgBrightMagenta: "\x1b[105m",
  bgBrightCyan: "\x1b[106m",
  bgBrightWhite: "\x1b[107m",

  // Logging level colors
  error: "\x1b[31m", // Red
  warn: "\x1b[33m", // Yellow
  info: "\x1b[36m", // Cyan
  debug: "\x1b[37m", // White
  timestamp: "\x1b[32m", // Green
  success: "\x1b[92m", // Bright Green

  // Banner colors
  bannerText: "\x1b[36m", // Cyan
  bannerBorder: "\x1b[36m", // Cyan
  bannerLinks: "\x1b[36m", // Cyan

  // Game status colors
  gameProgress: "\x1b[96m", // Bright Cyan
  gameSuccess: "\x1b[92m", // Bright Green
  gameError: "\x1b[91m", // Bright Red
  gameWarning: "\x1b[93m", // Bright Yellow

  // Reward colors
  rewardValue: "\x1b[93m", // Bright Yellow
  rewardLabel: "\x1b[36m", // Cyan
};

module.exports = colors;
