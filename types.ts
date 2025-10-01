
export type ImageStatus = 'processing' | 'done' | 'error';

export type StyleKey = 'default' | 'minimalism' | 'vibrant' | 'premium';

export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalSrc: string;
  processedSrc: string | null;
  status: ImageStatus;
  error?: string;
}
