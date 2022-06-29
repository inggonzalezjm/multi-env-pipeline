const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const configsFile = fs.readFileSync(path.resolve("./configs/configs.yaml"), "utf-8");

const AppConfigs = YAML.parse(configsFile);

module.exports = { AppConfigs };
