/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
 import { faker } from '@faker-js/faker';
const createData = () => ({
  room_name: faker.name.findName(),
  room_type: faker.random.numeric(),
  teacher_id: faker.random.numeric()
});
exports.seed = async function (knex) {
  // await knex('rooms').del()
  let data = [];
  const copies = 10;
  for(let i = 0; i < copies; i++) {
    data.push(createData())
  }

  await knex('rooms').insert(data);
};
