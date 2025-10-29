import { sendError, sendJSON, readBody } from './utils/http.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from './services/categories.js';
import { listTags, createTag, updateTag, deleteTag } from './services/tags.js';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  ensureSeedUser,
  getUserById
} from './services/users.js';
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectById
} from './services/projects.js';
import {
  listAllTasks,
  listTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  removeCategoryFromTasks,
  removeTagFromTasks,
  removeUserFromTasks,
  removeTasksByProject
} from './services/tasks.js';

const parseId = (segments, index) => segments[index] || null;

export const handleRequest = async (req, res) => {
  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const segments = path.split('/').filter(Boolean);

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    });
    res.end();
    return;
  }

  try {
    await ensureSeedUser();

    if (segments.length === 0) {
      sendJSON(res, 200, { message: 'Task Manager API' });
      return;
    }

    if (segments[0] !== 'api') {
      sendError(res, 404, 'Route not found');
      return;
    }

    switch (segments[1]) {
      case 'health': {
        sendJSON(res, 200, { status: 'ok' });
        return;
      }
      case 'categories': {
        if (method === 'GET' && segments.length === 2) {
          const categories = await listCategories();
          sendJSON(res, 200, categories);
          return;
        }
        if (method === 'POST' && segments.length === 2) {
          const payload = await readBody(req);
          const category = await createCategory(payload);
          sendJSON(res, 201, category);
          return;
        }
        if (segments.length === 3) {
          const id = parseId(segments, 2);
          if (method === 'PUT') {
            const payload = await readBody(req);
            const category = await updateCategory(id, payload);
            if (!category) {
              sendError(res, 404, 'Category not found');
              return;
            }
            sendJSON(res, 200, category);
            return;
          }
          if (method === 'DELETE') {
            const deleted = await deleteCategory(id);
            if (!deleted) {
              sendError(res, 404, 'Category not found');
              return;
            }
            await removeCategoryFromTasks(id);
            sendJSON(res, 200, { message: 'Category deleted' });
            return;
          }
        }
        break;
      }
      case 'tags': {
        if (method === 'GET' && segments.length === 2) {
          const tags = await listTags();
          sendJSON(res, 200, tags);
          return;
        }
        if (method === 'POST' && segments.length === 2) {
          const payload = await readBody(req);
          const tag = await createTag(payload);
          sendJSON(res, 201, tag);
          return;
        }
        if (segments.length === 3) {
          const id = parseId(segments, 2);
          if (method === 'PUT') {
            const payload = await readBody(req);
            const tag = await updateTag(id, payload);
            if (!tag) {
              sendError(res, 404, 'Tag not found');
              return;
            }
            sendJSON(res, 200, tag);
            return;
          }
          if (method === 'DELETE') {
            const deleted = await deleteTag(id);
            if (!deleted) {
              sendError(res, 404, 'Tag not found');
              return;
            }
            await removeTagFromTasks(id);
            sendJSON(res, 200, { message: 'Tag deleted' });
            return;
          }
        }
        break;
      }
      case 'users': {
        if (method === 'GET' && segments.length === 2) {
          const users = await listUsers();
          sendJSON(res, 200, users);
          return;
        }
        if (method === 'POST' && segments.length === 2) {
          const payload = await readBody(req);
          const user = await createUser(payload);
          sendJSON(res, 201, user);
          return;
        }
        if (segments.length === 3) {
          const id = parseId(segments, 2);
          if (method === 'PUT') {
            const payload = await readBody(req);
            const user = await updateUser(id, payload);
            if (!user) {
              sendError(res, 404, 'User not found');
              return;
            }
            sendJSON(res, 200, user);
            return;
          }
          if (method === 'DELETE') {
            const deleted = await deleteUser(id);
            if (!deleted) {
              sendError(res, 404, 'User not found');
              return;
            }
            await removeUserFromTasks(id);
            sendJSON(res, 200, { message: 'User deleted' });
            return;
          }
          if (method === 'GET') {
            const user = await getUserById(id);
            if (!user) {
              sendError(res, 404, 'User not found');
              return;
            }
            sendJSON(res, 200, user);
            return;
          }
        }
        break;
      }
      case 'projects': {
        if (method === 'GET' && segments.length === 2) {
          const projects = await listProjects();
          sendJSON(res, 200, projects);
          return;
        }
        if (method === 'POST' && segments.length === 2) {
          const payload = await readBody(req);
          const project = await createProject(payload);
          sendJSON(res, 201, project);
          return;
        }
        if (segments.length >= 3) {
          const projectId = parseId(segments, 2);
          if (segments.length === 3) {
            if (method === 'GET') {
              const project = await getProjectById(projectId);
              if (!project) {
                sendError(res, 404, 'Project not found');
                return;
              }
              const tasks = await listTasksByProject(projectId);
              sendJSON(res, 200, { project, tasks });
              return;
            }
            if (method === 'PUT') {
              const payload = await readBody(req);
              const project = await updateProject(projectId, payload);
              if (!project) {
                sendError(res, 404, 'Project not found');
                return;
              }
              sendJSON(res, 200, project);
              return;
            }
            if (method === 'DELETE') {
              const deleted = await deleteProject(projectId);
              if (!deleted) {
                sendError(res, 404, 'Project not found');
                return;
              }
              await removeTasksByProject(projectId);
              sendJSON(res, 200, { message: 'Project deleted' });
              return;
            }
          }
          if (segments.length === 4 && segments[3] === 'tasks') {
            if (method === 'GET') {
              const tasks = await listTasksByProject(projectId);
              sendJSON(res, 200, tasks);
              return;
            }
            if (method === 'POST') {
              const payload = await readBody(req);
              const task = await createTask(projectId, payload);
              sendJSON(res, 201, task);
              return;
            }
          }
          if (segments.length === 5 && segments[3] === 'tasks' && segments[4] === 'reorder') {
            if (method === 'PATCH') {
              const payload = await readBody(req);
              const updated = await reorderTasks(projectId, payload.updates || []);
              sendJSON(res, 200, updated);
              return;
            }
          }
        }
        break;
      }
      case 'tasks': {
        if (method === 'GET' && segments.length === 2) {
          const filters = {
            projectId: url.searchParams.get('projectId') || undefined,
            categoryId: url.searchParams.get('categoryId') || undefined,
            tagId: url.searchParams.get('tagId') || undefined,
            status: url.searchParams.get('status') || undefined,
            priority: url.searchParams.get('priority') || undefined,
            assigneeId: url.searchParams.get('assigneeId') || undefined,
            search: url.searchParams.get('search') || undefined
          };
          const tasks = await listAllTasks(filters);
          sendJSON(res, 200, tasks);
          return;
        }
        if (segments.length === 3) {
          const taskId = parseId(segments, 2);
          if (method === 'PUT') {
            const payload = await readBody(req);
            const task = await updateTask(taskId, payload);
            if (!task) {
              sendError(res, 404, 'Task not found');
              return;
            }
            sendJSON(res, 200, task);
            return;
          }
          if (method === 'DELETE') {
            const deleted = await deleteTask(taskId);
            if (!deleted) {
              sendError(res, 404, 'Task not found');
              return;
            }
            sendJSON(res, 200, { message: 'Task deleted' });
            return;
          }
        }
        break;
      }
      default:
        break;
    }

    sendError(res, 404, 'Route not found');
  } catch (error) {
    console.error(error);
    if (error.message === 'Invalid JSON payload' || error.message === 'Request body too large') {
      sendError(res, 400, error.message);
      return;
    }
    sendError(res, 400, error.message || 'Unexpected server error');
  }
};
