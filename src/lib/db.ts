import Dexie, { type Table } from 'dexie';
import { Note } from '../types';

export class ZenNotesDB extends Dexie {
  notes!: Table<Note>;

  constructor() {
    super('ZenNotesDB');
    this.version(3).stores({
      notes: 'id, title, category, syncStatus, updatedAt, isPinned, userId'
    });
  }
}

export const db = new ZenNotesDB();
