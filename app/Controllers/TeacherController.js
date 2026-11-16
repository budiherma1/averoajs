import { Crud } from '@averoa/utilities';

// Crud.* resolve { status: false, message, statusCode } on failure: 400 invalid
// filter, 404 unknown or soft-deleted id, 422 validation, 500 database error.
// Success results have no statusCode and get okStatus (a failure without one, 400).
const send = (res, result, okStatus = 200) => res
  .status(result?.statusCode ?? (result?.status === false ? 400 : okStatus))
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
