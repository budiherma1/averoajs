import { Crud, Gate } from '@averoa/utilities';
import { Teacher } from '#models';

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

  // routes/api.js: AuthMiddleware + EnsureEmailVerified. Only admins may choose
  // the owner (TeacherPolicy#changeOwner); anyone else becomes the owner.
  async create(req, res) {
    const option = await Gate.allows(req.user, 'changeOwner', Teacher) ? {} : { insert: { user_id: req.user.id } };
    send(res, await Crud.create('Teacher', req, option), 201);
  }

  async findAll(req, res) {
    send(res, await Crud.findAll('Teacher', req));
  }

  async findOne(req, res) {
    send(res, await Crud.findOne('Teacher', req));
  }

  // routes/api.js: can('update', ...) already allowed it and left the row in
  // res.locals.resource. Non-admins cannot move a teacher to another owner.
  async update(req, res) {
    const teacher = res.locals.resource;
    const option = !teacher || await Gate.allows(req.user, 'changeOwner', teacher) ? {} : { update: { user_id: teacher.user_id } };
    send(res, await Crud.update('Teacher', req, option));
  }

  async delete(req, res) {
    send(res, await Crud.delete('Teacher', req));
  }
}

export default new TeacherController();
