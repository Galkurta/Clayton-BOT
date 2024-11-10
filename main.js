const fs = require("fs");
const path = require("path");
const axios = require("axios");
const readline = require("readline");
require("luxon");
const printBanner = require("./config/banner.js");
const logger = require("./config/logger.js");
const colors = require("./config/colors");

class Clayton {
  // Constants
  static API_ENDPOINTS = {
    LOGIN: "user/authorization",
    DAILY_CLAIM: "user/daily-claim",
    PARTNER_TASKS: "tasks/partner-tasks",
    DAILY_TASKS: "tasks/daily-tasks",
    DEFAULT_TASKS: "tasks/default-tasks",
    TASK_COMPLETE: "tasks/complete",
    TASK_CLAIM: "tasks/claim",
    GAME_START: "game/start",
    GAME_SAVE_TILE: "game/save-tile",
    GAME_OVER: "game/over",
    STACK_START: "stack/st-game",
    STACK_UPDATE: "stack/update-game",
    STACK_END: "stack/en-game",
  };

  static GAME_CONFIG = {
    TILE_SEQUENCE: [2, 4, 8, 16, 32, 64, 128, 256],
    SCORE_SEQUENCE: [10, 20, 30, 40, 50, 60, 70, 80, 90],
    BASE_DELAY: 5000,
    GAME_INTERVAL: 20000,
    RETRY_ATTEMPTS: 5,
    RETRY_DELAY: 5000,
  };

  constructor() {
    // Initialize base properties
    this.initializeProperties();
  }

  // Initialization Methods
  initializeProperties() {
    this.baseUrl = "https://tonclayton.fun";
    this.apiBaseId = null;
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

  // API Base ID Methods
  async fetchApiBaseId() {
    try {
      const jsFile = await this.findLatestJsFile();
      if (!jsFile) throw new Error("Could not find index JS file");

      const response = await axios.get(`${this.baseUrl}/assets/${jsFile}`);
      const jsContent = response.data;

      const match = jsContent.match(/_ge="([^"]+)"/);
      if (!match?.[1]) throw new Error("API Base ID pattern not found");

      this.apiBaseId = match[1];
      logger.info(
        `${colors.green}API Base ID fetched: ${colors.bright}${this.apiBaseId}${colors.reset}`
      );
      return true;
    } catch (error) {
      logger.error(
        `${colors.red}API Base ID fetch failed: ${error.message}${colors.reset}`
      );
      return false;
    }
  }

  async findLatestJsFile() {
    try {
      const response = await axios.get(this.baseUrl);
      const html = response.data;
      const match = html.match(/\/assets\/index-[^"]+\.js/);
      return match ? match[0].split("/").pop() : null;
    } catch (error) {
      logger.error(
        `${colors.red}Failed to find JS file: ${error.message}${colors.reset}`
      );
      return null;
    }
  }

  getApiUrl(endpoint) {
    if (!this.apiBaseId) throw new Error("API Base ID not initialized");
    return `/api/${this.apiBaseId}/${endpoint}`;
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
    return axios.create({
      baseURL: this.baseUrl,
      headers: { ...this.headers, "Init-Data": initData },
    });
  }

  async safeRequest(
    api,
    method,
    url,
    data = {},
    retries = Clayton.GAME_CONFIG.RETRY_ATTEMPTS
  ) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await api[method](url, data);
        return { success: true, data: response.data };
      } catch (error) {
        if (this.shouldRetry(error, attempt, retries)) {
          await this.handleRetry(attempt);
          continue;
        }
        return this.formatErrorResponse(error);
      }
    }
  }

  shouldRetry(error, attempt, retries) {
    const statusCode = error.response?.status;
    return (
      attempt < retries - 1 &&
      (statusCode >= 500 || error.message.includes("SQLSTATE 42P10"))
    );
  }

  async handleRetry(attempt) {
    logger.warn(`${colors.yellow}Retry attempt ${attempt + 1}${colors.reset}`);
    await this.wait(Clayton.GAME_CONFIG.RETRY_DELAY * (attempt + 1));
  }

  formatErrorResponse(error) {
    return {
      success: false,
      error: error.message,
      details: error.response?.data,
    };
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
      this.getApiUrl(Clayton.API_ENDPOINTS.LOGIN)
    );
  }

  async claimDailyReward(api) {
    try {
      const result = await this.safeRequest(
        api,
        "post",
        this.getApiUrl(Clayton.API_ENDPOINTS.DAILY_CLAIM)
      );

      if (result.success && result.data) {
        // Add more specific response validation
        if (typeof result.data === "object") {
          if (result.data.message) {
            result.data.message = result.data.message.toLowerCase();
          }
          return result;
        }
      }

      return {
        success: false,
        error: "Invalid response format",
        details: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
      };
    }
  }

  async getPartnerTasks(api) {
    return this.safeRequest(
      api,
      "get",
      this.getApiUrl(Clayton.API_ENDPOINTS.PARTNER_TASKS)
    );
  }

  async getDailyTasks(api) {
    return this.safeRequest(
      api,
      "get",
      this.getApiUrl(Clayton.API_ENDPOINTS.DAILY_TASKS)
    );
  }

  async getOtherTasks(api) {
    return this.safeRequest(
      api,
      "get",
      this.getApiUrl(Clayton.API_ENDPOINTS.DEFAULT_TASKS)
    );
  }

  async completeTask(api, taskId) {
    return this.safeRequest(
      api,
      "post",
      this.getApiUrl(Clayton.API_ENDPOINTS.TASK_COMPLETE),
      { task_id: taskId }
    );
  }

  async claimTaskReward(api, taskId) {
    return this.safeRequest(
      api,
      "post",
      this.getApiUrl(Clayton.API_ENDPOINTS.TASK_CLAIM),
      { task_id: taskId }
    );
  }

  // Game Methods
  async playGame(api, gameName) {
    try {
      await this.wait(Clayton.GAME_CONFIG.BASE_DELAY);

      const startResult = await this.safeRequest(
        api,
        "post",
        this.getApiUrl(Clayton.API_ENDPOINTS.GAME_START)
      );

      if (!this.validateGameStart(startResult, gameName)) {
        return startResult;
      }

      const sessionId = startResult.data.session_id;
      this.logGameStart(gameName, sessionId);

      await this.wait(3000);
      return this.playGameWithProgress(api, gameName, sessionId);
    } catch (error) {
      return this.handleGameError("playGame", error);
    }
  }

  validateGameStart(startResult, gameName) {
    if (!startResult.success || !startResult.data.session_id) {
      logger.error(
        `${colors.red}Failed to start ${gameName} game: ${
          startResult.error || "No session ID received"
        }${colors.reset}`
      );
      return false;
    }
    return true;
  }

  logGameStart(gameName, sessionId) {
    logger.info(
      `${colors.green}${gameName} game started with session: ${colors.bright}${sessionId}${colors.reset}`
    );
  }

  async playGameWithProgress(api, gameName, sessionId) {
    try {
      const tileSequence = Clayton.GAME_CONFIG.TILE_SEQUENCE;
      let lastSuccessfulTile = 0;

      for (const currentTile of tileSequence) {
        if (!(await this.processTile(api, gameName, sessionId, currentTile))) {
          break;
        }
        lastSuccessfulTile = currentTile;
      }

      await this.wait(8000);
      return this.endGame(api, gameName, sessionId, lastSuccessfulTile);
    } catch (error) {
      return this.handleGameError("playGameWithProgress", error);
    }
  }

  async processTile(api, gameName, sessionId, currentTile) {
    logger.info(
      `${colors.cyan}${gameName} progress: ${colors.bright}Tile ${currentTile}${colors.reset}`
    );

    await this.wait(this.getRandomNumber(6000, 10000));

    const saveResult = await this.safeRequest(
      api,
      "post",
      this.getApiUrl(Clayton.API_ENDPOINTS.GAME_SAVE_TILE),
      {
        session_id: sessionId,
        maxTile: currentTile,
      }
    );

    return this.handleTileSaveResult(saveResult, currentTile);
  }

  handleTileSaveResult(saveResult, currentTile) {
    if (saveResult.success) {
      logger.info(`${colors.green}Tile ${currentTile} saved${colors.reset}`);
      return true;
    }

    logger.error(
      `${colors.red}Failed to save tile ${currentTile}: ${saveResult.error}${colors.reset}`
    );
    return false;
  }

  async endGame(api, gameName, sessionId, lastSuccessfulTile) {
    const endGameResult = await this.safeRequest(
      api,
      "post",
      this.getApiUrl(Clayton.API_ENDPOINTS.GAME_OVER),
      {
        session_id: sessionId,
        multiplier: 1,
        maxTile: lastSuccessfulTile,
      }
    );

    this.logGameResults(gameName, endGameResult);
    return endGameResult;
  }

  logGameResults(gameName, result) {
    if (!result.success) {
      logger.error(
        `${colors.red}Game end failed: ${result.error}${colors.reset}`
      );
      return;
    }

    const { earn, xp_earned, level, token_reward, attempts_reward } =
      result.data;
    logger.info(`${colors.cyan}${gameName} Rewards:${colors.reset}`);
    logger.info(
      `${colors.green}> Earnings: ${colors.bright}${earn || 0} CL${
        colors.reset
      }`
    );
    logger.info(
      `${colors.green}> XP: ${colors.bright}${xp_earned || 0}${colors.reset}`
    );
    logger.info(
      `${colors.green}> Level: ${colors.bright}${level || 0}${colors.reset}`
    );
    logger.info(
      `${colors.green}> Tokens: ${colors.bright}${token_reward || 0}${
        colors.reset
      }`
    );
    logger.info(
      `${colors.green}> Attempts: ${colors.bright}${attempts_reward || 0}${
        colors.reset
      }`
    );
  }

  handleGameError(context, error) {
    logger.error(
      `${colors.red}Error in ${context}: ${error.message}${colors.reset}`
    );
    return { success: false, error: error.message };
  }

  // Stack Game Methods
  async playStackGame(api, gameName) {
    try {
      await this.wait(Clayton.GAME_CONFIG.BASE_DELAY);

      const startResult = await this.safeRequest(
        api,
        "post",
        this.getApiUrl(Clayton.API_ENDPOINTS.STACK_START)
      );

      if (!this.validateGameStart(startResult, gameName)) {
        return startResult;
      }

      this.logGameStart(gameName, startResult.data.session_id);
      await this.wait(3000);

      return this.playStackGameWithProgress(api, gameName);
    } catch (error) {
      return this.handleGameError("playStackGame", error);
    }
  }

  async playStackGameWithProgress(api, gameName) {
    try {
      const scoreSequence = Clayton.GAME_CONFIG.SCORE_SEQUENCE;
      let lastSuccessfulScore = 0;

      for (const currentScore of scoreSequence) {
        if (!(await this.processStackScore(api, gameName, currentScore))) {
          break;
        }
        lastSuccessfulScore = currentScore;
      }

      await this.wait(8000);
      return this.endStackGame(api, gameName, lastSuccessfulScore);
    } catch (error) {
      return this.handleGameError("playStackGameWithProgress", error);
    }
  }

  async processStackScore(api, gameName, currentScore) {
    logger.info(
      `${colors.cyan}${gameName} progress: ${colors.bright}Score ${currentScore}${colors.reset}`
    );

    await this.wait(this.getRandomNumber(6000, 10000));

    const updateResult = await this.safeRequest(
      api,
      "post",
      this.getApiUrl(Clayton.API_ENDPOINTS.STACK_UPDATE),
      { score: currentScore }
    );
    return this.handleScoreUpdateResult(updateResult, currentScore);
  }

  handleScoreUpdateResult(updateResult, currentScore) {
    if (updateResult.success) {
      logger.info(
        `${colors.green}Score ${currentScore} updated${colors.reset}`
      );
      return true;
    }

    logger.error(
      `${colors.red}Failed to update score ${currentScore}: ${updateResult.error}${colors.reset}`
    );
    return false;
  }

  async endStackGame(api, gameName, lastSuccessfulScore) {
    const endGameResult = await this.safeRequest(
      api,
      "post",
      this.getApiUrl(Clayton.API_ENDPOINTS.STACK_END),
      {
        score: lastSuccessfulScore,
        multiplier: 1,
      }
    );

    this.logGameResults(gameName, endGameResult);
    return endGameResult;
  }

  // Task Methods
  async processTasks(api, taskGetter, taskType) {
    logger.info(`${colors.cyan}Fetching ${taskType} tasks...${colors.reset}`);

    const tasksResult = await taskGetter(api);
    if (!tasksResult.success) {
      this.logTaskError(taskType, tasksResult.error);
      return;
    }

    const tasks = tasksResult.data;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      logger.warn(
        `${colors.yellow}No ${taskType} tasks available${colors.reset}`
      );
      return;
    }

    await this.processTaskList(api, tasks, taskType);
    await this.processTaskRewards(api, taskGetter, taskType);
  }

  logTaskError(taskType, error) {
    logger.error(
      `${colors.red}Failed to fetch ${taskType} tasks: ${error}${colors.reset}`
    );
  }

  async processTaskList(api, tasks, taskType) {
    for (const task of tasks) {
      if (await this.shouldProcessTask(task)) {
        await this.executeTask(api, task, taskType);
      }
    }
  }

  async shouldProcessTask(task) {
    const { is_completed, is_claimed, task_id } = task;
    return !is_completed && !is_claimed && task_id !== 2;
  }

  async executeTask(api, task, taskType) {
    const { task_id, task: taskDetails } = task;
    logger.info(
      `${colors.cyan}Completing ${taskType} | ${colors.bright}${taskDetails.title}${colors.reset}`
    );

    const completeResult = await this.completeTask(api, task_id);
    this.logTaskCompletion(completeResult, taskType, taskDetails.title);
  }

  logTaskCompletion(result, taskType, taskTitle) {
    if (result.success) {
      logger.info(`${colors.green}${result.data.message}${colors.reset}`);
    } else {
      logger.error(
        `${colors.red}Failed to complete ${taskType} task "${taskTitle}": ${result.error}${colors.reset}`
      );
    }
  }

  async processTaskRewards(api, taskGetter, taskType) {
    const updatedTasksResult = await taskGetter(api);
    if (!updatedTasksResult.success) {
      this.logTaskError(taskType, updatedTasksResult.error);
      return;
    }

    const tasks = updatedTasksResult.data;
    for (const task of tasks) {
      if (await this.shouldClaimReward(task)) {
        await this.claimTaskRewardWithLogging(api, task, taskType);
      }
    }
  }

  async shouldClaimReward(task) {
    return task.is_completed && !task.is_claimed;
  }

  async claimTaskRewardWithLogging(api, task, taskType) {
    const { task_id, task: taskDetails } = task;
    logger.info(
      `${colors.cyan}Claiming reward for ${taskType} | ${colors.bright}${taskDetails.title}${colors.reset}`
    );

    const claimResult = await this.claimTaskReward(api, task_id);
    this.logRewardClaim(claimResult);
  }

  logRewardClaim(result) {
    if (result.success) {
      logger.info(`${colors.green}${result.data.message}${colors.reset}`);
      logger.info(
        `${colors.green}Reward received: ${colors.bright}${result.data.reward_tokens}${colors.reset}`
      );
    } else {
      logger.error(
        `${colors.red}Failed to claim reward: ${result.error}${colors.reset}`
      );
    }
  }

  // Account Processing
  async processAccount(initData, accountIndex) {
    const userData = this.parseUserData(initData);
    this.logAccountStart(accountIndex, userData.first_name);

    const api = this.createApiClient(initData);
    const loginResult = await this.login(api);

    if (!(await this.validateLogin(loginResult))) {
      return;
    }

    const userInfo = loginResult.data.user;
    this.logUserInfo(userInfo);

    await this.handleDailyReward(api, loginResult.data.dailyReward);
    await this.handleAllTasks(api);
    await this.handleGames(api, userInfo);
  }

  parseUserData(initData) {
    return JSON.parse(
      decodeURIComponent(initData.split("user=")[1].split("&")[0])
    );
  }

  logAccountStart(accountIndex, firstName) {
    logger.info(
      `${colors.cyan}Account ${accountIndex + 1} | ${
        colors.bright
      }${firstName}${colors.reset}`
    );
    logger.info(`${colors.cyan}Logging into account${colors.reset}`);
  }

  async validateLogin(loginResult) {
    if (!loginResult.success) {
      logger.error(
        `${colors.red}Login failed! ${loginResult.error}${colors.reset}`
      );
      return false;
    }
    logger.info(`${colors.green}Login successful!${colors.reset}`);
    return true;
  }

  logUserInfo(userInfo) {
    logger.info(
      `${colors.cyan}CL Balance: ${colors.bright}${userInfo.tokens}${colors.reset}`
    );
    logger.info(
      `${colors.cyan}Tickets: ${colors.bright}${userInfo.daily_attempts}${colors.reset}`
    );
  }

  async handleDailyReward(api, dailyReward) {
    try {
      if (!dailyReward.can_claim_today) {
        logger.warn(
          `${colors.yellow}Daily reward already claimed${colors.reset}`
        );
        return;
      }

      logger.info(`${colors.cyan}Claiming daily reward...${colors.reset}`);
      let claimAttempts = 0;
      const maxAttempts = 3;

      while (claimAttempts < maxAttempts) {
        const claimResult = await this.claimDailyReward(api);

        if (claimResult.success) {
          logger.info(
            `${colors.green}Daily reward claimed successfully!${colors.reset}`
          );
          if (claimResult.data.tokens) {
            logger.info(
              `${colors.green}New balance: ${colors.bright}${claimResult.data.tokens} CL${colors.reset}`
            );
          }
          return;
        }

        claimAttempts++;
        const errorMessage =
          claimResult.details?.error || claimResult.error || "Unknown error";

        if (claimAttempts < maxAttempts) {
          logger.warn(
            `${colors.yellow}Failed to claim daily reward (Attempt ${claimAttempts}/${maxAttempts}): ${errorMessage}${colors.reset}`
          );
          await this.wait(5000);
        } else {
          logger.error(
            `${colors.red}Failed to claim daily reward after ${maxAttempts} attempts: ${errorMessage}${colors.reset}`
          );
        }
      }
    } catch (error) {
      logger.error(
        `${colors.red}Error in handleDailyReward: ${error.message}${colors.reset}`
      );
    }
  }

  logDailyRewardResult(result) {
    if (result.success) {
      if (result.data.message === "daily reward claimed successfully") {
        logger.info(
          `${colors.green}Daily reward claimed successfully!${colors.reset}`
        );
        if (result.data.tokens) {
          logger.info(
            `${colors.green}New balance: ${colors.bright}${result.data.tokens} CL${colors.reset}`
          );
        }
      } else {
        logger.info(`${colors.green}${result.data.message}${colors.reset}`);
      }
    } else {
      const errorMessage =
        result.details?.error || result.error || "Unknown error";
      logger.error(
        `${colors.red}Failed to claim daily reward: ${errorMessage}${colors.reset}`
      );

      if (result.details) {
        logger.debug(
          `${colors.gray}Error details: ${JSON.stringify(result.details)}${
            colors.reset
          }`
        );
      }
    }
  }

  async handleAllTasks(api) {
    await this.processTasks(api, () => this.getPartnerTasks(api), "partner");
    await this.processTasks(api, () => this.getDailyTasks(api), "daily");
    await this.processTasks(api, () => this.getOtherTasks(api), "other");
  }

  async handleGames(api, userInfo) {
    if (userInfo.daily_attempts <= 0) {
      logger.info(`${colors.yellow}No game tickets available${colors.reset}`);
      return;
    }

    await this.playGamesWithRotation(api, userInfo.daily_attempts);
  }

  async playGamesWithRotation(api, attempts) {
    logger.info(
      `${colors.cyan}Starting Games (Available attempts: ${colors.bright}${attempts}${colors.cyan})${colors.reset}`
    );

    const gameManager = new GameRotationManager(attempts);

    for (let i = 1; i <= attempts; i++) {
      const currentGame = await gameManager.selectNextGame();
      await this.playOneGame(api, currentGame, i, attempts);
    }

    logger.info(`${colors.cyan}All games completed${colors.reset}`);
  }

  async playOneGame(api, gameType, currentAttempt, totalAttempts) {
    try {
      logger.info(
        `${colors.cyan}Starting game ${currentAttempt}/${totalAttempts}: ${colors.bright}${gameType}${colors.reset}`
      );

      if (currentAttempt > 1) {
        await this.wait(15000); // Cool down between games
      }

      const gameResult =
        gameType === "1024"
          ? await this.playGame(api, gameType)
          : await this.playStackGame(api, gameType);

      await this.handleGameCompletion(gameResult, currentAttempt, gameType);
    } catch (error) {
      this.handleGameError("playOneGame", error);
      await this.wait(20000); // Extended delay after error
    }
  }

  async handleGameCompletion(gameResult, attempt, gameType) {
    if (gameResult.success) {
      logger.info(
        `${colors.green}Game ${attempt} (${gameType}) completed successfully${colors.reset}`
      );
      if (gameResult.data?.earn) {
        logger.info(
          `${colors.cyan}Rewards: ${colors.bright}${gameResult.data.earn} CL, ${gameResult.data.xp_earned} XP${colors.reset}`
        );
      }
      await this.wait(8000);
    } else {
      logger.error(
        `${colors.red}Game ${attempt} (${gameType}) failed: ${gameResult.error}${colors.reset}`
      );
      await this.wait(20000);
    }
  }

  // Main Process
  async main() {
    printBanner();

    while (true) {
      if (!(await this.initializeApiBase())) {
        continue;
      }

      await this.processAllAccounts();
      await this.prepareNextCycle();
    }
  }

  async initializeApiBase() {
    const success = await this.fetchApiBaseId();
    if (!success) {
      logger.error(
        `${colors.red}Failed to initialize API Base ID. Retrying in 1 minute...${colors.reset}`
      );
      await this.wait(60000);
      return false;
    }
    return true;
  }

  async processAllAccounts() {
    const accounts = await this.loadAccounts();
    for (let i = 0; i < accounts.length; i++) {
      await this.processAccount(accounts[i], i);
      await this.wait(1000);
    }
  }

  async loadAccounts() {
    const dataFile = path.join(__dirname, "data.txt");
    return await this.readFileLines(dataFile);
  }

  async prepareNextCycle() {
    logger.info(
      `${colors.yellow}Preparing for next 24-hour cycle${colors.reset}`
    );
    await this.countdown(24 * 60 * 60);
  }
}

// Game Rotation Manager Class
class GameRotationManager {
  constructor(totalAttempts) {
    this.availableGames = ["1024", "Stack"];
    this.lastGame = null;
    this.lastGameTime = 0;
    this.totalAttempts = totalAttempts;
  }

  async selectNextGame() {
    const currentTime = Date.now();
    let selectedGame;

    if (this.shouldForceAlternate(currentTime)) {
      selectedGame = this.lastGame === "1024" ? "Stack" : "1024";
    } else {
      selectedGame = this.getRandomGame();
    }

    this.updateGameState(selectedGame, currentTime);
    return selectedGame;
  }

  shouldForceAlternate(currentTime) {
    return (
      this.lastGame &&
      currentTime - this.lastGameTime < Clayton.GAME_CONFIG.GAME_INTERVAL
    );
  }

  getRandomGame() {
    let game;
    do {
      game =
        this.availableGames[
          Math.floor(Math.random() * this.availableGames.length)
        ];
    } while (this.lastGame === game && this.totalAttempts > 1);
    return game;
  }

  updateGameState(game, time) {
    this.lastGame = game;
    this.lastGameTime = time;
  }
}

// Run the script
const client = new Clayton();
client.main().catch((err) => {
  logger.error(`${colors.red}${err.message}${colors.reset}`);
  process.exit(1);
});
