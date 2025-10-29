import { randomUUID } from 'node:crypto';
import { getCollection } from './mongo.js';

const stripInternalFields = (document) => {
  if (!document) {
    return document;
  }
  const { _id, ...rest } = document;
  return rest;
};

export const readCollection = async (name) => {
  const collection = await getCollection(name);
  const documents = await collection.find({}).toArray();
  return documents.map(stripInternalFields);
};

export const writeCollection = async (name, data) => {
  const collection = await getCollection(name);
  const items = Array.isArray(data) ? data.map((item) => ({ ...item })) : [];
  await collection.deleteMany({});
  if (items.length > 0) {
    await collection.insertMany(items);
  }
  return items;
};

export const upsertItem = async (name, item) => {
  const collection = await getCollection(name);
  await collection.updateOne(
    { id: item.id },
    { $set: { ...item } },
    { upsert: true }
  );
  return item;
};

export const removeItem = async (name, id) => {
  const collection = await getCollection(name);
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
};

export const createId = () => randomUUID();
