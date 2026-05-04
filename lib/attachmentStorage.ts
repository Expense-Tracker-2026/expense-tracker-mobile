import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from './firebase';
import * as WebBrowser from 'expo-web-browser';

function attachmentRef(key: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return ref(storage, `users/${uid}/attachments/${key}`);
}

export async function saveFileFromUri(key: string, uri: string, mimeType?: string): Promise<void> {
  const response = await fetch(uri);
  const blob = await response.blob();
  await uploadBytes(attachmentRef(key), blob, mimeType ? { contentType: mimeType } : undefined);
}

export async function getFileUrl(key: string): Promise<string | null> {
  try {
    return await getDownloadURL(attachmentRef(key));
  } catch {
    return null;
  }
}

export async function openFile(key: string): Promise<void> {
  const url = await getFileUrl(key);
  if (url) await WebBrowser.openBrowserAsync(url);
}

export async function deleteFile(key: string): Promise<void> {
  try {
    await deleteObject(attachmentRef(key));
  } catch {
    // file may not exist — ignore
  }
}
