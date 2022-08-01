import { Rooms } from '@averoa/models';

export const up = Rooms.migrationUp.bind(Rooms);
export const down = Rooms.migrationDown.bind(Rooms);
