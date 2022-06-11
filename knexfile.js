// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const env = require('./env.js');
const config = require('./config/database.js');
module.exports = {

  development: config,
  staging: config,
  production: config

};
