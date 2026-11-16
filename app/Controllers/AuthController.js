import AuthService from '#app/Services/AuthService.js';

// Service results carry the HTTP status of a failure (like Crud results).
const send = (res, result, okStatus = 200) => {
  const { statusCode, ...body } = result;
  if (body.retry_after) res.set('Retry-After', String(body.retry_after));
  return res.status(statusCode ?? (body.status === false ? 400 : okStatus)).json(body);
};

const required = (res, column) => res.status(422).json({ status: false, data: { column, message: 'required' } });

class AuthController {
  /**
   * POST /api/auth/login  { email, password }
   * -> 200 { status: true, data: { token, type: 'Bearer', expires_in,
   *                                refresh_token, refresh_expires_in } }
   */
  async login(req, res) {
    const { email, password } = req.body ?? {};
    for (const [column, value] of [['email', email], ['password', password]]) {
      if (typeof value !== 'string' || value === '') return required(res, column);
    }
    return send(res, await AuthService.login(email, password));
  }

  /**
   * POST /api/auth/register  { first_name, last_name?, email, password, address? }
   * -> 201 { status: true, data: { user, token, ..., refresh_token, ... } }
   *    and a verification email
   */
  async register(req, res) {
    return send(res, await AuthService.register(req.body ?? {}), 201);
  }

  /** POST /api/auth/refresh  { refresh_token } -> 200 a new token pair (the old one is revoked) */
  async refresh(req, res) {
    const token = req.body?.refresh_token;
    if (typeof token !== 'string' || token === '') return required(res, 'refresh_token');
    return send(res, await AuthService.refresh(token));
  }

  /** POST /api/auth/logout (behind AuthMiddleware): ends the current session */
  async logout(req, res) {
    return send(res, await AuthService.logout(req.auth));
  }

  /** POST /api/auth/logout-all (behind AuthMiddleware): ends every session of the user */
  async logoutAll(req, res) {
    return send(res, await AuthService.logoutAll(req.user));
  }

  /** GET /api/auth/me (behind AuthMiddleware) */
  async me(req, res) {
    return res.json({ status: true, data: req.user });
  }
}

export default new AuthController();
