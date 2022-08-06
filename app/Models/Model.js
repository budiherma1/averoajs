import { Model as Objection } from 'objection';
import { faker } from '@faker-js/faker';
import validator from 'validator';
import { FilterSearch } from '@averoa/utilities';

class Model extends Objection {
  static migrationUp(knex) {
    return knex.schema.createTable(this.tableName, (table) => {
      for (const key in this.column) {
        if (typeof this.column[key].migration === 'function') {
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
      const custom = await cb();
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

  static validation(request, type = 'create') {
    const validationResult = [];
    //
    if (type === 'create') {
      for (const col in this.column) {
        if (this.column[col].flag?.required !== false && !request[col]) {
          return { status: false, data: { column: col, message: 'required' } };
        }
      }
    }
    //
    for (const key in request) {
      if (key in this.column) {
        const vColumn = [];

        if (type !== 'create') {
          if (this.column[key].flag.required !== false) {
            vColumn.push('required');
          }
        }

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
            const result = { status: false, data: { column: key, message: vColumn } };
            return result;
          }
        }
      }
    }

    if (validationResult.length) {
      return { status: false, data: validationResult };
    }

    return { status: true };
  }

  static validationRouter(req, res, next, additional = {}) {
    const validationResult = [];
    const data = additional.type === 'multipart' ? req.body : req.query;
    //
    if (additional.post) {
      for (const col in this.column) {
        if (this.column[col].flag?.required !== false && !data[col]) {
          return res.send({ status: false, data: { column: col, message: 'required' } });
        }
      }
    }
    //
    for (const key in data) {
      if (key in this.column) {
        const vColumn = [];

        if (!additional.post) {
          if (this.column[key].flag.required !== false && !data[key]) {
            vColumn.push('required');
          }
        }

        const allValidation = typeof this.column[key].validation === 'object' ? this.column[key].validation : [];
        if (allValidation.length) {
          for (const v of allValidation) {
            if (typeof v.run === 'function') {
              const validation = v.run({ validator, value: `${data[key]}` });
              if (!validation) {
                vColumn.push(v.msg);
                // return { status: false, data: { column: key, message: v.message } }
              }
            }
          }
        }

        if (vColumn.length) {
          // validationResult.push({ column: key, message: vColumn })
          const result = { status: false, data: { column: key, message: vColumn } };
          return res.send(result);
        }
      }
    }
    const result = { status: false, data: validationResult };
    if (validationResult.length) {
      return res.send(result);
    }
    return next();
  }

  static sanitizeRequest(req, res, next, additional = {}) {
    const sanitized = {};

    const data = additional.type === 'multipart' ? req.body : req.query;

    for (const key in data) {
      if (key in this.column) {
        sanitized[key] = data[key];
      }
    }

    if (additional.type === 'multipart') {
      req.body = sanitized;
    } else {
      req.query = sanitized;
    }

    return next();
  }

  static search(query, search) {
    for (const key in this.column) {
      if (this.column[key].flag?.search !== false) {
        query = query.orWhere(key, 'like', `%${search}%`);
      }
    }
    return query;
  }

  static mapRequest(req, res, next, additional = {}) {
    if (additional?.type === 'multipart') {
      req.dataReq = { ...req.body };
    } else {
      req.dataReq = { ...req.query };
    }
    return next();
  }

  static filterSearch(filter) {
    return FilterSearch.model(this, filter);
  }

  static async checkParamId(req, res, next) {
    if (req.params?.id) {
      const count = await this.query().findById(req.params.id).count();
      if (count['count(*)'] > 0) {
        return next();
      }
      return res.send({ status: false, message: `ID ${req.params.id} doesn't exist` });
    }
    return next();
  }
}

export default Model;
