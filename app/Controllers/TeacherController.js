import { Crud } from '@averoa/utilities';

class TeacherController {
  async create(req, res) {
    const data = await Crud.create('Teacher', req);
    res.send(data);
  }

  async findAll(req, res) {
    const data = await Crud.findAll('Teacher', req);
    res.send(data);
  }

  async findOne(req, res) {
    const data = await Crud.findOne('Teacher', req, { relations: 'rooms' });
    res.send(data);
  }

  async update(req, res) {
    const data = await Crud.update('Teacher', req);
    res.send(data);
  }

  async delete(req, res) {
    const data = await Crud.delete('Teacher', req, { update: { deleted_by: 8 } });
    res.send(data);
  }
}

export default new TeacherController;
