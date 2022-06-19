// error: 0,
// warn: 1,
// info: 2,
// http: 3,
// verbose: 4,
// debug: 5,
// silly: 6
import winston from 'winston';

const logger = winston.createLogger({
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: './storages/logs/averoa.log' }),
	],
})

if (process.env.NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
		format: winston.format.simple(),
	}));
}

export default logger;