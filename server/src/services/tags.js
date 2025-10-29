import { createId, readCollection, writeCollection } from '../data/store.js';

const COLLECTION = 'tags';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

export const listTags = async () => {
  const tags = await readCollection(COLLECTION);
  return tags.sort((a, b) => a.name.localeCompare(b.name));
};

export const createTag = async ({ name, description = '' }) => {
  const trimmedName = normalizeText(name);
  if (!trimmedName) {
    throw new Error('Name is required');
  }

  const tags = await readCollection(COLLECTION);
  if (tags.some((tag) => tag.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error('Tag with this name already exists');
  }

  const now = new Date().toISOString();
  const newTag = {
    id: createId(),
    name: trimmedName.slice(0, 120),
    description: normalizeText(description).slice(0, 400),
    createdAt: now,
    updatedAt: now
  };

  await writeCollection(COLLECTION, [...tags, newTag]);
  return newTag;
};

export const updateTag = async (id, updates) => {
  const tags = await readCollection(COLLECTION);
  const index = tags.findIndex((tag) => tag.id === id);
  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();
  const trimmedName =
    updates.name !== undefined ? normalizeText(updates.name).slice(0, 120) : tags[index].name;

  if (!trimmedName) {
    throw new Error('Name is required');
  }

  if (
    trimmedName.toLowerCase() !== tags[index].name.toLowerCase() &&
    tags.some((tag) => tag.id !== id && tag.name.toLowerCase() === trimmedName.toLowerCase())
  ) {
    throw new Error('Tag with this name already exists');
  }

  const updatedTag = {
    ...tags[index],
    ...updates,
    name: trimmedName,
    description:
      updates.description !== undefined
        ? normalizeText(updates.description).slice(0, 400)
        : tags[index].description,
    updatedAt: now
  };

  tags[index] = updatedTag;
  await writeCollection(COLLECTION, tags);
  return updatedTag;
};

export const deleteTag = async (id) => {
  const tags = await readCollection(COLLECTION);
  const index = tags.findIndex((tag) => tag.id === id);
  if (index === -1) {
    return false;
  }
  tags.splice(index, 1);
  await writeCollection(COLLECTION, tags);
  return true;
};
