// export default {
// 	amqp: process.env.RABBITMQ_SERVER,
// 	queue: "averoa-mail",
  
// 	server: {
// 	  port: process.env.MAIL_PORT,
// 	  host: process.env.MAIL_HOST,
// 	  username: process.env.MAIL_USERNAME,
// 	  password: process.env.MAIL_PASSWORD,
// 	}
//   }
  
export default {
	host: process.env.MAIL_HOST,
	port: process.env.MAIL_PORT,
	secure: process.env.NODE_ENV == 'production' ? true : false, // true for 465, false for other ports
	auth: {
		user: process.env.MAIL_USERNAME, // generated ethereal user
		pass: process.env.MAIL_PASSWORD, // generated ethereal password
	},
}
  