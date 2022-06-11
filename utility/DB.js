const knex = require('knex');
const config = require('./../config/database.js');

module.exports = knex(config);