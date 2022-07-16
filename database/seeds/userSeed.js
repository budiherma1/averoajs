/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
 import { faker } from '@faker-js/faker';
const createData = () => ({
      name: faker.name.firstName(),
      address: faker.address.streetAddress(true),
      email: faker.internet.email(),
});
export let seed = async function (knex) {
  await knex('users').del()
  let data = [];
  const copies = 10;
  for(let i = 0; i < copies; i++) {
    data.push(createData())
  }

  await knex('users').insert(data);
};
