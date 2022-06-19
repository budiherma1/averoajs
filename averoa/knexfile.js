// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
 import env from './env.js';
 import config from './../config/database.js';
export default {

  development: config,
  staging: config,
  production: config

};
