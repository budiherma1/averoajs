/**
 * The utils helpers are a set of common helpers to be passed around during
 * filter execution. It stores all default operators, custom operators and
 * functions which directly touch these operators.
 */
import { Model, ReferenceBuilder } from 'objection';
import { Relation, OperationOptions, OperationUtils, Expression } from './types';
/**
 * For a property "a.b.c", slice it into relationName: "a.b", "propertyName": "c" and
 * a fully qualified property "a:b.c"
 * @param {String} relatedProperty A dot notation property "a.b.c"
 * @param {String} delimiter A delimeter to use on the relation e.g. "." or ":"
 */
export declare function sliceRelation(relatedProperty: string, delimiter?: string, rootTableName?: string, fieldExpressionDelimiter?: string): Relation;
/**
 * Create operation application utilities with some custom options
 * If options.operators is specified
 * @param {Object} options.operators
 * @param {Function} options.onAggBuild A utility function to filter aggregations per model
 */
export declare function Operations<M extends Model>(options: OperationOptions<M>): OperationUtils<M>;
/**
 * Determines if a property is a [FieldExpression](https://vincit.github.io/objection.js/api/types/#type-fieldexpression)
 * @param property The property to check
 */
export declare function isFieldExpression(property: string): boolean;
/**
 * Builds a reference for a FieldExpression with support for fully-qualified properties
 * @param property a FieldExpression string
 */
export declare function getFieldExpressionRef(property: string): ReferenceBuilder;
/**
 * Casts a ReferenceBuilder instance to a type based on the type of the operand
 * @param reference A reference built from a filterExpression
 * @param operand the operand from which to infer the type
 */
export declare function castTo(reference: ReferenceBuilder, operand: Expression): ReferenceBuilder;
