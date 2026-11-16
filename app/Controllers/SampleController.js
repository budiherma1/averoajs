import {
  DB, Log, Mail, Queue,
} from '@averoa/utilities';
import { Users } from '#models';

class SampleController {
  async sampleMethod(req, res) {
    res.json({
      name: 'Averoa',
      version: '2.1.0',
    });
  }

  async sampleMethodView(req, res) {
    res.render('welcome', { name: 'Averoa' });
  }

  // public page: only first names reach the view, never emails or addresses
  async sampleMethodModel(req, res) {
    const users = await Users.query().select('id', 'first_name');
    res.render('users', { data: users });
  }

  // behind AuthMiddleware (routes/api.js): the list holds every user's email and address
  async sampleMethodModelPost(req, res) {
    const validation = Users.validation(req.body ?? {});
    if (validation?.status === false) return res.status(422).json(validation);

    // `password` (and `otp`) are hidden: they never reach the response
    const users = await Users.query();
    return res.json({ status: true, data: users });
  }

  async sampleMethodUtils(req, res) {
    const result = {};

    // Log Utils
    Log.warn('test warning log');

    // Queue Utils (needs RabbitMQ, see RABBITMQ_SERVER)
    try {
      await Queue('test channel', { name: 'Averoa', version: '2.0.0' });
      result.queue = 'sent';
    } catch (e) {
      result.queue = `skipped: ${e.message}`;
    }

    // Email Utils (needs SMTP, see MAIL_*)
    try {
      await Mail.init()
        .from('info@averoa.com')
        .to('customer@mail.com')
        .subject('Welcome to Averoa')
        .html('email', { name: 'Averoa' })
      // .queue('Email Channel')
      // .text('text')
        .send();
      result.mail = 'sent';
    } catch (e) {
      result.mail = `skipped: ${e.message}`;
    }

    // raw knex: select explicit columns, never the password hash
    result.users = await DB.select('id', 'first_name', 'last_name', 'email').from('users').whereNull('deleted_at');
    res.json(result);
  }
}

export default new SampleController();
