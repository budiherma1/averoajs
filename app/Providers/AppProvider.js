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
   * [extra express-session options, merged into the defaults of @averoa/core (e.g. a store)]
   *
   * @return  {[object|undefined]}
   */
  session() {
    // sample
    // return { store: new RedisStore({ client: redisClient }) };
  }

  /**
   * [Readiness checks for GET /ready. Receives the built-in checks of @averoa/core
   * ({ database }). Return them (changed or not), or `false` to disable /health and /ready.
   * A check is `async ({ signal, timeout }) => any`: throwing, rejecting, timing out
   * (READY_TIMEOUT) or returning `false` marks it down. `{ check, timeout, critical: false }`
   * reports a check without failing readiness]
   *
   * @param   {[object]}  checks  [built-in checks]
   *
   * @return  {[object|false]}
   */
  health(checks) {
    // sample
    // return { ...checks, redis: () => redisClient.ping() };
    return checks;
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
   * [Called on SIGTERM/SIGINT after /ready answered 503 (for SHUTDOWN_DELAY ms) and the
   * http server stopped accepting connections, before the DB and queue connections are
   * closed (bounded by SHUTDOWN_TIMEOUT)]
   *
   * @return  {[Promise<void>]}
   */
  async shutdown() {
    // sample
    // await io.close();
  }
}

export default new AppProvider();
