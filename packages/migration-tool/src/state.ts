import { type Migration } from './migration-tool';

export interface State {
  getUpMigrations: (migrations: Migration[]) => Promise<Migration[]>;
  getDownMigrations: (migrations: Migration[]) => Promise<Migration[]>;
  markaAsUp: (migration: Migration) => Promise<void>;
  markAsDown: (migration: Migration) => Promise<void>;
  close?: () => Promise<void>;
}
