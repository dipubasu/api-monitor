const app = require("./src/app");
const config = require("./src/config");
const logger = require("./src/utils/logger");

app.listen(config.port, () => {
  logger.info(`Server running on http://localhost:${config.port}`);
});