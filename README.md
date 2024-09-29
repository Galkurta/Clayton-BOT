# Clayton Bot

Clayton Bot is an automated tool designed to interact with the Clayton Coin platform. It performs various tasks such as daily check-ins, farming, partner tasks, and playing games to earn Clayton Coins (CL) and experience points (XP).

## Features

- Automatic login
- Daily reward claiming
- Farm management
- Partner task completion
- Twitter task handling
- Bot usage task completion
- Daily task management
- Automated game playing
- Support multi account

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js installed on your system
- Basic knowledge of JavaScript and Node.js

## Installation

1. Clone this repository to your local machine.
2. Navigate to the project directory.
3. Install the required dependencies:

```
npm install
```

## Configuration

1. Edit `data.txt` file in the project root directory.
2. Add your Clayton Coin account information to the `data.txt` file. Each line should contain the initialization data for one account.

## Usage

To start the Clayton Bot, run the following command in the terminal:

```
node main.js
```

The bot will automatically cycle through the accounts listed in `data.txt`, performing tasks and earning rewards.

## Error Codes

Here are some common error codes you might encounter and their possible meanings:

- `ECONNREFUSED`: Connection refused. This usually means the server is not accessible or is down.
- `ETIMEDOUT`: Connection timed out. This can happen if the server is slow to respond or if there are network issues.
- `401 Unauthorized`: This indicates that the provided credentials are invalid or have expired.
- `403 Forbidden`: The server understood the request but refuses to authorize it.
- `404 Not Found`: The requested resource could not be found on the server.
- `409 Conflict`: This error occurs when the request could not be completed due to a conflict with the current state of the target resource. It often happens when trying to create or modify a resource that already exists or is in a conflicting state.
- `500 Internal Server Error`: This is a generic error message when an unexpected condition was encountered by the server.

If you encounter these errors:

1. Check your internet connection
2. Verify that your account credentials are correct and up to date
3. Ensure that the Clayton Coin servers are operational
4. For 409 errors, check if you're trying to perform an action that's already been done (like claiming a reward you've already claimed)
5. If the issue persists, try running the bot again after a short wait

For any persistent issues, please check the project's issue tracker or create a new issue with details about the error you're encountering.

## Registration

To create a new Clayton Coin account and start earning, use the following registration link:

[Register for Clayton](https://t.me/claytoncoinbot/game?startapp=6944804952)

## Disclaimer

This bot is for educational purposes only. Use it at your own risk. The authors are not responsible for any consequences resulting from the use of this bot.

## Contributing

Contributions to the Clayton Bot project are welcome. Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
