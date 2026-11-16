import AuthService from '#app/Services/AuthService.js';

const send = (res, result) => {
  const { statusCode, ...body } = result;
  return res.status(statusCode ?? (body.status === false ? 400 : 200)).json(body);
};

class PasswordResetController {
  /**
   * POST /api/auth/forgot-password  { email }
   * -> always 200 with the same message (422 only for a malformed address), so the
   *    answer never tells whether an account exists
   */
  async forgot(req, res) {
    return send(res, AuthService.forgotPassword(req.body?.email));
  }

  /** POST /api/auth/reset-password  { token, password } -> 200, or 400 for a bad token */
  async reset(req, res) {
    const { token, password } = req.body ?? {};
    return send(res, await AuthService.resetPassword(token, password));
  }
}

export default new PasswordResetController();
