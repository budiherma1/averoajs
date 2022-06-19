export default {
	amqp: process.env.RABBITMQ_SERVER,
	queue: "averoa-mail",
  
	server: {
	  port: process.env.MAIL_PORT,
	  host: process.env.MAIL_HOST,
	  username: process.env.MAIL_USERNAME,
	  password: process.env.MAIL_PASSWORD,
	}
  }
  