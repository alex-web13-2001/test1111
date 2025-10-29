import { randomBytes, scryptSync } from 'node:crypto';
import { createId, readCollection, writeCollection } from '../data/store.js';

const COLLECTION = 'users';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const hashPassword = (password) => {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
};

export const listUsers = async () => {
  const users = await readCollection(COLLECTION);
  return users.map(({ password, ...rest }) => rest).sort((a, b) => a.name.localeCompare(b.name));
};

export const ensureSeedUser = async () => {
  const users = await readCollection(COLLECTION);
  if (users.length === 0) {
    const now = new Date().toISOString();
    const defaultUser = {
      id: createId(),
      name: 'Team Lead',
      email: 'lead@example.com',
      role: 'member',
      password: hashPassword('changeme'),
      createdAt: now,
      updatedAt: now
    };
    await writeCollection(COLLECTION, [defaultUser]);
  }
};

export const createUser = async ({ name, email, password, role = 'member' }) => {
  const trimmedName = normalizeText(name);
  const trimmedEmail = normalizeText(email).toLowerCase();
  if (!trimmedName || !trimmedEmail || !password) {
    throw new Error('Name, email and password are required');
  }

  const users = await readCollection(COLLECTION);
  if (users.some((user) => user.email === trimmedEmail)) {
    throw new Error('User with this email already exists');
  }

  const now = new Date().toISOString();
  const newUser = {
    id: createId(),
    name: trimmedName.slice(0, 120),
    email: trimmedEmail.slice(0, 160),
    role,
    password: hashPassword(password),
    createdAt: now,
    updatedAt: now
  };

  await writeCollection(COLLECTION, [...users, newUser]);
  const { password: _, ...safeUser } = newUser;
  return safeUser;
};

export const updateUser = async (id, updates) => {
  const users = await readCollection(COLLECTION);
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();
  const updatedUser = { ...users[index] };

  if (updates.name !== undefined) {
    const trimmedName = normalizeText(updates.name).slice(0, 120);
    if (!trimmedName) {
      throw new Error('Name is required');
    }
    updatedUser.name = trimmedName;
  }

  if (updates.email !== undefined) {
    const trimmedEmail = normalizeText(updates.email).toLowerCase().slice(0, 160);
    if (!trimmedEmail) {
      throw new Error('Email is required');
    }
    if (users.some((user) => user.id !== id && user.email === trimmedEmail)) {
      throw new Error('User with this email already exists');
    }
    updatedUser.email = trimmedEmail;
  }

  if (updates.role !== undefined) {
    updatedUser.role = updates.role;
  }

  if (updates.password) {
    updatedUser.password = hashPassword(updates.password);
  }

  updatedUser.updatedAt = now;
  users[index] = updatedUser;
  await writeCollection(COLLECTION, users);
  const { password, ...safeUser } = updatedUser;
  return safeUser;
};

export const deleteUser = async (id) => {
  const users = await readCollection(COLLECTION);
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    return false;
  }
  users.splice(index, 1);
  await writeCollection(COLLECTION, users);
  return true;
};

export const getUserById = async (id) => {
  const users = await readCollection(COLLECTION);
  const user = users.find((item) => item.id === id);
  if (!user) {
    return null;
  }
  const { password, ...safeUser } = user;
  return safeUser;
};
