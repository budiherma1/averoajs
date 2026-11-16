import { PruneSoftDeletedJob } from '#jobs';

/**
 * The task schedule, run by `npm run schedule:run` (workers/scheduler.js).
 * Run ONE scheduler process per application. Jobs dispatched here run on
 * `npm run worker:jobs`; functions given to `schedule.call()` run in the
 * scheduler process itself.
 *
 * Frequencies: cron('* * * * *'), everyMinute(), everyFiveMinutes(), hourly(),
 * hourlyAt(15), daily(), dailyAt('03:00'), weeklyOn(1, '08:00'), monthly(), ...
 * Options: timezone('Asia/Jakarta'), withoutOverlapping(), name('...').
 * Default time zone: SCHEDULE_TIMEZONE, else the process time zone.
 *
 * @param {import('@averoa/utilities').Schedule} schedule
 */
export default function kernel(schedule) {
  // permanently delete rows soft-deleted more than 30 days ago
  schedule.job(PruneSoftDeletedJob, { days: 30 }).dailyAt('03:00');
}
