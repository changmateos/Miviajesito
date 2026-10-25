import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TicketDBSchema extends DBSchema {
  ticket_blobs: {
    key: string;
    value: {
      id: string;
      trip_id: string;
      title: string;
      mime_type: string;
      data: Blob;
      cached_at: string;
    };
    indexes: { 'by-trip': string };
  };
}

let dbPromise: Promise<IDBPDatabase<TicketDBSchema>> | null = null;

const getDB = () => {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<TicketDBSchema>('miviajecito_offline', 1, {
      upgrade(db) {
        const store = db.createObjectStore('ticket_blobs', { keyPath: 'id' });
        store.createIndex('by-trip', 'trip_id');
      },
    });
  }
  return dbPromise;
};

export const cacheTicketBlob = async (
  ticketId: string,
  tripId: string,
  title: string,
  mimeType: string,
  blob: Blob
) => {
  const db = await getDB();
  if (!db) return;
  await db.put('ticket_blobs', {
    id: ticketId,
    trip_id: tripId,
    title,
    mime_type: mimeType,
    data: blob,
    cached_at: new Date().toISOString(),
  });
};

export const getCachedTicketBlob = async (ticketId: string): Promise<{ blob: Blob; mimeType: string } | null> => {
  const db = await getDB();
  if (!db) return null;
  const item = await db.get('ticket_blobs', ticketId);
  if (!item) return null;
  return { blob: item.data, mimeType: item.mime_type };
};

export const deleteCachedTicketBlob = async (ticketId: string) => {
  const db = await getDB();
  if (!db) return;
  await db.delete('ticket_blobs', ticketId);
};
