
import { Tasks } from '../globals.mjs'

export const method = 'GET';
export const path = '/status/:id';
export const Process = async (c) => {
  const { id } = c.req.param();
  const task = Tasks.get(id);

  if (!task) return c.json({ error: 'Task not found' }, 404);

  return c.json(task);
};
