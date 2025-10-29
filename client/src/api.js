import axios from 'axios';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchProjects = () => client.get('/projects');
export const fetchProjectDetail = (projectId) => client.get(`/projects/${projectId}`);
export const createProject = (payload) => client.post('/projects', payload);
export const updateProject = (projectId, payload) => client.put(`/projects/${projectId}`, payload);
export const deleteProject = (projectId) => client.delete(`/projects/${projectId}`);

export const fetchCategories = () => client.get('/categories');
export const createCategory = (payload) => client.post('/categories', payload);
export const updateCategory = (categoryId, payload) => client.put(`/categories/${categoryId}`, payload);
export const deleteCategory = (categoryId) => client.delete(`/categories/${categoryId}`);

export const fetchTags = () => client.get('/tags');
export const createTag = (payload) => client.post('/tags', payload);
export const updateTag = (tagId, payload) => client.put(`/tags/${tagId}`, payload);
export const deleteTag = (tagId) => client.delete(`/tags/${tagId}`);

export const fetchUsers = () => client.get('/users');
export const createUser = (payload) => client.post('/users', payload);
export const updateUser = (userId, payload) => client.put(`/users/${userId}`, payload);
export const deleteUser = (userId) => client.delete(`/users/${userId}`);

export const fetchDashboardTasks = (params) => client.get('/tasks', { params });
export const updateTask = (taskId, payload) => client.put(`/tasks/${taskId}`, payload);
export const deleteTask = (taskId) => client.delete(`/tasks/${taskId}`);

export const createTask = (projectId, payload) => client.post(`/projects/${projectId}/tasks`, payload);

export default client;
