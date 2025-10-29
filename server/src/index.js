import http from 'node:http';
import { PORT } from './config.js';
import { connectToDatabase } from './data/mongo.js';
import { handleRequest } from './router.js';

const startServer = async () => {
  try {
    await connectToDatabase();
    const server = http.createServer((req, res) => {
      handleRequest(req, res);
    });

    server.listen(PORT, () => {
      console.log(`Task Manager API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Task Manager API', error);
    process.exit(1);
  }
};

startServer();
