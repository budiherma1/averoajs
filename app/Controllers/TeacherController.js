import { Crud } from '@averoa/utilities';

// Crud.* answer { status: false, message } on failure; turn that into a 4xx
const send = (res, result, okStatus = 200) => res
  .status(result?.status === false ? 400 : okStatus)
  .json(result);

class TeacherController {
  async index(req, res) {
    res.render('teacher', { name: 'Teacher Page', title: 'Averoa' });
  }

  async create(req, res) {
    send(res, await Crud.create('Teacher', req), 201);
  }

  async findAll(req, res) {
    send(res, await Crud.findAll('Teacher', req));
  }

  async findOne(req, res) {
    send(res, await Crud.findOne('Teacher', req));
  }

  async update(req, res) {
    send(res, await Crud.update('Teacher', req));
  }

  async delete(req, res) {
    send(res, await Crud.delete('Teacher', req));
  }
}

export default new TeacherController();
