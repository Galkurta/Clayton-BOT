const fs = require("fs");
const path = require("path");
const axios = require("axios");
const readline = require("readline");
require("luxon");
const printBanner = require("./config/banner.js");
const logger = require("./config/logger.js");

class Clayton {
  constructor() {
    this.baseUrl = "https://tonclayton.fun";
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US;q=0.6,en;q=0.5",
      "Content-Type": "application/json",
      Origin: "https://tonclayton.fun",
      Referer: "https://tonclayton.fun/?tgWebAppStartParam=6944804952",
      "Sec-Ch-Ua":
        '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    };
  }

  // Helper Methods
  async readFileLines(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const lines = [];
    for await (const line of rl) {
      if (line.trim()) lines.push(line.trim());
    }
    return lines;
  }

  createApiClient(initData) {
    const axiosConfig = {
      baseURL: this.baseUrl,
      headers: {
        ...this.headers,
        "Init-Data": initData,
      },
    };
    return axios.create(axiosConfig);
  }

  async safeRequest(api, method, url, data = {}, retries = 5) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await api[method](url, data);
        return { success: true, data: response.data };
      } catch (error) {
        const statusCode = error.response?.status;
        if (attempt < retries - 1 && statusCode >= 500) {
          logger.warn(`Retrying request... Attempt ${attempt + 1}`);
          await this.wait(5000);
        } else {
          return { success: false, error: error.message };
        }
      }
    }
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async countdown(seconds) {
    for (let i = seconds; i >= 0; i--) {
      const hours = String(Math.floor(i / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((i % 3600) / 60)).padStart(2, "0");
      const secs = String(i % 60).padStart(2, "0");
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `Waiting ${hours}:${minutes}:${secs} to continue the loop`
      );
      await this.wait(1000);
    }
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    logger.info("");
  }

  // API Methods
  async login(api) {
    return this.safeRequest(api, "post", "/api/user/authorization");
  }

  async claimDailyReward(api) {
    return this.safeRequest(api, "post", "/api/user/daily-claim");
  }

  async getPartnerTasks(api) {
    return this.safeRequest(api, "get", "/api/tasks/partner-tasks");
  }

  async getDailyTasks(api) {
    return this.safeRequest(api, "get", "/api/tasks/daily-tasks");
  }

  async getOtherTasks(api) {
    return this.safeRequest(api, "get", "/api/tasks/default-tasks");
  }

  async completeTask(api, taskId) {
    return this.safeRequest(api, "post", `/api/tasks/complete`, {
      task_id: taskId,
    });
  }

  async claimTaskReward(api, taskId) {
    return this.safeRequest(api, "post", `/api/tasks/claim`, {
      task_id: taskId,
    });
  }

  // Game Methods
  async playGame(api, gameName) {
    await this.safeRequest(api, "post", "/api/game/start");
    return this.playGameWithProgress(api, gameName);
  }

  async playGameWithProgress(api, gameName) {
    const tileSequence = [2, 4, 8, 16, 32, 64, 128, 256];

    for (let i = 0; i < tileSequence.length; i++) {
      logger.info(`${gameName} game progress: ${i + 1}/${tileSequence.length}`);

      await this.wait(this.getRandomNumber(3000, 7000));
      const saveResult = await this.safeRequest(
        api,
        "post",
        "/api/game/save-tile",
        {
          maxTile: tileSequence[i],
        }
      );
      if (saveResult.success) {
        logger.info(`Tile saved: ${tileSequence[i]}`);
      } else {
        logger.error(`Failed to save tile: ${tileSequence[i]}`);
      }
    }

    logger.info(`${gameName} game finished!`);
    return this.safeRequest(api, "post", "/api/game/over", { multiplier: 1 });
  }

  // Task Methods
  async processTasks(api, taskGetter, taskType) {
    logger.info(`Fetching ${taskType} tasks...`);

    const tasksResult = await taskGetter(api);
    if (!tasksResult.success) {
      logger.error(`Failed to fetch ${taskType} | ${tasksResult.error}`);
      return;
    }

    const tasks = tasksResult.data;
    if (Array.isArray(tasks)) {
      for (const task of tasks) {
        const { is_completed, is_claimed, task_id, task: taskDetails } = task;

        if (task_id === 2) {
          continue;
        }

        if (!is_completed && !is_claimed) {
          logger.info(`Completing ${taskType} | ${taskDetails.title}`);
          const completeResult = await this.completeTask(api, task_id);
          if (completeResult.success) {
            logger.info(completeResult.data.message);
          } else {
            logger.error(`Failed to complete task: ${completeResult.error}`);
          }
        } else {
          logger.info(
            `${taskType} task already completed | ${taskDetails.title}`
          );
        }
      }

      const updatedTasksResult = await taskGetter(api);
      if (updatedTasksResult.success) {
        const updatedTasks = updatedTasksResult.data;
        for (const task of updatedTasks) {
          const { is_completed, is_claimed, task_id, task: taskDetails } = task;

          if (is_completed && !is_claimed) {
            logger.info(
              `Claiming reward for ${taskType} | ${taskDetails.title}`
            );
            const claimResult = await this.claimTaskReward(api, task_id);
            if (claimResult.success) {
              logger.info(claimResult.data.message);
              logger.info(`Reward received: ${claimResult.data.reward_tokens}`);
            } else {
              logger.error(`Failed to claim reward: ${claimResult.error}`);
            }
          }
        }
      } else {
        logger.error(
          `Failed to fetch updated ${taskType} | ${updatedTasksResult.error}`
        );
      }
    } else {
      logger.warn(`No ${taskType} tasks available`);
    }
  }

  // Account Processing
  async processAccount(initData, accountIndex) {
    const userData = JSON.parse(
      decodeURIComponent(initData.split("user=")[1].split("&")[0])
    );
    const firstName = userData.first_name;

    logger.info(`Account ${accountIndex + 1} | ${firstName}`);
    logger.info(`Logging into account`);

    const api = this.createApiClient(initData);
    const loginResult = await this.login(api);
    if (!loginResult.success) {
      logger.error(`Login failed! ${loginResult.error}`);
      return;
    }

    logger.info("Login successful!");
    const userInfo = loginResult.data.user;
    logger.info(`CL Balance: ${userInfo.tokens}`);
    logger.info(`Tickets: ${userInfo.daily_attempts}`);

    // Daily Claim
    if (loginResult.data.dailyReward.can_claim_today) {
      logger.info("Claiming daily reward");
      const claimResult = await this.claimDailyReward(api);
      if (
        claimResult.success &&
        claimResult.data.message === "daily reward claimed successfully"
      ) {
        logger.info("Daily check-in successful!");
      } else {
        logger.error(
          `Unable to claim daily reward: ${
            claimResult.error || "Unknown error"
          }`
        );
      }
    } else {
      logger.warn("You've already checked in today.");
    }

    // Tasks
    await this.processTasks(api, () => this.getPartnerTasks(api), "partner");
    await this.processTasks(api, () => this.getDailyTasks(api), "daily");
    await this.processTasks(api, () => this.getOtherTasks(api), "other");

    // Games
    if (userInfo.daily_attempts > 0) {
      for (let i = 1; i <= userInfo.daily_attempts; i++) {
        logger.info(`Playing game ${i} of ${userInfo.daily_attempts}`);
        const gameResult = await this.playGame(api, "1024");
        if (gameResult.success) {
          logger.info(`Game ${i} completed successfully`);
        } else {
          logger.error(`Failed to complete game ${i}: ${gameResult.error}`);
        }
      }
    } else {
      logger.info(`No tickets left to play games`);
    }
  }

  // Main Process
  async main() {
    printBanner();

    while (true) {
      const dataFile = path.join(__dirname, "data.txt");
      const data = await this.readFileLines(dataFile);

      for (let i = 0; i < data.length; i++) {
        const initData = data[i];
        await this.processAccount(initData, i);
        await this.wait(1000);
      }

      // Wait for 24 hours before starting the next cycle
      logger.info("Waiting 24 hours before starting the next cycle");
      await this.countdown(24 * 60 * 60);
    }
  }
}

// Run the script
const client = new Clayton();
client.main().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
