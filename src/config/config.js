const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .default('development')
      .valid('production', 'development', 'test')
      .required(),
    PORT: Joi.number().default(8080),
    BOT_TOKEN: Joi.string().required().description('Bot token from BotFather'),
    LOG_FILE_NAME: Joi.string().default('weather-alert-bot'),
    AUTH_SOURCE: Joi.string().default('element').optional(),
    RECONNECT_INTERVAL: Joi.number().default(1000),
    API_BASE_URL: Joi.string().required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  botToken: envVars.BOT_TOKEN,
  logFileName: envVars.LOG_FILE_NAME,
  reconnectInterval: envVars.RECONNECT_INTERVAL,
  apiBaseUrl: envVars.API_BASE_URL,
};
