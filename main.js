const fs = require("fs");
const path = require("path");
const axios = require("axios");
const readline = require("readline");
require("luxon");
const printBanner = require("./config/banner.js");
const logger = require("./config/logger.js");
const colors = require("./config/colors");

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
        logger.error(`${colors.red}API Error: ${error.message}${colors.reset}`);
        logger.error(`${colors.red}Status Code: ${statusCode}${colors.reset}`);
        if (error.response?.data) {
          logger.error(
            `${colors.red}Response Data: ${JSON.stringify(
              error.response.data
            )}${colors.reset}`
          );
        }
        if (attempt < retries - 1 && statusCode >= 500) {
          logger.warn(
            `${colors.yellow}Retrying request... Attempt ${attempt + 1}${
              colors.reset
            }`
          );
          await this.wait(5000);
        } else {
          return {
            success: false,
            error: error.message,
            details: error.response?.data,
          };
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
        `${colors.yellow}Waiting ${hours}:${minutes}:${secs} to continue the loop${colors.reset}`
      );
      await this.wait(1000);
    }
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    logger.info("");
  }

  // API Methods
  async login(api) {
    return this.safeRequest(
      api,
      "post",
      "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/user/authorization"
    );
  }

  async claimDailyReward(api) {
    return this.safeRequest(
      api,
      "post",
      "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/user/daily-claim"
    );
  }

  async getPartnerTasks(api) {
    return this.safeRequest(
      api,
      "get",
      "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/tasks/partner-tasks"
    );
  }

  async getDailyTasks(api) {
    return this.safeRequest(
      api,
      "get",
      "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/tasks/daily-tasks"
    );
  }

  async getOtherTasks(api) {
    return this.safeRequest(
      api,
      "get",
      "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/tasks/default-tasks"
    );
  }

  async completeTask(api, taskId) {
    return this.safeRequest(
      api,
      "post",
      `/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/tasks/complete`,
      {
        task_id: taskId,
      }
    );
  }

  async claimTaskReward(api, taskId) {
    return this.safeRequest(
      api,
      "post",
      `/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/tasks/claim`,
      {
        task_id: taskId,
      }
    );
  }

  // Game 1024 Methods
  async playGame(api, gameName) {
    try {
      const startResult = await this.safeRequest(
        api,
        "post",
        "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/game/start"
      );

      if (!startResult.success || !startResult.data.session_id) {
        logger.error(
          `${colors.red}Failed to start ${gameName} game: ${
            startResult.error || "No session ID received"
          }${colors.reset}`
        );
        return startResult;
      }

      const sessionId = startResult.data.session_id;
      logger.info(
        `${colors.green}${gameName} game started successfully with session: ${colors.bright}${sessionId}${colors.reset}`
      );

      await this.wait(2000);

      const gameResult = await this.playGameWithProgress(
        api,
        gameName,
        sessionId
      );

      if (!gameResult.success) {
        logger.error(
          `${colors.red}Game session ${sessionId} failed: ${gameResult.error}${colors.reset}`
        );
        return gameResult;
      }

      return gameResult;
    } catch (error) {
      logger.error(
        `${colors.red}Unexpected error in playGame: ${error.message}${colors.reset}`
      );
      return { success: false, error: error.message };
    }
  }

  async playGameWithProgress(api, gameName, sessionId) {
    try {
      const tileSequence = [2, 4, 8, 16, 32, 64, 128, 256];
      let lastSuccessfulTile = 0;
      let lastSuccessfulTime = 0;

      for (let i = 0; i < tileSequence.length; i++) {
        const currentTile = tileSequence[i];
        logger.info(
          `${colors.cyan}${gameName} game progress: ${colors.bright}${i + 1}/${
            tileSequence.length
          }${colors.reset}`
        );

        const currentTime = Date.now();
        if (lastSuccessfulTime > 0) {
          const timeSinceLastSuccess = currentTime - lastSuccessfulTime;
          if (timeSinceLastSuccess < 5000) {
            const additionalDelay = 5000 - timeSinceLastSuccess;
            await this.wait(additionalDelay);
          }
        }

        // Random delay between saves
        await this.wait(this.getRandomNumber(4000, 7000));

        const saveResult = await this.safeRequest(
          api,
          "post",
          "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/game/save-tile",
          {
            session_id: sessionId,
            maxTile: currentTile,
          }
        );

        if (saveResult.success) {
          logger.info(
            `${colors.green}Tile ${currentTile} saved successfully${colors.reset}`
          );
          lastSuccessfulTile = currentTile;
          lastSuccessfulTime = Date.now();
        } else {
          const errorMessage = saveResult.details?.error || saveResult.error;
          if (errorMessage?.includes("SQLSTATE 42P10")) {
            logger.error(
              `${colors.red}Database conflict detected. Waiting for resolution...${colors.reset}`
            );
            await this.wait(10000); // Wait 10 seconds on database conflict
            continue; // Try the same tile again
          }

          logger.error(
            `${colors.red}Failed to save tile ${currentTile} - Error: ${errorMessage}${colors.reset}`
          );
          logger.error(
            `${colors.red}Last successful tile was: ${lastSuccessfulTile}${colors.reset}`
          );

          // On error, wait longer before trying next tile
          await this.wait(8000);
          continue; // Try to continue with next tile instead of breaking
        }
      }

      // Additional delay before ending game
      await this.wait(5000);

      // Try to end game multiple times if needed
      let endGameAttempts = 0;
      let gameOverResult;

      while (endGameAttempts < 3) {
        logger.info(
          `${colors.cyan}${gameName} game finished with session: ${sessionId}, maxTile: ${lastSuccessfulTile}${colors.reset}`
        );

        gameOverResult = await this.safeRequest(
          api,
          "post",
          "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/game/over",
          {
            session_id: sessionId,
            multiplier: 1,
            maxTile: lastSuccessfulTile,
          }
        );

        if (gameOverResult.success) {
          break;
        }

        logger.warn(
          `${colors.yellow}Failed to end game, attempt ${
            endGameAttempts + 1
          }/3. Waiting before retry...${colors.reset}`
        );
        await this.wait(8000);
        endGameAttempts++;
      }

      if (!gameOverResult.success) {
        logger.error(
          `${colors.red}Failed to properly end game session after all attempts${colors.reset}`
        );
        return gameOverResult;
      }

      if (gameOverResult.data) {
        const { earn, xp_earned, level, token_reward, attempts_reward } =
          gameOverResult.data;
        logger.info(`${colors.cyan}Game Rewards:${colors.reset}`);
        logger.info(
          `${colors.green}> Earnings: ${colors.bright}${earn || 0} CL${
            colors.reset
          }`
        );
        logger.info(
          `${colors.green}> XP Earned: ${colors.bright}${xp_earned || 0}${
            colors.reset
          }`
        );
        logger.info(
          `${colors.green}> Level: ${colors.bright}${level || 0}${colors.reset}`
        );
        logger.info(
          `${colors.green}> Token Reward: ${colors.bright}${token_reward || 0}${
            colors.reset
          }`
        );
        logger.info(
          `${colors.green}> Attempts Reward: ${colors.bright}${
            attempts_reward || 0
          }${colors.reset}`
        );
      }

      return gameOverResult;
    } catch (error) {
      logger.error(
        `${colors.red}Unexpected error in playGameWithProgress: ${error.message}${colors.reset}`
      );
      return { success: false, error: error.message };
    }
  }

  // Stack Game Methods
  async playStackGame(api, gameName) {
    try {
      const startResult = await this.safeRequest(
        api,
        "post",
        "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/stack/st-game"
      );

      if (!startResult.success || !startResult.data.session_id) {
        logger.error(
          `${colors.red}Failed to start ${gameName} game: ${
            startResult.error || "No session ID received"
          }${colors.reset}`
        );
        return startResult;
      }

      const sessionId = startResult.data.session_id;
      logger.info(
        `${colors.green}${gameName} game started successfully with session: ${colors.bright}${sessionId}${colors.reset}`
      );

      await this.wait(3000); // Wait before starting game progress

      return this.playStackGameWithProgress(api, gameName);
    } catch (error) {
      logger.error(
        `${colors.red}Unexpected error in playStackGame: ${error.message}${colors.reset}`
      );
      return { success: false, error: error.message };
    }
  }

  async playStackGameWithProgress(api, gameName) {
    try {
      const scoreSequence = [10, 20, 30, 40, 50, 60, 70, 80, 90];
      let lastSuccessfulScore = 0;
      let lastSuccessfulTime = 0;

      for (let i = 0; i < scoreSequence.length; i++) {
        const currentScore = scoreSequence[i];
        logger.info(
          `${colors.cyan}${gameName} game progress: ${colors.bright}${i + 1}/${
            scoreSequence.length
          }${colors.cyan} (Score: ${colors.bright}${currentScore}${
            colors.cyan
          })${colors.reset}`
        );

        const currentTime = Date.now();
        if (lastSuccessfulTime > 0) {
          const timeSinceLastSuccess = currentTime - lastSuccessfulTime;
          if (timeSinceLastSuccess < 5000) {
            const additionalDelay = 5000 - timeSinceLastSuccess;
            await this.wait(additionalDelay);
          }
        }

        // Random delay between score updates
        await this.wait(this.getRandomNumber(4000, 7000));

        let updateSuccess = false;
        let updateAttempts = 0;

        while (!updateSuccess && updateAttempts < 3) {
          const updateResult = await this.safeRequest(
            api,
            "post",
            "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/stack/update-game",
            {
              score: currentScore,
            }
          );

          if (updateResult.success) {
            logger.info(
              `${colors.green}Score ${currentScore} updated successfully${colors.reset}`
            );
            lastSuccessfulScore = currentScore;
            lastSuccessfulTime = Date.now();
            updateSuccess = true;
          } else {
            updateAttempts++;
            const errorMessage =
              updateResult.details?.error || updateResult.error;

            if (errorMessage?.includes("SQLSTATE 42P10")) {
              logger.warn(
                `${colors.yellow}Database conflict detected. Waiting before retry... (Attempt ${updateAttempts}/3)${colors.reset}`
              );
              await this.wait(8000); // Longer wait on database conflict
              continue;
            }

            logger.error(
              `${colors.red}Failed to update score ${currentScore} - Error: ${errorMessage} (Attempt ${updateAttempts}/3)${colors.reset}`
            );

            if (updateAttempts < 3) {
              logger.info(
                `${colors.yellow}Retrying after delay...${colors.reset}`
              );
              await this.wait(6000);
            } else {
              logger.error(
                `${colors.red}Last successful score was: ${lastSuccessfulScore}${colors.reset}`
              );
              break;
            }
          }
        }

        if (!updateSuccess) {
          logger.error(
            `${colors.red}Failed to update score after all attempts${colors.reset}`
          );
          break;
        }
      }

      // Additional delay before ending game
      await this.wait(5000);

      // Try to end game multiple times if needed
      let endGameAttempts = 0;
      let endGameResult;

      while (endGameAttempts < 3) {
        logger.info(
          `${colors.cyan}${gameName} game finished with final score: ${colors.bright}${lastSuccessfulScore}${colors.reset}`
        );

        endGameResult = await this.safeRequest(
          api,
          "post",
          "/api/cc82f330-6a6d-4deb-a15b-6a332a67ffa7/stack/en-game",
          {
            score: lastSuccessfulScore,
            multiplier: 1,
          }
        );

        if (endGameResult.success) {
          break;
        }

        endGameAttempts++;
        logger.warn(
          `${colors.yellow}Failed to end game, attempt ${endGameAttempts}/3. Waiting before retry...${colors.reset}`
        );
        await this.wait(8000);
      }

      if (!endGameResult.success) {
        logger.error(
          `${colors.red}Failed to end Stack game after all attempts: ${endGameResult.error}${colors.reset}`
        );
        return endGameResult;
      }

      if (endGameResult.data) {
        const { earn, xp_earned, level, token_reward, attempts_reward } =
          endGameResult.data;
        logger.info(`${colors.cyan}Stack Game Rewards:${colors.reset}`);
        logger.info(
          `${colors.green}> Earnings: ${colors.bright}${earn || 0} CL${
            colors.reset
          }`
        );
        logger.info(
          `${colors.green}> XP Earned: ${colors.bright}${xp_earned || 0}${
            colors.reset
          }`
        );
        logger.info(
          `${colors.green}> Level: ${colors.bright}${level || 0}${colors.reset}`
        );
        logger.info(
          `${colors.green}> Token Reward: ${colors.bright}${token_reward || 0}${
            colors.reset
          }`
        );
        logger.info(
          `${colors.green}> Attempts Reward: ${colors.bright}${
            attempts_reward || 0
          }${colors.reset}`
        );
      }

      return endGameResult;
    } catch (error) {
      logger.error(
        `${colors.red}Unexpected error in playStackGameWithProgress: ${error.message}${colors.reset}`
      );
      return { success: false, error: error.message };
    }
  }

  // Task Methods
  async processTasks(api, taskGetter, taskType) {
    logger.info(`${colors.cyan}Fetching ${taskType} tasks...${colors.reset}`);

    const tasksResult = await taskGetter(api);
    if (!tasksResult.success) {
      logger.error(
        `${colors.red}Failed to fetch ${taskType} | ${tasksResult.error}${colors.reset}`
      );
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
          logger.info(
            `${colors.cyan}Completing ${taskType} | ${colors.bright}${taskDetails.title}${colors.reset}`
          );
          const completeResult = await this.completeTask(api, task_id);
          if (completeResult.success) {
            logger.info(
              `${colors.green}${completeResult.data.message}${colors.reset}`
            );
          } else {
            logger.error(
              `${colors.red}Failed to complete task: ${completeResult.error}${colors.reset}`
            );
          }
        } else {
          logger.info(
            `${colors.yellow}${taskType} task already completed | ${taskDetails.title}${colors.reset}`
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
              `${colors.cyan}Claiming reward for ${taskType} | ${colors.bright}${taskDetails.title}${colors.reset}`
            );
            const claimResult = await this.claimTaskReward(api, task_id);
            if (claimResult.success) {
              logger.info(
                `${colors.green}${claimResult.data.message}${colors.reset}`
              );
              logger.info(
                `${colors.green}Reward received: ${colors.bright}${claimResult.data.reward_tokens}${colors.reset}`
              );
            } else {
              logger.error(
                `${colors.red}Failed to claim reward: ${claimResult.error}${colors.reset}`
              );
            }
          }
        }
      } else {
        logger.error(
          `${colors.red}Failed to fetch updated ${taskType} |${updatedTasksResult.error}${colors.reset}`
        );
      }
    } else {
      logger.warn(
        `${colors.yellow}No ${taskType} tasks available${colors.reset}`
      );
    }
  }

  // Account Processing
  async processAccount(initData, accountIndex) {
    const userData = JSON.parse(
      decodeURIComponent(initData.split("user=")[1].split("&")[0])
    );
    const firstName = userData.first_name;

    logger.info(
      `${colors.cyan}Account ${accountIndex + 1} | ${
        colors.bright
      }${firstName}${colors.reset}`
    );
    logger.info(`${colors.cyan}Logging into account${colors.reset}`);

    const api = this.createApiClient(initData);
    const loginResult = await this.login(api);
    if (!loginResult.success) {
      logger.error(
        `${colors.red}Login failed! ${loginResult.error}${colors.reset}`
      );
      return;
    }

    logger.info(`${colors.green}Login successful!${colors.reset}`);
    const userInfo = loginResult.data.user;
    logger.info(
      `${colors.cyan}CL Balance: ${colors.bright}${userInfo.tokens}${colors.reset}`
    );
    logger.info(
      `${colors.cyan}Tickets: ${colors.bright}${userInfo.daily_attempts}${colors.reset}`
    );

    // Daily Claim
    if (loginResult.data.dailyReward.can_claim_today) {
      logger.info(`${colors.cyan}Claiming daily reward${colors.reset}`);
      const claimResult = await this.claimDailyReward(api);
      if (
        claimResult.success &&
        claimResult.data.message === "daily reward claimed successfully"
      ) {
        logger.info(`${colors.green}Daily check-in successful!${colors.reset}`);
      } else {
        logger.error(
          `${colors.red}Unable to claim daily reward: ${
            claimResult.error || "Unknown error"
          }${colors.reset}`
        );
        if (claimResult.details) {
          logger.error(
            `${colors.red}Error details: ${JSON.stringify(
              claimResult.details
            )}${colors.reset}`
          );
        }
      }
    } else {
      logger.warn(
        `${colors.yellow}You've already checked in today.${colors.reset}`
      );
    }

    // Tasks
    await this.processTasks(api, () => this.getPartnerTasks(api), "partner");
    await this.processTasks(api, () => this.getDailyTasks(api), "daily");
    await this.processTasks(api, () => this.getOtherTasks(api), "other");

    // Games
    if (userInfo.daily_attempts > 0) {
      logger.info(
        `${colors.cyan}Starting Games (Available attempts: ${colors.bright}${userInfo.daily_attempts}${colors.cyan})${colors.reset}`
      );

      const availableGames = ["1024", "Stack"];
      let lastGame = null;

      for (let i = 1; i <= userInfo.daily_attempts; i++) {
        try {
          logger.info(
            `${colors.cyan}Starting game ${colors.bright}${i}${colors.cyan} of ${colors.bright}${userInfo.daily_attempts}${colors.reset}`
          );

          let currentGame;
          do {
            currentGame =
              availableGames[Math.floor(Math.random() * availableGames.length)];
          } while (lastGame === currentGame && userInfo.daily_attempts > 1);

          lastGame = currentGame;
          logger.info(
            `${colors.magenta}Randomly selected game: ${colors.bright}${currentGame}${colors.reset}`
          );

          if (i > 1) {
            logger.info(
              `${colors.yellow}Waiting before starting next game...${colors.reset}`
            );
            await this.wait(5000);
          }

          let gameResult;
          if (currentGame === "1024") {
            gameResult = await this.playGame(api, currentGame);
          } else {
            gameResult = await this.playStackGame(api, currentGame);
          }

          if (gameResult.success) {
            logger.info(
              `${colors.green}Game ${i} (${currentGame}) completed successfully${colors.reset}`
            );
            if (gameResult.data && gameResult.data.earn) {
              logger.info(
                `${colors.cyan}Rewards earned: ${colors.bright}${gameResult.data.earn} CL${colors.cyan}, ${colors.bright}${gameResult.data.xp_earned} XP${colors.reset}`
              );
            }
          } else {
            logger.error(
              `${colors.red}Failed to complete game ${i} (${currentGame}): ${gameResult.error}${colors.reset}`
            );
            await this.wait(10000);
          }

          await this.wait(3000);
        } catch (error) {
          logger.error(
            `${colors.red}Error during game ${i}: ${error.message}${colors.reset}`
          );
          await this.wait(10000);
        }
      }

      logger.info(`${colors.cyan}Finished all games${colors.reset}`);
    } else {
      logger.info(
        `${colors.yellow}No tickets left to play games${colors.reset}`
      );
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

      logger.info(
        `${colors.yellow}Waiting 24 hours before starting the next cycle${colors.reset}`
      );
      await this.countdown(24 * 60 * 60);
    }
  }
}

// Run the script
const client = new Clayton();
client.main().catch((err) => {
  logger.error(`${colors.red}${err.message}${colors.reset}`);
  process.exit(1);
});
