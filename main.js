const fs = require("fs");
const path = require("path");
const axios = require("axios");
const readline = require("readline");
const { DateTime } = require("luxon");
const printBanner = require("./config/banner.js");
const logger = require("./config/logger.js");

class Clayton {
  constructor() {
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
    this.baseUrl = "https://tonclayton.fun/api";
  }

  // Helper Methods
  async makeRequest(endpoint, method = "post", data = {}, initData = "") {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint}`;
    const headers = { ...this.headers, "Init-Data": initData };
    try {
      const response = await axios({ method, url, data, headers });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    logger.info("");
  }

  // Authentication Methods
  async login(initData) {
    return this.makeRequest("/user/auth", "post", {}, initData);
  }

  // Farming Methods
  async dailyClaim(initData) {
    return this.makeRequest("/user/daily-claim", "post", {}, initData);
  }

  // Task Methods
  async getTaskList(taskType, initData) {
    return this.makeRequest(`/tasks/${taskType}-tasks`, "get", {}, initData);
  }

  async completeTask(initData, taskId) {
    return this.makeRequest(
      "/tasks/complete",
      "post",
      { task_id: taskId },
      initData
    );
  }

  async claimTaskReward(initData, taskId) {
    return this.makeRequest(
      "/tasks/claim",
      "post",
      { task_id: taskId },
      initData
    );
  }

  async handleTasks(taskType, initData) {
    logger.info(`Checking ${taskType} tasks`);
    const tasksResult = await this.getTaskList(taskType, initData);
    if (tasksResult.success) {
      const uncompletedTasks = tasksResult.data.filter(
        (task) => !task.is_completed && !task.is_claimed
      );
      for (const task of uncompletedTasks) {
        logger.info(`Performing ${taskType} task | ${task.task.title}`);
        const completeResult = await this.completeTask(initData, task.task_id);
        if (completeResult.success) {
          const rewardResult = await this.claimTaskReward(
            initData,
            task.task_id
          );
          if (rewardResult.success) {
            logger.info(
              `Successfully completed ${taskType} task | ${task.task.title} | Received ${rewardResult.data.reward_tokens} CL`
            );
          } else {
            logger.error(
              `Unable to claim reward for ${taskType} task | ${
                task.task.title
              } | ${rewardResult.error || "Unknown error"}`
            );
          }
        } else {
          logger.error(
            `Unable to complete ${taskType} task | ${task.task.title} | ${
              completeResult.error || "Unknown error"
            }`
          );
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 5000 + 2000)
        );
      }
    } else {
      logger.error(
        `Unable to get ${taskType} task list | ${
          tasksResult.error || "Unknown error"
        }`
      );
    }
  }

  async handleAllTasks(initData) {
    const taskTypes = ["default", "partner", "daily", "super"];
    for (const taskType of taskTypes) {
      await this.handleTasks(taskType, initData);
    }
    await this.handleTwitterTask(initData);
    await this.handleBotTask(initData);
  }

  async handleTwitterTask(initData) {
    logger.info("Checking Twitter task");
    const checkResult = await this.makeRequest(
      "/user/task-twitter",
      "post",
      {},
      initData
    );
    if (checkResult.success && !checkResult.data.claimed) {
      const claimResult = await this.makeRequest(
        "/user/task-twitter-claim",
        "post",
        {},
        initData
      );
      if (
        claimResult.success &&
        claimResult.data.message === "Task status updated"
      ) {
        logger.info("Successfully completed Twitter task");
      } else {
        logger.error("Unable to complete Twitter task");
      }
    }
  }

  async handleBotTask(initData) {
    logger.info("Checking bot usage task");
    const checkResult = await this.makeRequest(
      "/user/task-bot",
      "post",
      {},
      initData
    );
    if (
      checkResult.success &&
      checkResult.data.bot &&
      !checkResult.data.claim
    ) {
      const claimResult = await this.makeRequest(
        "/user/task-bot-claim",
        "post",
        {},
        initData
      );
      if (claimResult.success && claimResult.data.claimed) {
        logger.info(
          `Successfully completed bot usage task | Received ${claimResult.data.claimed} CL`
        );
      } else {
        logger.error("Unable to complete bot usage task");
      }
    }
  }

  // Game Methods
  async play2048(initData) {
    logger.info("Starting 2048 game");
    const startGameResult = await this.makeRequest(
      "/game/start",
      "post",
      {},
      initData
    );
    if (
      startGameResult.success &&
      startGameResult.data.message === "Game started successfully"
    ) {
      logger.info("2048 game started successfully");
      const fixedMilestones = [4, 8, 16, 32, 64, 128, 256, 512, 1024];
      const allMilestones = [...fixedMilestones].sort((a, b) => a - b);
      const gameEndTime = Date.now() + 150000;

      for (const milestone of allMilestones) {
        if (Date.now() >= gameEndTime) break;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 10000 + 5000)
        );
        const saveGameResult = await this.makeRequest(
          "/game/save-tile",
          "post",
          { maxTile: milestone },
          initData
        );
        if (
          saveGameResult.success &&
          saveGameResult.data.message === "MaxTile saved successfully"
        ) {
          logger.info(`Reached tile ${milestone}`);
        }
      }

      const endGameResult = await this.makeRequest(
        "/game/over",
        "post",
        { multiplier: 1 },
        initData
      );
      if (endGameResult.success) {
        const reward = endGameResult.data;
        logger.info(
          `2048 game ended successfully | Received ${reward.earn} CL | ${reward.xp_earned} XP`
        );
      } else {
        logger.error(
          `Error ending 2048 game | ${endGameResult.error || "Unknown error"}`
        );
      }
    } else {
      logger.error("Unable to start 2048 game");
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  async playStack(initData) {
    logger.info("Starting Stack game");
    const startGameResult = await this.makeRequest(
      "/stack/start-game",
      "post",
      {},
      initData
    );
    if (startGameResult.success) {
      logger.info("Stack game started successfully");
      const gameEndTime = Date.now() + 120000;
      const scores = [10, 20, 30, 40, 50, 60, 70, 80, 90];
      let currentScoreIndex = 0;

      while (Date.now() < gameEndTime && currentScoreIndex < scores.length) {
        const score = scores[currentScoreIndex];
        const updateResult = await this.makeRequest(
          "/stack/update-game",
          "post",
          { score },
          initData
        );
        if (updateResult.success) {
          logger.info(`Updated Stack score: ${score}`);
          currentScoreIndex++;
        } else {
          logger.error(
            `Error updating Stack score: ${
              updateResult.error || "Unknown error"
            }`
          );
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 10000 + 5000)
        );
      }

      const finalScore = scores[currentScoreIndex - 1] || 90;
      const endGameResult = await this.makeRequest(
        "/stack/end-game",
        "post",
        { score: finalScore, multiplier: 1 },
        initData
      );
      if (endGameResult.success) {
        const reward = endGameResult.data;
        logger.info(
          `Stack game ended successfully | Received ${reward.earn} CL | ${reward.xp_earned} XP`
        );
      } else {
        logger.error(
          `Error ending Stack game: ${endGameResult.error || "Unknown error"}`
        );
      }
    } else {
      logger.error("Unable to start Stack game");
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  async playGames(initData) {
    while (true) {
      const loginResult = await this.login(initData);
      if (!loginResult.success) {
        logger.error("Unable to check tickets");
        return;
      }

      const tickets = loginResult.data.user.daily_attempts;
      if (tickets <= 0) {
        logger.info("No more tickets. Stopping game play.");
        return;
      }

      logger.info(`Current tickets: ${tickets}`);

      if (tickets >= 2) {
        await this.play2048(initData);
        if (tickets > 1) {
          await this.playStack(initData);
        }
      } else {
        await this.play2048(initData);
      }
    }
  }

  // Main Process
  async processAccount(initData, accountIndex) {
    const userData = JSON.parse(
      decodeURIComponent(initData.split("user=")[1].split("&")[0])
    );
    const firstName = userData.first_name;

    logger.info(`Account ${accountIndex + 1} | ${firstName}`);
    logger.info(`Logging into account`);

    const loginResult = await this.login(initData);
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
      const claimResult = await this.dailyClaim(initData);
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
    await this.handleAllTasks(initData);

    // Games
    if (userInfo.daily_attempts > 0) {
      await this.playGames(initData);
    } else {
      logger.info(`No tickets left to play games`);
    }
  }

  async main() {
    printBanner();

    while (true) {
      const dataFile = path.join(__dirname, "data.txt");
      const data = fs
        .readFileSync(dataFile, "utf8")
        .replace(/\r/g, "")
        .split("\n")
        .filter(Boolean);

      for (let i = 0; i < data.length; i++) {
        const initData = data[i];
        await this.processAccount(initData, i);
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
