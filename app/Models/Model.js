import { Model as Objection } from 'objection';
import { faker } from '@faker-js/faker';
import validator from 'validator';

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

	static async seeder() {

		let knex = arguments[arguments.length - 1];
		let number = typeof arguments[0] === 'number' ? arguments[0] : 1;
		await knex(this.tableName).del()
		let data = []

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

	static async seederCustom() {

		let number;
		let cb;
		let knex;

		number = arguments[0];
		cb = arguments[1];
		knex = arguments[2];

		await knex(this.tableName).del()
		let data = []

		for (let i = 1; i <= number; i++) {
			let seeds = {};
			let column = Object.assign({}, this.column)
			let custom = cb();
			for (const key in column) {

				if (key in custom) {
					seeds[key] = custom[key];
					column[key].value = custom[key];
				} else {
					if (typeof column[key].seed == 'function') {
						let seed = column[key].seed(faker);
						seeds[key] = seed;
						column[key].value = seed;
					}
				}

			}

			data.push(seeds);
		}

		await knex(this.tableName).insert(data);
	}

	static validation(request) {
		let validationResult = [];
		for (let key in request) {
			if (key in this.column) {
				let vColumn = [];
				let allValidation = typeof this.column[key].validation === 'object' ? this.column[key].validation : [];
				if (allValidation.length) {

					for (let v of allValidation) {

						let validation = v.validator({ validator, value: request[key] + '' })
						if (!validation) {
							vColumn.push(v.message);
							// return { status: false, data: { column: key, message: v.message } } // showing single validation
						}
					}

					if (vColumn.length) {
						// validationResult.push({ column: key, message: vColumn }) // showing validation of all columns
						return { status: false, data: { column: key, message: vColumn } }
					}

				}
			}
		}
		if (validationResult.length) {
			return { status: false, data: validationResult }
		} else {
			return { status: true };
		}
	}

}

export default Model;