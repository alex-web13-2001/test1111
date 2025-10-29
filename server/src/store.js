import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

const DEFAULT_TASKS = [
  {
    id: randomUUID(),
    title: 'Welcome to the Kanban board',
    description: 'Use the form on the left to add more tasks.',
    status: 'todo',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: randomUUID(),
    title: 'Drag and drop coming soon',
    description: 'Update a task status using the dropdown.',
    status: 'in-progress',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: randomUUID(),
    title: 'Finished tasks appear here',
    description: '',
    status: 'done',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const ensureDataFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_TASKS, null, 2), 'utf-8');
  }
};

const readTasks = async () => {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeTasks = async (tasks) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
};

const sortTasks = (tasks) =>
  [...tasks].sort((a, b) => {
    if (a.status === b.status) {
      if (a.order === b.order) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.order - b.order;
    }
    return a.status.localeCompare(b.status);
  });

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

export const listTasks = async () => {
  const tasks = await readTasks();
  return sortTasks(tasks);
};

export const createTask = async ({ title, description = '', status = 'todo', order }) => {
  const trimmedTitle = normalizeText(title);
  if (!trimmedTitle) {
    throw new Error('Title is required');
  }

  const normalizedStatus = ['todo', 'in-progress', 'done'].includes(status) ? status : 'todo';
  const tasks = await readTasks();
  const tasksInStatus = tasks.filter((task) => task.status === normalizedStatus);
  const now = new Date().toISOString();

  const newTask = {
    id: randomUUID(),
    title: trimmedTitle.slice(0, 120),
    description: normalizeText(description).slice(0, 500),
    status: normalizedStatus,
    order: typeof order === 'number' ? order : tasksInStatus.length,
    createdAt: now,
    updatedAt: now
  };

  await writeTasks([...tasks, newTask]);
  return newTask;
};

export const updateTask = async (id, updates) => {
  const tasks = await readTasks();
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return null;
  }

  const current = tasks[index];
  const now = new Date().toISOString();
  const nextStatus = updates.status && ['todo', 'in-progress', 'done'].includes(updates.status)
    ? updates.status
    : current.status;

  let nextOrder = updates.order;
  if (nextOrder === undefined && nextStatus !== current.status) {
    const tasksInStatus = tasks.filter((task) => task.status === nextStatus);
    nextOrder = tasksInStatus.length;
  }

  const updatedTask = {
    ...current,
    ...updates,
    title: updates.title !== undefined ? normalizeText(updates.title).slice(0, 120) : current.title,
    description:
      updates.description !== undefined
        ? normalizeText(updates.description).slice(0, 500)
        : current.description,
    status: nextStatus,
    order: typeof nextOrder === 'number' ? nextOrder : current.order,
    updatedAt: now
  };

  tasks[index] = updatedTask;
  await writeTasks(tasks);
  return updatedTask;
};

export const deleteTask = async (id) => {
  const tasks = await readTasks();
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return false;
  }

  tasks.splice(index, 1);
  await writeTasks(tasks);
  return true;
};
