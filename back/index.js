const app = require("./app");
const http = require("http");
const config = require("./utils/config");
const logger = require("./utils/logger");
const { initializeSocket } = require("./socket");

const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

server.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});
