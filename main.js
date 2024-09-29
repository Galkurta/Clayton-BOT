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
    this.firstAccountFarmEndTime = null;
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

  async login(initData) {
    const url = "https://tonclayton.fun/api/user/login";
    const headers = { ...this.headers, "Init-Data": initData };
    try {
      const response = await axios.post(url, {}, { headers });
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async dailyClaim(initData) {
    const url = "https://tonclayton.fun/api/user/daily-claim";
    const headers = { ...this.headers, "Init-Data": initData };
    try {
      const response = await axios.post(url, {}, { headers });
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async startFarm(initData) {
    const url = "https://tonclayton.fun/api/user/start";
    const headers = { ...this.headers, "Init-Data": initData };
    try {
      const response = await axios.post(url, {}, { headers });
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async claimFarm(initData) {
    const url = "https://tonclayton.fun/api/user/claim";
    const headers = { ...this.headers, "Init-Data": initData };
    try {
      const response = await axios.post(url, {}, { headers });
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getPartnerTasks(initData) {
    const url = "https://tonclayton.fun/api/user/partner/get";
    const headers = { ...this.headers, "Init-Data": initData };
    try {
      const response = await axios.post(url, {}, { headers });
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async completePartnerTask(initData, taskId) {
    const url = `https://tonclayton.fun/api/user/partner/complete/${taskId}`;
    const headers = { ...this.headers, "Init-Data": initData };
    try {
      const response = await axios.post(url, {}, { headers });
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async rewardPartnerTask(initData, taskId) {
    const url = `https://tonclayton.fun/api/user/partner/reward/${taskId}`;
    const headers = { ...this.headers, "Init-Data": initData };
    try {
      const response = await axios.post(url, {}, { headers });
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handlePartnerTasks(initData) {
    logger.info("Checking tasks");
    const tasksResult = await this.getPartnerTasks(initData);
    if (tasksResult.success) {
      const uncompletedTasks = tasksResult.data.filter(
        (task) => !task.is_completed
      );
      for (const task of uncompletedTasks) {
        logger.info(`Performing task | ${task.task_name}`);
        const completeResult = await this.completePartnerTask(
          initData,
          task.task_id
        );
        if (completeResult.success) {
          const rewardResult = await this.rewardPartnerTask(
            initData,
            task.task_id
          );
          if (rewardResult.success) {
            logger.info(`Successfully completed task | ${task.task_name}`);
          } else {
            logger.error(
              `Unable to claim reward for task | ${task.task_name} | ${
                rewardResult.error || "Unknown error"
              }`
            );
          }
        } else {
          logger.error(
            `Unable to complete task | ${task.task_name} | ${
              completeResult.error || "Unknown error"
            }`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } else {
      logger.error(
        `Unable to get partner task list | ${
          tasksResult.error || "Unknown error"
        }`
      );
    }
  }

  async handleTwitterTask(initData) {
    const checkUrl = "https://tonclayton.fun/api/user/task-twitter";
    const claimUrl = "https://tonclayton.fun/api/user/task-twitter-claim";
    const headers = { ...this.headers, "Init-Data": initData };

    try {
      const checkResponse = await axios.post(checkUrl, {}, { headers });

      if (checkResponse.data.claimed === false) {
        const claimResponse = await axios.post(claimUrl, {}, { headers });

        if (claimResponse.data.message === "Task status updated") {
          logger.info("Successfully completed Twitter task");
        } else {
          logger.error("Unable to complete Twitter task");
        }
      }
    } catch (error) {
      logger.error(`Error processing Twitter task: ${error.message}`);
    }
  }

  async handleBotTask(initData) {
    const checkUrl = "https://tonclayton.fun/api/user/task-bot";
    const claimUrl = "https://tonclayton.fun/api/user/task-bot-claim";
    const headers = { ...this.headers, "Init-Data": initData };

    try {
      const checkResponse = await axios.post(checkUrl, {}, { headers });

      if (
        checkResponse.data.bot === true &&
        checkResponse.data.claim === false
      ) {
        const claimResponse = await axios.post(claimUrl, {}, { headers });

        if (claimResponse.data.claimed) {
          logger.info(
            `Successfully completed bot usage task. Received ${claimResponse.data.claimed} CL`
          );
        } else {
          logger.error("Unable to complete bot usage task");
        }
      }
    } catch (error) {
      logger.error(`Error processing bot usage task: ${error.message}`);
    }
  }

  async handleDailyTasks(initData) {
    const dailyTasksUrl = "https://tonclayton.fun/api/user/daily-tasks";
    const headers = { ...this.headers, "Init-Data": initData };

    try {
      const response = await axios.post(dailyTasksUrl, {}, { headers });

      if (response.status === 200) {
        const uncompletedTasks = response.data.filter(
          (task) => !task.is_completed
        );

        for (const task of uncompletedTasks) {
          const completeUrl = `https://tonclayton.fun/api/user/daily-task/${task.id}/complete`;
          const claimUrl = `https://tonclayton.fun/api/user/daily-task/${task.id}/claim`;

          try {
            await axios.post(completeUrl, {}, { headers });

            const claimResponse = await axios.post(claimUrl, {}, { headers });

            if (claimResponse.data.message === "Reward claimed successfully") {
              logger.info(
                `Successfully completed ${task.task_type} task | Received ${claimResponse.data.reward} CL`
              );
            } else {
              logger.error(`Unable to claim reward for ${task.task_type} task`);
            }
          } catch (error) {
            // Error handling removed as per request
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      // Error handling removed as per request
    }
  }

  async playGame(initData) {
    const headers = { ...this.headers, "Init-Data": initData };
    const baseUrl = "https://tonclayton.fun/api";

    while (true) {
      const loginResult = await this.login(initData);
      if (!loginResult.success) {
        logger.error("Unable to check tickets");
        return;
      }

      const tickets = loginResult.data.user.tickets;
      if (tickets <= 0) {
        logger.info("No more tickets. Stopping game play.");
        return;
      }

      let startAttempts = 0;
      let gameStarted = false;

      while (startAttempts < 1 && !gameStarted) {
        try {
          const startGameResponse = await axios.post(
            `${baseUrl}/game/start-game`,
            {},
            { headers }
          );
          if (startGameResponse.data.message === "Game started successfully") {
            logger.info("Game started successfully");
            gameStarted = true;
          } else {
            logger.error("Unable to start the game");
            startAttempts++;
          }
        } catch (error) {
          logger.error(`Error starting game: ${error.message}`);
          startAttempts++;
        }

        if (!gameStarted && startAttempts < 3) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      if (!gameStarted) {
        logger.error(
          "Unable to start the game after 3 attempts. Stopping game play."
        );
        return;
      }

      const fixedMilestones = [4, 8, 16, 32, 64, 128, 256, 512, 1024];
      const allMilestones = [...fixedMilestones].sort((a, b) => a - b);
      const gameEndTime = Date.now() + 150000;

      for (const milestone of allMilestones) {
        if (Date.now() >= gameEndTime) break;

        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 10000 + 5000)
        );

        try {
          const saveGameResponse = await axios.post(
            `${baseUrl}/game/save-tile-game`,
            { maxTile: milestone },
            { headers }
          );
          if (saveGameResponse.data.message === "MaxTile saved successfully") {
            logger.info(`Reached tile ${milestone}`);
          } else {
            logger.error(`Failed to save tile ${milestone}`);
          }
        } catch (error) {
          logger.error(`Error saving game state: ${error.message}`);
        }
      }

      try {
        const endGameResponse = await axios.post(
          `${baseUrl}/game/over-game`,
          {},
          { headers }
        );
        const reward = endGameResponse.data;
        logger.info(
          `Game ended successfully. Received ${reward.earn} CL and ${reward.xp_earned} XP`
        );
      } catch (error) {
        logger.error(`Error ending game: ${error.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
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
        const userData = JSON.parse(
          decodeURIComponent(initData.split("user=")[1].split("&")[0])
        );
        const firstName = userData.first_name;

        logger.info(`Account ${i + 1} | ${firstName}`);

        logger.info(`Logging into account`);
        const loginResult = await this.login(initData);
        if (loginResult.success) {
          logger.info("Login successful!");
          const userInfo = loginResult.data.user;
          logger.info(`CL Balance: ${userInfo.tokens}`);
          logger.info(`Tickets: ${userInfo.daily_attempts}`);

          if (loginResult.data.dailyReward.can_claim_today) {
            logger.info("Claiming daily reward...");
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

          if (!userInfo.active_farm) {
            logger.info("Starting farm");
            const startResult = await this.startFarm(initData);
            if (startResult.success) {
              const finishTime = DateTime.fromISO(
                startResult.data.start_time
              ).plus({ hours: 6 });
              logger.info(
                `Farm started. Completion time: ${finishTime.toFormat(
                  "dd/MM/yyyy HH:mm:ss"
                )}`
              );
              if (i === 0) {
                this.firstAccountFarmEndTime = finishTime;
              }
            } else {
              logger.error(
                `Unable to start farm: ${startResult.error || "Unknown error"}`
              );
            }
          } else {
            if (!userInfo.can_claim) {
              const finishTime = DateTime.fromISO(userInfo.start_time).plus({
                hours: 6,
              });
              logger.info(
                `Farm is active | Completion time: ${finishTime.toFormat(
                  "dd/MM/yyyy HH:mm:ss"
                )}`
              );
              if (i === 0) {
                this.firstAccountFarmEndTime = finishTime;
              }
            } else {
              logger.info("Claiming farm reward...");
              const claimResult = await this.claimFarm(initData);
              if (claimResult.success) {
                logger.info(
                  `Claim successful | ${claimResult.data.claim} CL | ${claimResult.data.xp_earned} XP | Balance: ${claimResult.data.tokens}`
                );

                logger.info("Starting new farm...");
                const startResult = await this.startFarm(initData);
                if (startResult.success) {
                  const finishTime = DateTime.fromISO(
                    startResult.data.start_time
                  ).plus({ hours: 6 });
                  logger.info(
                    `New farm started. Completion time: ${finishTime.toFormat(
                      "dd/MM/yyyy HH:mm:ss"
                    )}`
                  );
                  if (i === 0) {
                    this.firstAccountFarmEndTime = finishTime;
                  }
                } else {
                  logger.error(
                    `Unable to start new farm: ${
                      startResult.error || "Unknown error"
                    }`
                  );
                }
              } else {
                logger.error(
                  `Unable to claim farm reward: ${
                    claimResult.error || "Unknown error"
                  }`
                );
              }
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 3000));
          await this.handlePartnerTasks(initData);
          await this.handleTwitterTask(initData);
          await this.handleBotTask(initData);
          await this.handleDailyTasks(initData);
          if (userInfo.daily_attempts > 0) {
            await this.playGame(initData);
          } else {
            logger.info(`No tickets left to play the game`);
          }
        } else {
          logger.error(`Login failed! ${loginResult.error}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (this.firstAccountFarmEndTime) {
        const now = DateTime.now();
        const waitTime = this.firstAccountFarmEndTime.diff(now).as("seconds");
        if (waitTime > 0) {
          logger.info(`Waiting until the first account's farm is completed...`);
          await this.countdown(Math.ceil(waitTime));
        }
      } else {
        logger.warn(
          `No information about the first account's farm completion time. Waiting 6 hours...`
        );
        await this.countdown(6 * 60 * 60);
      }
    }
  }
}

const client = new Clayton();
client.main().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
