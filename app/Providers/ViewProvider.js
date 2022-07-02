class ViewProvider {
	inject(global) {
		global('testVariable', 'this is global variable')
		global('sayHello', (value='')=>{
			return `Hai ${value}, Greeting from ViewProvider`
		})
	}
}

export default new ViewProvider;