class ViewProvider {
	inject(view) {
		view.global('testVariable', 'this is global variable')
		view.global('sayHello', (value='')=>{
			return `Hai ${value}, Greeting from ViewProvider`
		})
		view.global('menu', [
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
		  ])
	}
}

export default new ViewProvider;