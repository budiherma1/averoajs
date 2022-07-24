import { Model as Objection } from 'objection';
import { faker } from '@faker-js/faker';

class Model extends Objection {
	static migrationUp(knex) {
		return knex.schema.createTable(this.tableName, (table) => {

			for (const key in this.column) {
				this.column[key].migration({ table, knex, column: key })
			}

			if (this.timestamp !== false) {
				table.timestamp('created_at').defaultTo(knex.fn.now())
				table.bigint('created_by', 14).nullable()
				table.timestamp('updated_at').defaultTo(knex.fn.now())
				table.bigint('updated_by', 14).nullable()
				table.timestamp('deleted_at').nullable()
				table.bigint('deleted_by', 14).nullable()
			}
		})

	}

	static migrationDown(knex) {
		return knex.schema.dropTable(this.tableName);
	}

	static async seeder(knex) {

		await knex(this.tableName).del()
		let data = []
		let number = this.seedRow ?? 10;

		for (let i = 1; i <= number; i++) {
			let seeds = {};
			let column = Object.assign({}, this.column)
			for (const key in column) {

				if (typeof column[key].seed == 'function') {
					let seed = column[key].seed(faker);
					seeds[key] = seed;
					column[key].value = seed;
				}
			}

			data.push(seeds);
		}

		await knex(this.tableName).insert(data);
	}

}

export default Model;