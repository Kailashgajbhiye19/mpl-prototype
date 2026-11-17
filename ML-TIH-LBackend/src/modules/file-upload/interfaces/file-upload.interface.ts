// src/modules/file-upload/interfaces/file-upload.interface.ts
export interface FileUploadResponse {
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  reference_id?: number;
  type?: string;
  uploaded_at: Date;
}

export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  uploadPath: string;
  maxFiles: number;
}
