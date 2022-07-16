/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 export let up = function (knex) {
	return knex.schema.createTable('users', (table) => {
	  table.increments('id').primary();
	  table.string('name', 50).nullable()
	  table.string('email', 50).nullable()
	  table.string('address', 255).nullable()
	  table.timestamp('created_at').defaultTo(knex.fn.now())
	  table.bigint('created_by', 14).nullable()
	  table.timestamp('updated_at').defaultTo(knex.fn.now())
	  table.bigint('updated_by', 14).nullable()
	  table.timestamp('deleted_at').nullable()
	  table.bigint('deleted_by', 14).nullable()
	})
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export let down = function (knex) {
	return knex.schema.dropTable('users');
  };
  