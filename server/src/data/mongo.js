import { MongoClient } from 'mongodb';
import { MONGODB_DB_NAME, MONGODB_URI } from '../config.js';

let clientPromise;
const collectionIndexPromises = new Map();

const getClient = async () => {
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
};

export const getDatabase = async () => {
  const client = await getClient();
  return client.db(MONGODB_DB_NAME);
};

const ensureIndexes = async (collection) => {
  const name = collection.collectionName;
  if (!collectionIndexPromises.has(name)) {
    collectionIndexPromises.set(
      name,
      collection
        .createIndex({ id: 1 }, { unique: true, sparse: true })
        .catch((error) => {
          collectionIndexPromises.delete(name);
          throw error;
        })
    );
  }
  return collectionIndexPromises.get(name);
};

export const getCollection = async (name) => {
  const db = await getDatabase();
  const collection = db.collection(name);
  await ensureIndexes(collection);
  return collection;
};

export const connectToDatabase = async () => {
  await getDatabase();
};
