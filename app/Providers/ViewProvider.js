class ViewProvider {
	// Global variable for view
	global() {
		return {
			testVariable: 'this is global variable',
			sayHello: (value='') => {
				return `Hai ${value}, Greeting from ViewProvider`
			},
			menu: [
				{
				  url: '/',
				  text: 'Home',
				},
				{
				  url: '/about',
				  text: 'About',
				},
				{
				  url: '/contact',
				  text: 'Contact',
				},
			  ]
		}
	}
}

export default new ViewProvider;