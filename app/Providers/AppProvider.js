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
    // app.use(express.json())
    // app.use(express.urlencoded({ extended: true }))
  }

  /**
   * [helmet options. Receives the defaults of @averoa/core (CSP: local assets + Google Fonts).
   * Return them (changed or not), or `false` to disable helmet]
   *
   * @param   {[object]}  defaults  [default helmet options]
   *
   * @return  {[object|false]}
   */
  helmet(defaults) {
    // sample: allow scripts from a CDN
    // defaults.contentSecurityPolicy.directives['script-src'].push('https://cdn.jsdelivr.net');
    return defaults;
  }

  /**
   * [extra express-session options, merged into the defaults of @averoa/core. The store comes
   * from SESSION_STORE (memory | redis); a `store` returned here wins over it]
   *
   * @return  {[object|undefined]}
   */
  session() {
    // sample
    // return { name: 'app.sid', cookie: { maxAge: 24 * 60 * 60 * 1000 } };
  }

  /**
   * [options of the global rate limiter. Receives the defaults of @averoa/core
   * ({ path: '/api', name: 'global', windowMs, limit } from RATE_LIMIT_*).
   * Return them (changed or not), or `false` to disable the global limiter]
   *
   * @param   {[object]}  defaults  [default rate limiter options]
   *
   * @return  {[object|false]}
   */
  rateLimit(defaults) {
    // sample: don't count health checks
    // return { ...defaults, skip: (req) => req.path === '/health' };
    return defaults;
  }

  /**
   * [OpenAPI document served at GET /api/openapi.json
   * (OPENAPI_ENABLED, default on in development/test only).
   * Receives the generated document; change it and return it]
   *
   * @param   {[object]}  doc  [OpenAPI 3.1 document]
   *
   * @return  {[object]}
   */
  openapi(doc) {
    doc.info.title = 'AveroaJS API';
    // sample
    // doc.servers = [{ url: 'https://api.example.com' }];
    return doc;
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
    // app.use((req, res) => res.status(404).render('404'))
  }

  /**
   * [Configuration for expressjs(app) placed after express server started]
   *
   * @param   {[object]}  server  [server server instance of express]
   *
   * @return  {[void]}
   */
  server(server) {
    // sample
    // const io = new Server(server);
  }

  /**
   * [Called on SIGTERM/SIGINT after the http server stopped accepting connections,
   * before the DB and queue connections are closed (bounded by SHUTDOWN_TIMEOUT)]
   *
   * @return  {[Promise<void>]}
   */
  async shutdown() {
    // sample
    // await io.close();
  }
}

export default new AppProvider();
