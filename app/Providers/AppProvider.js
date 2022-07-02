class AppProvider {
	beginning(app) {
		console.log('provider beginning')
	}

	end(app) {
		console.log('provider end')
	}
}

export default new AppProvider;