export const PORT = Number(process.env.PORT) || 5000;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'task_manager';

export const DEFAULT_COLUMNS = [
  { status: 'assigned', title: 'Assigned', order: 0 },
  { status: 'in_progress', title: 'In Progress', order: 1 },
  { status: 'done', title: 'Done', order: 2 }
];

export const DEFAULT_PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' }
];
