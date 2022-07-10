class AppProvider {
	beginning(app) {
		console.log('AppProvider beginning')
	}

	end(app) {
		console.log('AppProvider end')
	}
}

export default new AppProvider;