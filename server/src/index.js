import http from 'http';
import { URL } from 'url';
import { listTasks, createTask, updateTask, deleteTask } from './store.js';
import { PORT } from './config.js';

const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

const sendJSON = (res, statusCode, payload) => {
  const body = payload === undefined ? '' : JSON.stringify(payload);
  res.writeHead(statusCode, {
    ...baseHeaders,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (method === 'OPTIONS') {
    res.writeHead(204, baseHeaders);
    res.end();
    return;
  }

  try {
    if (method === 'GET' && path === '/') {
      sendJSON(res, 200, { message: 'Kanban API is running' });
      return;
    }

    if (path === '/api/tasks') {
      if (method === 'GET') {
        const tasks = await listTasks();
        sendJSON(res, 200, tasks);
        return;
      }

      if (method === 'POST') {
        const payload = await readBody(req);
        const task = await createTask(payload);
        sendJSON(res, 201, task);
        return;
      }
    }

    if (path.startsWith('/api/tasks/')) {
      const id = decodeURIComponent(path.replace('/api/tasks/', ''));

      if (method === 'PUT') {
        const payload = await readBody(req);
        const task = await updateTask(id, payload);
        if (!task) {
          sendJSON(res, 404, { message: 'Task not found' });
          return;
        }
        sendJSON(res, 200, task);
        return;
      }

      if (method === 'DELETE') {
        const deleted = await deleteTask(id);
        if (!deleted) {
          sendJSON(res, 404, { message: 'Task not found' });
          return;
        }
        sendJSON(res, 200, { message: 'Task deleted' });
        return;
      }
    }

    sendJSON(res, 404, { message: 'Route not found' });
  } catch (error) {
    console.error(error);
    if (error.message === 'Invalid JSON payload' || error.message === 'Request body too large') {
      sendJSON(res, 400, { message: error.message });
      return;
    }
    if (error.message === 'Title is required') {
      sendJSON(res, 400, { message: error.message });
      return;
    }
    sendJSON(res, 500, { message: 'Unexpected server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
