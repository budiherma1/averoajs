import { Rooms, Teacher } from '@averoa/models';
import { DB } from '@averoa/utilities';
import { Model } from 'objection';

Model.knex(DB);
// export const seed = Rooms.seeder.bind(Rooms, 10);
export const seed = Rooms.seederCustom.bind(Rooms, 10, async () => {
  console.log(33333);
  const teacher = await Teacher.query().limit(1).offset(Math.floor(Math.random() * 10));
  console.log(44444);
  console.log(teacher);
  return { teacher_id: teacher[0].id };
});
