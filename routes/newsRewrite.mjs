import { rewriteNews } from '../services/news-rewriter/index.mjs';
import { createId } from '../services/utils/index.js';
import { Tasks } from '../globals.mjs'

export const method = 'POST';
export const path = '/news/rewrite';
export const Process = async (c) => {
    const req = await c.req.json();
    const taskId = createId();
    Tasks.set(taskId, { status: 'processing' });
    (async () => {
        try {
          const result = await rewriteNews(req);
          Tasks.set(taskId, { status: 'done', result });
        } catch (err) {
          Tasks.set(taskId, { status: 'error', error: err.message });
        }
    })();
  
    return c.json({ status: 'accepted', taskId }, 202);
  };