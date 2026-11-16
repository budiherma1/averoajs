export default {
  amqp: process.env.RABBITMQ_SERVER,
  // default queue of jobs that set no `static queue`
  jobsQueue: process.env.JOBS_QUEUE || 'jobs',
};
