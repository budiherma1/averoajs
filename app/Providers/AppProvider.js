class AppProvider {
	// Configuration for expressjs(app) placed in the beginning before another instance
	beginning(app) {
		// sample
		// app.use(bodyParser.json())
		// app.use(bodyParser.urlencoded({ extended: true }))
	}

	// Configuration for expressjs(app) placed in the end after another instance
	end(app) {
		// sample
		// app.use(bodyParser.json())
		// app.use(bodyParser.urlencoded({ extended: true }))
	}
}

export default new AppProvider;