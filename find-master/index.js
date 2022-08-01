'use strict';

import FindQueryBuilder from './lib/FindQueryBuilder.js';
import QueryParameter from './lib/QueryParameter.js';
import PropertyRef from './lib/PropertyRef.js';

const findQuery = (modelClass) => new FindQueryBuilder(modelClass);

/**
 * These export configurations enable JS and TS developers
 * to consume objection-find in whatever way best suits their needs.
 * Some examples of supported import syntax includes:
 * - `const findQuery from 'objection-find')`
 * - `const { findQuery } from 'objection-find')`
 * - `import * as findQuery from 'objection-find'`
 * - `import { findQuery } from 'objection-find'`
 * - `import findQuery from 'objection-find'`
 */
findQuery.findQuery = findQuery;
findQuery.FindQueryBuilder = FindQueryBuilder;
findQuery.QueryParameter = QueryParameter;
findQuery.PropertyRef = PropertyRef;
// findQuery.default = findQuery;
export default findQuery;
