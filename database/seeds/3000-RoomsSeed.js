import { Rooms } from '#models';

export async function seed(knex) {
  // read teacher ids through the seeder's own knex (not the Objection-bound one)
  const teacherIds = (await knex('teacher').select('id')).map((row) => row.id);
  if (!teacherIds.length) return;

  await Rooms.seederCustom(10, async () => ({
    teacher_id: teacherIds[Math.floor(Math.random() * teacherIds.length)],
  }), knex);
}
