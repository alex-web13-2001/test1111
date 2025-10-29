import { createId, readCollection, writeCollection } from '../data/store.js';

const COLLECTION = 'categories';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const ensureBaseState = async () => {
  const items = await readCollection(COLLECTION);
  if (items.length === 0) {
    await writeCollection(COLLECTION, []);
  }
};

export const listCategories = async () => {
  await ensureBaseState();
  const categories = await readCollection(COLLECTION);
  return categories.sort((a, b) => a.name.localeCompare(b.name));
};

export const createCategory = async ({ name, color = '#6a67ce', description = '' }) => {
  const trimmedName = normalizeText(name);
  if (!trimmedName) {
    throw new Error('Name is required');
  }

  const now = new Date().toISOString();
  const categories = await readCollection(COLLECTION);
  if (categories.some((category) => category.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error('Category with this name already exists');
  }

  const newCategory = {
    id: createId(),
    name: trimmedName.slice(0, 120),
    color: normalizeText(color) || '#6a67ce',
    description: normalizeText(description).slice(0, 400),
    createdAt: now,
    updatedAt: now
  };

  await writeCollection(COLLECTION, [...categories, newCategory]);
  return newCategory;
};

export const updateCategory = async (id, updates) => {
  const categories = await readCollection(COLLECTION);
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();
  const trimmedName =
    updates.name !== undefined ? normalizeText(updates.name).slice(0, 120) : categories[index].name;

  if (!trimmedName) {
    throw new Error('Name is required');
  }

  if (
    trimmedName.toLowerCase() !== categories[index].name.toLowerCase() &&
    categories.some((category) => category.id !== id && category.name.toLowerCase() === trimmedName.toLowerCase())
  ) {
    throw new Error('Category with this name already exists');
  }

  const updatedCategory = {
    ...categories[index],
    ...updates,
    name: trimmedName,
    color: updates.color !== undefined ? normalizeText(updates.color) || '#6a67ce' : categories[index].color,
    description:
      updates.description !== undefined
        ? normalizeText(updates.description).slice(0, 400)
        : categories[index].description,
    updatedAt: now
  };

  categories[index] = updatedCategory;
  await writeCollection(COLLECTION, categories);
  return updatedCategory;
};

export const deleteCategory = async (id) => {
  const categories = await readCollection(COLLECTION);
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) {
    return false;
  }
  categories.splice(index, 1);
  await writeCollection(COLLECTION, categories);
  return true;
};
