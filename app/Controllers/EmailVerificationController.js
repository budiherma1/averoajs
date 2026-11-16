import AuthService from '#app/Services/AuthService.js';

const send = (res, result) => {
  const { statusCode, ...body } = result;
  if (body.retry_after) res.set('Retry-After', String(body.retry_after));
  return res.status(statusCode ?? (body.status === false ? 400 : 200)).json(body);
};

class EmailVerificationController {
  /**
   * GET /api/auth/verify-email?token=...  or  POST /api/auth/verify-email { token }
   * -> 200, or 400 for an invalid/expired/used token
   */
  async verify(req, res) {
    const token = req.method === 'GET' ? req.query?.token : req.body?.token;
    if (typeof token !== 'string' || token === '') {
      return res.status(422).json({ status: false, data: { column: 'token', message: 'required' } });
    }
    return send(res, await AuthService.verifyEmail(token));
  }

  /** POST /api/auth/resend-verification (behind AuthMiddleware) -> 200, or 429 with Retry-After */
  async resend(req, res) {
    return send(res, await AuthService.resendVerification(req.user));
  }
}

export default new EmailVerificationController();
