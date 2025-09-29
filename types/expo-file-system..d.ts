declare module 'expo-file-system' {
  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;

  export enum EncodingType {
    UTF8 = 'utf8',
    Base64 = 'base64',
  }

  export interface WriteAsStringAsyncOptions {
    encoding?: EncodingType | 'utf8' | 'base64';
  }

  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: WriteAsStringAsyncOptions
  ): Promise<void>;

  export function readAsStringAsync(
    fileUri: string,
    options?: { encoding?: EncodingType | 'utf8' | 'base64' }
  ): Promise<string>;

  export function deleteAsync(
    fileUri: string,
    options?: { idempotent?: boolean }
  ): Promise<void>;

  export function getInfoAsync(
    fileUri: string,
    options?: { size?: boolean; md5?: boolean }
  ): Promise<{
    exists: boolean;
    uri: string;
    size?: number;
    modificationTime?: number;
    md5?: string;
    isDirectory?: boolean;
  }>;
}

declare module 'expo-sharing' {
  export function isAvailableAsync(): Promise<boolean>;
  
  export interface SharingOptions {
    mimeType?: string;
    dialogTitle?: string;
    UTI?: string;
  }

  export function shareAsync(
    url: string,
    options?: SharingOptions
  ): Promise<void>;
}