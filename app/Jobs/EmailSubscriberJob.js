import { startMailWorker } from '@averoa/utilities';

/**
 * Sample worker: consumes mails queued with Mail.init()...queue().send() from RabbitMQ
 * (RABBITMQ_SERVER) and delivers them with the transport of config/mail.js.
 * Failed deliveries are retried (maxRetries), malformed messages are dropped.
 *
 *   import { EmailSubscriberJob } from '#jobs';
 *   const worker = await EmailSubscriberJob();        // queue: MAIL_QUEUE or 'mail'
 *   // ... await worker.stop();
 *
 * @param {{ queue?: string, prefetch?: number, maxRetries?: number }} [options]
 * @returns {Promise<{ queue: string, consumerTag: string, stop: () => Promise<void> }>}
 */
const exec = (options = {}) => startMailWorker(options);

export default exec;
