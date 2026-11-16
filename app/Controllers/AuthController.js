import jwt from 'jsonwebtoken';
import { UserRepository } from '#repositories';
import { tokenSecret, JWT_ALGORITHM } from '#app/Strategies/JwtStrategy.js';

class AuthController {
  /**
   * POST /api/auth/login  { email, password }
   * -> 200 { status: true, data: { token, type: 'Bearer', expires_in } }
   */
  async login(req, res) {
    const { email, password } = req.body ?? {};
    for (const [column, value] of [['email', email], ['password', password]]) {
      if (typeof value !== 'string' || value === '') {
        return res.status(422).json({ status: false, data: { column, message: 'required' } });
      }
    }

    const user = await UserRepository.findByCredentials(email, password);
    if (!user) {
      return res.status(401).json({ status: false, message: 'Invalid email or password' });
    }

    const expiresIn = process.env.TOKEN_EXPIRES_IN || '1h';
    const token = jwt.sign({ id: user.id }, tokenSecret(), { algorithm: JWT_ALGORITHM, expiresIn });
    return res.json({ status: true, data: { token, type: 'Bearer', expires_in: expiresIn } });
  }

  /** GET /api/auth/me (behind AuthMiddleware) */
  async me(req, res) {
    return res.json({ status: true, data: req.user });
  }
}

export default new AuthController();
