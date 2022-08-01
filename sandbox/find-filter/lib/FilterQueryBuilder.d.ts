/**
 * A wrapper around the objection.js model class
 * For 'where' you cannot have combinations of properties in a single AND condition
 * e.g.
 * {
 *   $and: {
 *     'a.b.c': 1,
 *     'b.e': 2
 *   },
 *   $or: [
 *      {}
 *   ]
 * }
 *
 * However, for 'require' conditions, this might be possible since ALL variables exist
 * in the same scope, since there's a join
 */
import { QueryBuilder, Transaction, Model as ObjModel } from 'objection';
import { FilterQueryBuilderOptions, OperationUtils, FilterQueryParams, BaseModel, RequireExpression, EagerExpression } from './types';
export default class FilterQueryBuilder<M extends BaseModel, K extends typeof ObjModel> {
    Model: K;
    _builder: QueryBuilder<M>;
    utils: OperationUtils<M>;
    /**
     * @param {Model} Model
     * @param {Transaction} trx
     * @param {Object} options.operators Custom operator handlers
     */
    constructor(Model: K, trx?: Transaction, options?: FilterQueryBuilderOptions<M>);
    build(params?: FilterQueryParams): QueryBuilder<M>;
    count(): Promise<number>;
    /**
     * @param {String} exp The objection.js eager expression
     */
    allowEager(eagerExpression: string): this;
}
export declare function applyEager<M extends BaseModel>(eager: string | EagerExpression, builder: QueryBuilder<M>, utils: OperationUtils<M>): void;
/**
 * Apply an entire require expression to the query builder
 * e.g. { "prop1": { "$like": "A" }, "prop2": { "$in": [1] } }
 * Do a first pass on the fields to create an objectionjs RelationExpression
 * This prevents joining tables multiple times, and optimizes number of joins
 * @param {Object} filter
 * @param {QueryBuilder} builder The root query builder
 */
export declare function applyRequire<M extends BaseModel>(filter: RequireExpression, builder: QueryBuilder<M>, utils: OperationUtils<M>): QueryBuilder<M>;
/**
 * Apply an entire where expression to the query builder
 * e.g. { "prop1": { "$like": "A" }, "prop2": { "$in": [1] } }
 * For now it only supports a single operation for each property
 * but in reality, it should allow an AND of multiple operations
 * @param {Object} filter The filter object
 * @param {QueryBuilder} builder The root query builder
 */
export declare function applyWhere<M extends BaseModel>(filter: RequireExpression, builder: QueryBuilder<M>, utils: OperationUtils<M>): QueryBuilder<M>;
/**
 * Order the result by a root model field or order related models
 * Related properties are ordered locally (within the subquery) and not globally
 * e.g. order = "name desc, city.country.name asc"
 * @param {String} order An comma delimited order expression
 * @param {QueryBuilder} builder The root query builder
 */
export declare function applyOrder<M extends BaseModel>(order: string, builder: QueryBuilder<M>): QueryBuilder<M>;
/**
 * Select a limited set of fields. Use dot notation to limit eagerly loaded models.
 * @param {Array<String>} fields An array of dot notation fields
 * @param {QueryBuilder} builder The root query builder
 */
export declare function applyFields<M extends BaseModel>(fields: string[], builder: QueryBuilder<M>): QueryBuilder<M>;
export declare function applyLimit<M extends BaseModel>(limit: number | undefined, offset: number | undefined, builder: QueryBuilder<M>): QueryBuilder<M>;
