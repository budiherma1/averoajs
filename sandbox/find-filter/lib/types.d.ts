import { QueryBuilder, Model, ReferenceBuilder } from 'objection';
export interface Relation {
    propertyName: string;
    relationName: string;
    fullyQualifiedProperty: string;
}
export declare type Primitive = number | string | null;
export interface BaseModel extends Model {
    count?: number;
}
export declare type OperationHandler<M extends Model> = (property: string | ReferenceBuilder, operand: Expression | ExpressionValue, builder: QueryBuilder<M>) => QueryBuilder<M>;
export declare type Operators<M extends Model> = {
    [f: string]: OperationHandler<M>;
};
export declare type AggregationCallback = <M extends Model, K extends typeof Model>(RelatedModelClass: K) => QueryBuilder<M>;
export interface OperationOptions<M extends Model> {
    operators: Operators<M>;
    onAggBuild: AggregationCallback;
}
export interface OperationUtils<M extends Model> {
    applyPropertyExpression: OperationHandler<M>;
    onAggBuild: AggregationCallback;
}
export declare type ExpressionValue = Expression | string | number;
export declare type ExpressionObject = {
    [key: string]: ExpressionValue;
};
export declare type Expression = ExpressionObject | ExpressionObject[] | string | number;
export declare type PropertyOmissionPredicate = (propertyName?: string) => boolean;
export declare type Item = {
    [x: string]: unknown;
};
export declare type LogicalIteratorExitFunction<M extends Model> = (operator: string | ReferenceBuilder, value: Primitive, subQueryBuilder: QueryBuilder<M>) => void;
export declare type LogicalIteratorLiteralFunction<M extends Model> = (value: Primitive, subQueryBuilder: QueryBuilder<M>) => void;
export interface LogicalExpressionIteratorOptions<M extends Model> {
    onExit: LogicalIteratorExitFunction<M>;
    onLiteral: LogicalIteratorLiteralFunction<M>;
}
export interface FilterQueryBuilderOptions<M extends Model> {
    operators?: Operators<M>;
    onAggBuild?: AggregationCallback;
}
export interface FilterQueryParams {
    fields?: string[];
    limit?: number;
    offset?: number;
    order?: string;
    eager?: string | EagerExpression;
    where?: Expression;
    require?: Expression;
}
export interface AggregationConfig {
    relation?: string;
    $where?: Expression;
    distinct?: boolean;
    alias?: string;
    type?: string;
    field?: string;
}
export declare type EagerExpression = {
    $where?: Expression;
    $aggregations?: AggregationConfig[];
};
export declare type RequireExpression = Expression;
export declare type StringFormatter = (s: string) => string;
export declare type LogicalIterator = <M extends Model>(expression: Expression, builder: QueryBuilder<M>, or?: boolean, propertyTransform?: StringFormatter) => void;
