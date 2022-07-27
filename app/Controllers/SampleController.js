import { Users } from '@averoa/models';
import {
  DB, Log, Mail, Queue,
} from '@averoa/utilities';

class SampleController {
  async sampleMethod(req, res) {
    res.json({
      name: 'Averoa',
      version: '1.0.0',
    });
  }

  async sampleMethodView(req, res) {
    res.render('welcome', { name: 'Averoa' });
  }

  async sampleMethodModel(req, res) {
    const users = await Users.query();
    res.render('users', { data: users });
  }

  async sampleMethodModelPost(req, res) {
    const validation = Users.validation.call(Users, req.body);
    if (validation) return res.send(validation);

    const users = await Users.query();
    return res.send({ data: users });
  }

  async sampleMethodUtils(req, res) {
    // Log Utils
    Log.warn('test warning log');

    // Queue Utils
    Queue('test channel', { name: 'Averoa', version: '1.0.0' });

    // Email Utils
    await Mail.init()
      .from('info@averoa.com')
      .to('customer@mail.com')
      .subject('Welcome to Averoa')
      .html('email', { name: 'Averoa' })
    // .queue('Email Channel')
    // .text('text')
      .send();

    const users = await DB.select().from('users');
    res.send(users);
  }
}

export default new SampleController;
