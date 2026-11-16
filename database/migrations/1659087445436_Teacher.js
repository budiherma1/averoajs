import { Teacher } from '#models';

export const up = Teacher.migrationUp.bind(Teacher);
export const down = Teacher.migrationDown.bind(Teacher);
