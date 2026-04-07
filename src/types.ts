export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'deleted';
  version: number;
  isPinned: boolean;
  userId: string;
}

export interface SyncPayload {
  notes: Note[];
  lastSyncTimestamp: number;
}
