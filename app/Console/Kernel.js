import { PruneSoftDeletedJob } from '#jobs';
import { RefreshTokenRepository, UserTokenRepository } from '#repositories';

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

  // every refresh adds a refresh_tokens row: drop expired refresh, reset and
  // verification tokens
  schedule.call(async () => {
    await RefreshTokenRepository.deleteExpired();
    await UserTokenRepository.deleteExpired();
  }, 'delete expired auth tokens').dailyAt('03:30').withoutOverlapping();
}
