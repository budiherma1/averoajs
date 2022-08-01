/**
 * Takes an array of fully qualified field names, and concatenates them into a single
 * objection.js relation expression. This avoids joining the same table multiple times
 * e.g. fields = [ 'schema.schemaAttributes.name', 'schema.organization.id'] will result in
 * expression = '[schema.[schemaAttributes,organization]]'
 * @param {Array<String>} fields A list of fields
 */
export declare function createRelationExpression(fields: string[]): string;
