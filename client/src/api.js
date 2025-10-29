import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api'
});

export const fetchTasks = () => apiClient.get('/tasks');
export const createTask = (payload) => apiClient.post('/tasks', payload);
export const updateTask = (id, payload) => apiClient.put(`/tasks/${id}`, payload);
export const deleteTask = (id) => apiClient.delete(`/tasks/${id}`);
