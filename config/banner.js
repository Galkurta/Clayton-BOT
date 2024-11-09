const figlet = require("figlet");

const color = {
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function displayBanner() {
  const banner = figlet.textSync("Clayton BOT", {
    font: "Standard",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 80,
  });

  console.log(`${color.cyan}${banner}${color.reset}`);
  console.log(
    `${color.cyan}===============================================${color.reset}`
  );
  console.log(
    `${color.cyan}GitHub  : https://github.com/Galkurta${color.reset}`
  );
  console.log(
    `${color.cyan}Telegram: https://t.me/galkurtarchive${color.reset}`
  );
  console.log(
    `${color.cyan}===============================================\n${color.reset}`
  );
}

module.exports = displayBanner;
