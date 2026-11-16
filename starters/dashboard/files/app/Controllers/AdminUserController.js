import { Users } from '#models';

const PER_PAGE = 20;

class AdminUserController {
  /** GET /dashboard/users?q=&page=: active users, newest first, searchable by name or email. */
  async index(req, res) {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const query = Users.query().whereNull('deleted_at');
    if (q) {
      // case-insensitive on every database (lower() on both sides); "!" escapes LIKE
      // wildcards, so a search for "50%" matches the text "50%"
      const like = `%${q.toLowerCase().replace(/[!%_]/g, '!$&')}%`;
      query.where((w) => w
        .whereRaw("lower(first_name) like ? escape '!'", [like])
        .orWhereRaw("lower(last_name) like ? escape '!'", [like])
        .orWhereRaw("lower(email) like ? escape '!'", [like]));
    }
    const result = await query
      .select('id', 'first_name', 'last_name', 'email', 'email_verified_at', 'is_admin', 'created_at')
      .orderBy('id', 'desc')
      .page(page - 1, PER_PAGE);

    const pages = Math.max(1, Math.ceil(result.total / PER_PAGE));
    const link = (n) => `/dashboard/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`;
    const users = result.results.map((u) => ({
      name: [u.first_name, u.last_name].filter(Boolean).join(' '),
      email: u.email,
      admin: Number(u.is_admin) === 1,
      verified: Boolean(u.email_verified_at),
      joined: u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : '',
    }));
    res.render('dashboard/users', {
      title: 'Users',
      users,
      total: result.total,
      q,
      page,
      pages,
      previous: page > 1 ? link(page - 1) : null,
      next: page < pages ? link(page + 1) : null,
    });
  }
}

export default new AdminUserController();
