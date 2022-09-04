class AppProvider {
  /**
   * [Configuration for expressjs(app) placed in the beginning before another instance]
   *
   * @param   {[object]}  app  [app description]
   *
   * @return  {[void]}
   */
  beginning(app) {
    // sample
    // app.use(bodyParser.json())
    // app.use(bodyParser.urlencoded({ extended: true }))
  }

  /**
   * [Configuration for expressjs(app) placed in the end after another instance]
   *
   * @param   {[object]}  app  [app description]
   *
   * @return  {[void]}
   */
  end(app) {
    // sample
    // app.use(bodyParser.json())
    // app.use(bodyParser.urlencoded({ extended: true }))
  }
}

export default new AppProvider;
