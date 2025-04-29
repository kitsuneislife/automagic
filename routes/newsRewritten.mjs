
import DatabaseHandler from '../services/database/index.mjs';
const database = new DatabaseHandler();

export const method = 'GET';
export const path = '/news/rewritten';
export const Process = async (c) => {
   const req = await database.select('news_rewritten');
   return c.json(req);
}
