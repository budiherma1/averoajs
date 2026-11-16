import {
  Job, Mail, Log, exponentialBackoff,
} from '@averoa/utilities';
import { Users } from '#models';

/**
 * Sends the welcome mail to a user. Dispatch it after a sign-up:
 *
 *   await SendWelcomeEmailJob.dispatch({ userId: user.id });
 *
 * The payload carries the id, not the user: the worker reads the current row,
 * and a user deleted in the meantime gets no mail.
 */
class SendWelcomeEmailJob extends Job {
  static tries = 5;

  static backoff = exponentialBackoff(10_000, 10 * 60_000); // 10 s, 20 s, 40 s, 80 s

  static timeout = 30_000;

  async handle({ userId } = {}) {
    if (userId == null) return { sent: false };
    const user = await Users.query().findById(userId).whereNull('deleted_at');
    if (!user?.email) return { sent: false };

    await Mail.init()
      .from(process.env.MAIL_FROM || 'no-reply@localhost')
      .to(user.email)
      .subject('Welcome to Averoa')
      .html('emails/welcome', { name: user.first_name, app: 'Averoa' })
      .text(`Welcome, ${user.first_name}! Your Averoa account is ready.`)
      .send();
    return { sent: true };
  }

  async failed({ userId } = {}, error) {
    // the record is also kept in the `<queue>.failed` queue; `npm run queue:retry` re-queues it
    Log.error(`SendWelcomeEmailJob: giving up on user ${userId}: ${error.message}`);
  }
}

export default SendWelcomeEmailJob;
