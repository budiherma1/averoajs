import { Job, DB, Log } from '@averoa/utilities';
import * as modelExports from '#models';

const models = { ...modelExports };

/**
 * Permanently deletes rows that were soft-deleted (`deleted_at` set by Crud.delete)
 * more than `days` days ago, in every model with timestamps (or the ones named in
 * `models`). Scheduled daily in app/Console/Kernel.js.
 *
 *   await PruneSoftDeletedJob.dispatch({ days: 30, models: ['Teacher'] });
 */
class PruneSoftDeletedJob extends Job {
  static tries = 3;

  static backoff = 60_000;

  static timeout = 10 * 60_000;

  async handle({ days = 30, models: only } = {}) {
    const keepDays = Number(days);
    if (!Number.isInteger(keepDays) || keepDays < 1) throw new Error(`invalid days: ${days}`);
    const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);

    // names are looked up in #models, never used as table names directly
    const names = only ?? Object.keys(models);
    const pruned = {};
    for (const name of names) {
      const Model = Object.hasOwn(models, name) ? models[name] : undefined;
      if (!Model) throw new Error(`unknown model: ${name}`);
      if (Model.timestamp === false) continue; // no soft delete: no deleted_at column
      pruned[name] = await DB(Model.tableName).whereNotNull('deleted_at').where('deleted_at', '<', cutoff).del();
    }
    Log.info(`PruneSoftDeletedJob: ${JSON.stringify(pruned)} row(s) older than ${keepDays} days deleted`);
    return pruned;
  }
}

export default PruneSoftDeletedJob;
