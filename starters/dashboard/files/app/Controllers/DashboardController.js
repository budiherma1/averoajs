import { Gate } from '@averoa/utilities';
import { Users } from '#models';

const DAY = 24 * 60 * 60 * 1000;

const count = async (query) => Number((await query.count({ n: '*' }).first())?.n ?? 0);

class DashboardController {
  /** GET /dashboard: user numbers and the newest accounts for admins, a welcome for others. */
  async index(req, res) {
    if (!(await Gate.allows(req.user, 'admin'))) {
      return res.render('dashboard/home', { title: 'Overview', stats: null, recent: [] });
    }
    const active = () => Users.query().whereNull('deleted_at');
    const [total, verified, admins, lastWeek, recent] = await Promise.all([
      count(active()),
      count(active().whereNotNull('email_verified_at')),
      count(active().where('is_admin', true)),
      count(active().where('created_at', '>=', new Date(Date.now() - 7 * DAY))),
      active().select('id', 'first_name', 'last_name', 'email', 'created_at').orderBy('id', 'desc').limit(5),
    ]);
    return res.render('dashboard/home', {
      title: 'Overview',
      stats: {
        total, verified, admins, lastWeek,
      },
      recent,
    });
  }
}

export default new DashboardController();
