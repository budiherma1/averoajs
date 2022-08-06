import {
  DB, Log, Mail, Queue, Fetch,
  FilterSearch,
} from '@averoa/utilities';
import { Teacher } from '@averoa/models';
import moment from 'moment';

class TeacherController {
  async create(req, res) {
    const data = await Teacher.query().insert({ ...req.dataReq });
    res.send('data');
  }

  async findAll(req, res) {
    // const data = await Teacher.filterSearch.call(Teacher, req);
    const data = await FilterSearch.knex(DB('teacher'), req);
    res.send(data);
  }

  async findOne(req, res) {
    const data = await Teacher.query().withGraphFetched('rooms').findById(req.params.id);
    res.json(data);
  }

  async update(req, res) {
    const data = await Teacher.query()
      .findById(req.params.id)
      .patch({ ...req.dataReq });
    res.send(`update ${req.params.id}`);
  }

  async delete(req, res) {
    const data = await Teacher.query()
      .findById(req.params.id)
      .patch({ deleted_at: moment().format('YYYY-MM-DD, hh:mm:ss') });
    res.send(`delete ${req.params.id}`);
  }
}

export default new TeacherController;

// let data = Teacher.query();
// if (Object.keys(req.query).length !== 0) {
//   data = data.where(req.query);
// }

// if (req.search) {
//   data = Teacher.search.apply(Teacher, [data, req.search]);
// }
