export interface SaveData {
  version: 1;
  crystals: number;
  experience: number;
  collectedIds: string[];
  player: { x: number; z: number };\n  inventory?: { id: string; name: string; description: string; quantity: number }[];\n  villageTasks?: string[];
}
const DB_NAME = "fantasy-world-save";
const STORE = "progress";
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("Local save is not supported in this browser."));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local save."));
  });
}
export async function saveGame(data: SaveData): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(data, "latest");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Save failed."));
  });
  db.close();
}
export async function loadGame(): Promise<SaveData | null> {
  const db = await openDatabase();
  const value = await new Promise<SaveData | null>((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get("latest");
    request.onsuccess = () => resolve((request.result as SaveData | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Could not load save."));
  });
  db.close();
  return value;
}