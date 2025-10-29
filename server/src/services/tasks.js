import { DEFAULT_PRIORITIES } from '../config.js';
import { createId, readCollection, writeCollection } from '../data/store.js';
import { listCategories } from './categories.js';
import { listTags } from './tags.js';
import { listUsers } from './users.js';
import { getProjectById, listProjects } from './projects.js';

const COLLECTION = 'tasks';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const sanitizeLinks = (links = []) => {
  if (!Array.isArray(links)) {
    return [];
  }
  return links
    .filter((link) => link && (link.url || link.label))
    .map((link) => ({
      id: link.id || createId(),
      label: normalizeText(link.label).slice(0, 120) || 'Link',
      url: normalizeText(link.url).slice(0, 500)
    }))
    .slice(0, 20);
};

const readTasks = () => readCollection(COLLECTION);
const writeTasks = (tasks) => writeCollection(COLLECTION, tasks);

const getProjectColumns = (project) => project.columns || [];

const ensureStatus = (project, desiredStatus) => {
  const columns = getProjectColumns(project);
  const normalized = normalizeText(desiredStatus).replace(/\s+/g, '_').toLowerCase();
  const matching = columns.find((column) => column.status === normalized);
  if (matching) {
    return matching.status;
  }
  return columns[0]?.status || 'assigned';
};

const computeNextPosition = (tasks, projectId, status) => {
  const tasksInColumn = tasks.filter((task) => task.projectId === projectId && task.status === status);
  if (tasksInColumn.length === 0) {
    return 0;
  }
  return Math.max(...tasksInColumn.map((task) => task.position || 0)) + 1;
};

const sanitizePriority = (priority) => {
  const allowed = new Set(DEFAULT_PRIORITIES.map((item) => item.id));
  return allowed.has(priority) ? priority : 'medium';
};

const sanitizeTags = async (tagIds) => {
  const allTags = await listTags();
  const valid = new Set(allTags.map((tag) => tag.id));
  if (!Array.isArray(tagIds)) {
    return [];
  }
  return [...new Set(tagIds.filter((id) => valid.has(id)))];
};

const sanitizeCategory = async (categoryId) => {
  if (!categoryId) {
    return null;
  }
  const categories = await listCategories();
  const exists = categories.some((category) => category.id === categoryId);
  return exists ? categoryId : null;
};

const sanitizeAssignee = async (assigneeId) => {
  if (!assigneeId) {
    return null;
  }
  const users = await listUsers();
  const exists = users.some((user) => user.id === assigneeId);
  return exists ? assigneeId : null;
};

const sortTasks = (tasks) => {
  return [...tasks].sort((a, b) => {
    if (a.projectId === b.projectId) {
      if (a.status === b.status) {
        if (a.position === b.position) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return (a.position || 0) - (b.position || 0);
      }
      return a.status.localeCompare(b.status);
    }
    return a.projectId.localeCompare(b.projectId);
  });
};

const expandTasks = async (tasks) => {
  const [projects, categories, tags, users] = await Promise.all([
    listProjects(),
    listCategories(),
    listTags(),
    listUsers()
  ]);

  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const tagMap = new Map(tags.map((tag) => [tag.id, tag]));
  const userMap = new Map(users.map((user) => [user.id, user]));

  return tasks.map((task) => ({
    ...task,
    project: projectMap.get(task.projectId) || null,
    category: task.categoryId ? categoryMap.get(task.categoryId) || null : null,
    tags: task.tagIds.map((id) => tagMap.get(id)).filter(Boolean),
    assignee: task.assigneeId ? userMap.get(task.assigneeId) || null : null
  }));
};

export const listAllTasks = async (filters = {}) => {
  const tasks = await readTasks();
  let filtered = tasks;

  if (filters.projectId) {
    filtered = filtered.filter((task) => task.projectId === filters.projectId);
  }
  if (filters.categoryId) {
    filtered = filtered.filter((task) => task.categoryId === filters.categoryId);
  }
  if (filters.tagId) {
    filtered = filtered.filter((task) => task.tagIds.includes(filters.tagId));
  }
  if (filters.status) {
    filtered = filtered.filter((task) => task.status === filters.status);
  }
  if (filters.priority) {
    filtered = filtered.filter((task) => task.priority === filters.priority);
  }
  if (filters.assigneeId) {
    filtered = filtered.filter((task) => task.assigneeId === filters.assigneeId);
  }
  if (filters.search) {
    const normalized = normalizeText(filters.search).toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.title.toLowerCase().includes(normalized) ||
        task.description.toLowerCase().includes(normalized)
    );
  }

  return expandTasks(sortTasks(filtered));
};

export const listTasksByProject = async (projectId) => {
  const tasks = await readTasks();
  const filtered = tasks
    .filter((task) => task.projectId === projectId)
    .sort((a, b) => {
      if (a.status === b.status) {
        if (a.position === b.position) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return (a.position || 0) - (b.position || 0);
      }
      return a.status.localeCompare(b.status);
    });
  return expandTasks(filtered);
};

export const createTask = async (projectId, payload) => {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const tasks = await readTasks();
  const now = new Date().toISOString();
  const title = normalizeText(payload.title).slice(0, 200);
  if (!title) {
    throw new Error('Title is required');
  }

  const status = ensureStatus(project, payload.status);
  const position = Number.isFinite(payload.position)
    ? Number(payload.position)
    : computeNextPosition(tasks, projectId, status);

  const newTask = {
    id: createId(),
    projectId,
    title,
    description: normalizeText(payload.description).slice(0, 2000),
    categoryId: await sanitizeCategory(payload.categoryId),
    tagIds: await sanitizeTags(payload.tagIds),
    status,
    priority: sanitizePriority(payload.priority),
    assigneeId: await sanitizeAssignee(payload.assigneeId),
    startDate: payload.startDate || new Date().toISOString(),
    dueDate: payload.dueDate || null,
    links: sanitizeLinks(payload.links),
    position,
    createdAt: now,
    updatedAt: now
  };

  await writeTasks([...tasks, newTask]);
  const [expanded] = await expandTasks([newTask]);
  return expanded;
};

export const updateTask = async (taskId, updates) => {
  const tasks = await readTasks();
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) {
    return null;
  }

  const current = tasks[index];
  const project = await getProjectById(current.projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const now = new Date().toISOString();
  const next = { ...current };

  if (updates.title !== undefined) {
    const title = normalizeText(updates.title).slice(0, 200);
    if (!title) {
      throw new Error('Title is required');
    }
    next.title = title;
  }

  if (updates.description !== undefined) {
    next.description = normalizeText(updates.description).slice(0, 2000);
  }

  if (updates.categoryId !== undefined) {
    next.categoryId = await sanitizeCategory(updates.categoryId);
  }

  if (updates.tagIds !== undefined) {
    next.tagIds = await sanitizeTags(updates.tagIds);
  }

  if (updates.status !== undefined) {
    next.status = ensureStatus(project, updates.status);
  }

  if (updates.priority !== undefined) {
    next.priority = sanitizePriority(updates.priority);
  }

  if (updates.assigneeId !== undefined) {
    next.assigneeId = await sanitizeAssignee(updates.assigneeId);
  }

  if (updates.startDate !== undefined) {
    next.startDate = updates.startDate;
  }

  if (updates.dueDate !== undefined) {
    next.dueDate = updates.dueDate;
  }

  if (updates.links !== undefined) {
    next.links = sanitizeLinks(updates.links);
  }

  if (updates.position !== undefined) {
    next.position = Number(updates.position);
  } else if (updates.status && updates.status !== current.status) {
    next.position = computeNextPosition(tasks, next.projectId, next.status);
  }

  next.updatedAt = now;
  tasks[index] = next;
  await writeTasks(tasks);
  const [expanded] = await expandTasks([next]);
  return expanded;
};

export const deleteTask = async (taskId) => {
  const tasks = await readTasks();
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) {
    return false;
  }
  tasks.splice(index, 1);
  await writeTasks(tasks);
  return true;
};

export const reorderTasks = async (projectId, updates = []) => {
  if (!Array.isArray(updates)) {
    throw new Error('Invalid payload');
  }
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }
  const tasks = await readTasks();
  const tasksMap = new Map(tasks.map((task) => [task.id, task]));
  for (const update of updates) {
    const task = tasksMap.get(update.id);
    if (!task || task.projectId !== projectId) {
      continue;
    }
    const status = update.status ? ensureStatus(project, update.status) : task.status;
    const position = Number.isFinite(update.position) ? Number(update.position) : task.position;
    task.status = status;
    task.position = position;
    task.updatedAt = new Date().toISOString();
  }
  await writeTasks(Array.from(tasksMap.values()));
  const changed = updates.map((item) => tasksMap.get(item.id)).filter(Boolean);
  return expandTasks(changed);
};

export const removeCategoryFromTasks = async (categoryId) => {
  const tasks = await readTasks();
  let changed = false;
  for (const task of tasks) {
    if (task.categoryId === categoryId) {
      task.categoryId = null;
      changed = true;
    }
  }
  if (changed) {
    await writeTasks(tasks);
  }
};

export const removeTagFromTasks = async (tagId) => {
  const tasks = await readTasks();
  let changed = false;
  for (const task of tasks) {
    if (task.tagIds?.includes(tagId)) {
      task.tagIds = task.tagIds.filter((id) => id !== tagId);
      changed = true;
    }
  }
  if (changed) {
    await writeTasks(tasks);
  }
};

export const removeUserFromTasks = async (userId) => {
  const tasks = await readTasks();
  let changed = false;
  for (const task of tasks) {
    if (task.assigneeId === userId) {
      task.assigneeId = null;
      changed = true;
    }
  }
  if (changed) {
    await writeTasks(tasks);
  }
};

export const removeTasksByProject = async (projectId) => {
  const tasks = await readTasks();
  const filtered = tasks.filter((task) => task.projectId !== projectId);
  await writeTasks(filtered);
};
