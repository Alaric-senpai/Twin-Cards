import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { generateId } from '@/utils/ids';

const MATERIALS_DIR = `${FileSystem.documentDirectory}twincardmaterials/`;

/**
 * Initialize the materials directory
 */
export async function initializeMaterialsDirectory() {
    try {
        const dirInfo = await FileSystem.getInfoAsync(MATERIALS_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(MATERIALS_DIR, { intermediates: true });
        }
    } catch (error) {
        console.error('Failed to initialize materials directory:', error);
    }
}

/**
 * Pick a document (PDF or PPTX) from the device
 */
export async function pickDocument() {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: [
                'application/pdf',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            ],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets[0]) {
            return null;
        }

        return result.assets[0];
    } catch (error) {
        console.error('Failed to pick document:', error);
        return null;
    }
}

/**
 * Copy a file to the app's materials directory
 */
export async function copyFileToMaterials(sourceUri: string, fileName: string) {
    try {
        await initializeMaterialsDirectory();

        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        const newFileName = `${generateId()}.${fileExtension}`;
        const destinationUri = `${MATERIALS_DIR}${newFileName}`;

        await FileSystem.copyAsync({
            from: sourceUri,
            to: destinationUri,
        });

        return {
            uri: destinationUri,
            fileName: newFileName,
            fileType: fileExtension === 'pdf' ? 'pdf' : 'pptx',
        };
    } catch (error) {
        console.error('Failed to copy file:', error);
        return null;
    }
}

/**
 * Delete a file from the materials directory
 */
export async function deleteFile(fileUri: string) {
    try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        return true;
    } catch (error) {
        console.error('Failed to delete file:', error);
        return false;
    }
}

/**
 * Get file information
 */
export async function getFileInfo(fileUri: string) {
    try {
        const info = await FileSystem.getInfoAsync(fileUri);
        return info;
    } catch (error) {
        console.error('Failed to get file info:', error);
        return null;
    }
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
