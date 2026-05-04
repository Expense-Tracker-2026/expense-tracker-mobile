import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { saveFileFromUri, openFile, deleteFile } from '../../lib/attachmentStorage';
import type { AttachmentMeta } from '../../lib/types';

interface AttachmentPickerProps {
  attachment?: AttachmentMeta;
  onAttachmentChange: (attachment: AttachmentMeta | undefined) => void;
  expenseId?: string;
}

export function AttachmentPicker({ attachment, onAttachmentChange, expenseId }: AttachmentPickerProps) {
  const [uploading, setUploading] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await upload(result.assets[0].uri, result.assets[0].fileName ?? 'image.jpg', result.assets[0].mimeType ?? 'image/jpeg');
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await upload(asset.uri, asset.name, asset.mimeType ?? 'application/octet-stream');
    }
  }

  async function upload(uri: string, name: string, mimeType: string) {
    const key = expenseId ? `${expenseId}-${Date.now()}` : `attachment-${Date.now()}`;
    setUploading(true);
    try {
      await saveFileFromUri(key, uri, mimeType);
      const meta: AttachmentMeta = {
        key,
        name,
        size: 0,
        type: mimeType,
        uploadedAt: new Date().toISOString(),
      };
      onAttachmentChange(meta);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Failed to upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    Alert.alert('Remove attachment', 'Are you sure you want to remove this attachment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          if (attachment) {
            await deleteFile(attachment.key).catch(() => {});
            onAttachmentChange(undefined);
          }
        },
      },
    ]);
  }

  if (uploading) {
    return (
      <View style={styles.uploading}>
        <ActivityIndicator color="#7C3AED" size="small" />
        <Text style={styles.uploadingText}>Uploading...</Text>
      </View>
    );
  }

  if (attachment) {
    return (
      <View style={styles.attached}>
        <TouchableOpacity style={styles.attachedContent} onPress={() => openFile(attachment.key)}>
          <Text style={styles.attachIcon}>📎</Text>
          <Text style={styles.attachName} numberOfLines={1}>{attachment.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.buttonRow}>
      <TouchableOpacity style={styles.pickerBtn} onPress={pickImage}>
        <Text style={styles.btnIcon}>🖼️</Text>
        <Text style={styles.btnText}>Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.pickerBtn} onPress={pickDocument}>
        <Text style={styles.btnIcon}>📄</Text>
        <Text style={styles.btnText}>Document</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  uploading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  uploadingText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  attached: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
  },
  attachedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachIcon: {
    fontSize: 16,
  },
  attachName: {
    flex: 1,
    color: '#A78BFA',
    fontSize: 13,
  },
  removeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#64748B',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    gap: 6,
  },
  btnIcon: {
    fontSize: 16,
  },
  btnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
});
