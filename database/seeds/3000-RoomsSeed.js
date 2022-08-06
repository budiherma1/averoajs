import { Rooms, Teacher } from '@averoa/models';

export const seed = Rooms.seederCustom.bind(Rooms, 10, async () => {
  const teacher = await Teacher.query().limit(1).offset(Math.floor(Math.random() * 10));
  return { teacher_id: teacher[0].id };
});
