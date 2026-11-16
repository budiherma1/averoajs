import { DB } from '@averoa/utilities';
import { Users } from '#models';
import { PasswordHelper } from '#helpers';
import { RefreshTokenRepository, UserRepository } from '#repositories';

// fixed messages for ?status=...: nothing from the query string is shown as is
const STATUS = {
  saved: 'Your profile was saved.',
  password: 'Your password was changed. Sign in again on your other devices.',
};

const field = (body, name) => (typeof body?.[name] === 'string' ? body[name] : '');
const messageOf = (validation) => [].concat(validation.data.message).join(', ');

class ProfileController {
  /** GET /dashboard/profile */
  edit(req, res) {
    res.render('dashboard/profile', {
      title: 'Profile',
      status: STATUS[req.query.status] ?? null,
      errors: {},
      values: { first_name: req.user.first_name, last_name: req.user.last_name ?? '' },
    });
  }

  /** POST /dashboard/profile: first and last name, checked with the Users model rules. */
  async update(req, res) {
    const values = {
      first_name: field(req.body, 'first_name').trim(),
      last_name: field(req.body, 'last_name').trim(),
    };
    const validation = Users.validation(values, 'update');
    if (validation?.status === false) {
      return res.status(422).render('dashboard/profile', {
        title: 'Profile',
        status: null,
        values,
        errors: { [validation.data.column]: messageOf(validation) },
      });
    }
    await Users.query().findById(req.user.id)
      .patch({ ...values, last_name: values.last_name || null });
    return res.redirect('/dashboard/profile?status=saved');
  }

  /**
   * POST /dashboard/password: needs the current password. Every API token of the
   * user stops working (token_version + 1, refresh tokens revoked); this session stays.
   */
  async password(req, res) {
    const current = field(req.body, 'current_password');
    const next = field(req.body, 'new_password');
    const values = { first_name: req.user.first_name, last_name: req.user.last_name ?? '' };
    const fail = (errors) => res.status(422).render('dashboard/profile', {
      title: 'Profile', status: null, values, errors,
    });

    if (!(await UserRepository.findByCredentials(req.user.email, current))) {
      return fail({ current_password: 'is not correct' });
    }
    const validation = Users.validation({ password: next }, 'update');
    if (validation?.status === false) return fail({ new_password: messageOf(validation) });
    if (next !== field(req.body, 'new_password_confirmation')) return fail({ new_password: 'does not match the confirmation' });

    const hash = await PasswordHelper.hash(next);
    await DB.transaction(async (trx) => {
      await UserRepository.updatePasswordHash(req.user.id, hash, trx);
      await RefreshTokenRepository.revokeAllForUser(req.user.id, 'password_change', trx);
    });
    return res.redirect('/dashboard/profile?status=password');
  }
}

export default new ProfileController();
