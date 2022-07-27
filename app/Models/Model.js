import { Model as Objection } from 'objection';
import { faker } from '@faker-js/faker';
import validator from 'validator';

class Model extends Objection {
  static migrationUp(knex) {
    return knex.schema.createTable(this.tableName, (table) => {
      for (const key in this.column) {
        if (this.column[key].migration === 'function') {
          this.column[key].migration({ table, knex, column: key });
        }
      }

      if (this.timestamp !== false) {
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.bigint('created_by', 14).nullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.bigint('updated_by', 14).nullable();
        table.timestamp('deleted_at').nullable();
        table.bigint('deleted_by', 14).nullable();
      }
    });
  }

  static migrationDown(knex) {
    return knex.schema.dropTable(this.tableName);
  }

  static async seeder() {
    const knex = arguments[arguments.length - 1];
    const number = typeof arguments[0] === 'number' ? arguments[0] : 1;
    await knex(this.tableName).del();
    const data = [];

    for (let i = 1; i <= number; i++) {
      const seeds = {};
      const column = { ...this.column };

      for (const key in column) {
        if (typeof column[key].seed === 'function') {
          const seed = column[key].seed(faker);
          seeds[key] = seed;
          column[key].value = seed;
        }
      }

      data.push(seeds);
    }

    await knex(this.tableName).insert(data);
  }

  static async seederCustom() {
    const [number, cb, knex] = arguments;

    await knex(this.tableName).del();
    const data = [];

    for (let i = 1; i <= number; i++) {
      const seeds = {};
      const column = { ...this.column };
      const custom = cb();
      for (const key in column) {
        if (key in custom) {
          seeds[key] = custom[key];
          column[key].value = custom[key];
        } else if (typeof column[key].seed === 'function') {
          const seed = column[key].seed(faker);
          seeds[key] = seed;
          column[key].value = seed;
        }
      }

      data.push(seeds);
    }

    await knex(this.tableName).insert(data);
  }

  static validation(request) {
    const validationResult = [];
    for (const key in request) {
      if (key in this.column) {
        const vColumn = [];
        const allValidation = typeof this.column[key].validation === 'object' ? this.column[key].validation : [];
        if (allValidation.length) {
          for (const v of allValidation) {
            if (typeof v.run === 'function') {
              const validation = v.run({ validator, value: `${request[key]}` });
              if (!validation) {
                vColumn.push(v.msg);
                // return { status: false, data: { column: key, message: v.message } }
              }
            }
          }

          if (vColumn.length) {
            // validationResult.push({ column: key, message: vColumn })
            return { status: false, data: { column: key, message: vColumn } };
          }
        }
      }
    }
    if (validationResult.length) {
      return { status: false, data: validationResult };
    }
    return { status: true };
  }
}

export default Model;
