class ViewProvider {
  /**
   * [Global variable for view]
   *
   * @return  {[object]}  [object of global variable used in view]
   */
  global() {
    return {
      testVariable: 'this is global variable',
      sayHello: (value = '') => `Hai ${value}, Greeting from ViewProvider`,
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
        }],
    };
  }
}

export default new ViewProvider;
