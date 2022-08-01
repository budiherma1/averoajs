import { Model } from 'objection';
import { Expression, ExpressionValue, PropertyOmissionPredicate, ExpressionObject, LogicalExpressionIteratorOptions, LogicalIterator } from './types';
export declare function hasSubExpression(lhs: string, rhs?: ExpressionValue): rhs is ExpressionObject;
/**
 * Given a logical expression return an array of all properties
 * @param {Object} expression
 * @param {Function} test A function to determine whether to include the property
 */
export declare function getPropertiesFromExpression(expression: Expression, test?: PropertyOmissionPredicate): string[];
/**
 * Returns a function which iterates an object composed of $or/$and operators
 * Values of $or/$and operators can be either objects or arrays
 * e.g. { $or: [...] }, { $or: { ... } }
 * If the input to the iterator is a primitive, e.g. { $or: [1,2,3] }
 * then the onLiteral callback will be called with (1), (2) and (3)
 * If the input is a non-logical operator e.g. { $or: [ { count: 5 } ] }
 * then the onExit callback will be called with ('count', 5)
 *
 * Valid logical expressions include:
 * { $gt: 1, $lt: 5 } - A non-logical expression, will be iterated (n=2) and
 *                      onExit called twice, once per operator/operand
 * { $or: [ ... ] } - An $or with an array of items (e.g. above)
 * { $or: { a: 1, b: 2 } } - An object,  will be 'arrayized' into an array
 * @param {Function} onExit A function to call once a non-logical operator is hit
 * @param {Function} onLiteral A function to call if the provided input is a primitive
 */
export declare function iterateLogicalExpression<M extends Model>({ onExit, // onExit(propertyOrOperator, value, builder)
onLiteral }: LogicalExpressionIteratorOptions<M>): LogicalIterator;
