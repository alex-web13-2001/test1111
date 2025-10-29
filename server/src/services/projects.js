import { DEFAULT_COLUMNS } from '../config.js';
import { createId, readCollection, writeCollection } from '../data/store.js';
import { listCategories } from './categories.js';

const COLLECTION = 'projects';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const sanitizeLinks = (links = []) => {
  if (!Array.isArray(links)) {
    return [];
  }
  return links
    .filter((item) => item && (item.url || item.label))
    .map((item) => ({
      id: item.id || createId(),
      label: normalizeText(item.label).slice(0, 120) || 'Link',
      url: normalizeText(item.url).slice(0, 500)
    }))
    .slice(0, 20);
};

const sanitizeColumns = (columns = []) => {
  if (!Array.isArray(columns) || columns.length === 0) {
    return DEFAULT_COLUMNS.map((column) => ({ ...column, id: createId() }));
  }
  const seenStatuses = new Set();
  const normalized = columns
    .filter((column) => column && column.status && column.title)
    .map((column, index) => {
      const status = normalizeText(column.status).replace(/\s+/g, '_').toLowerCase();
      const title = normalizeText(column.title).slice(0, 120) || 'Column';
      const order = Number.isFinite(column.order) ? Number(column.order) : index;
      if (seenStatuses.has(status)) {
        throw new Error('Each column must have a unique status');
      }
      seenStatuses.add(status);
      return {
        id: column.id || createId(),
        status,
        title,
        order
      };
    });

  if (!normalized.some((column) => column.status === 'done')) {
    throw new Error('At least one column must represent the Done status');
  }

  return normalized.sort((a, b) => a.order - b.order);
};

export const listProjects = async () => {
  const projects = await readCollection(COLLECTION);
  return projects.sort((a, b) => a.name.localeCompare(b.name));
};

export const createProject = async ({ name, description = '', categoryIds = [], links = [], columns }) => {
  const trimmedName = normalizeText(name);
  if (!trimmedName) {
    throw new Error('Name is required');
  }

  const projects = await readCollection(COLLECTION);
  if (projects.some((project) => project.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error('Project with this name already exists');
  }

  const validCategories = new Set((await listCategories()).map((category) => category.id));
  const filteredCategoryIds = Array.isArray(categoryIds)
    ? [...new Set(categoryIds.filter((id) => validCategories.has(id)))]
    : [];

  const now = new Date().toISOString();
  const newProject = {
    id: createId(),
    name: trimmedName.slice(0, 200),
    description: normalizeText(description).slice(0, 1000),
    categoryIds: filteredCategoryIds,
    links: sanitizeLinks(links),
    columns: sanitizeColumns(columns),
    createdAt: now,
    updatedAt: now
  };

  await writeCollection(COLLECTION, [...projects, newProject]);
  return newProject;
};

export const updateProject = async (id, updates) => {
  const projects = await readCollection(COLLECTION);
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();
  const project = { ...projects[index] };

  if (updates.name !== undefined) {
    const trimmedName = normalizeText(updates.name).slice(0, 200);
    if (!trimmedName) {
      throw new Error('Name is required');
    }
    if (
      trimmedName.toLowerCase() !== project.name.toLowerCase() &&
      projects.some((item) => item.id !== id && item.name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      throw new Error('Project with this name already exists');
    }
    project.name = trimmedName;
  }

  if (updates.description !== undefined) {
    project.description = normalizeText(updates.description).slice(0, 1000);
  }

  if (updates.categoryIds !== undefined) {
    const validCategories = new Set((await listCategories()).map((category) => category.id));
    project.categoryIds = Array.isArray(updates.categoryIds)
      ? [...new Set(updates.categoryIds.filter((categoryId) => validCategories.has(categoryId)))]
      : project.categoryIds;
  }

  if (updates.links !== undefined) {
    project.links = sanitizeLinks(updates.links);
  }

  if (updates.columns !== undefined) {
    project.columns = sanitizeColumns(updates.columns).map((column, index) => ({
      ...column,
      order: index
    }));
  }

  project.updatedAt = now;
  projects[index] = project;
  await writeCollection(COLLECTION, projects);
  return project;
};

export const deleteProject = async (id) => {
  const projects = await readCollection(COLLECTION);
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) {
    return false;
  }
  projects.splice(index, 1);
  await writeCollection(COLLECTION, projects);
  return true;
};

export const getProjectById = async (id) => {
  const projects = await readCollection(COLLECTION);
  return projects.find((project) => project.id === id) || null;
};
