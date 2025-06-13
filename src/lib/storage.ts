import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  type UploadTask,
  type UploadMetadata
} from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
  progress: number; // percentage
}

export const storageUtils = {
  // Upload a file with progress tracking
  uploadFile(
    file: File, 
    path: string, 
    onProgress?: (progress: UploadProgress) => void,
    metadata?: UploadMetadata
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state as UploadProgress['state'],
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  },

  // Simple file upload without progress tracking
  async uploadFileSimple(file: File, path: string, metadata?: UploadMetadata): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    return getDownloadURL(snapshot.ref);
  },

  // Delete a file
  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },

  // Get download URL for a file
  async getDownloadURL(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  },

  // List all files in a directory
  async listFiles(path: string) {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    const files = await Promise.all(
      result.items.map(async (itemRef) => ({
        name: itemRef.name,
        fullPath: itemRef.fullPath,
        downloadURL: await getDownloadURL(itemRef)
      }))
    );

    return files;
  },

  // Generate a unique file path
  generateFilePath(userId: string, type: 'resume' | 'job-description' | 'profile-image', fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    switch (type) {
      case 'resume':
        return `resumes/${userId}/${timestamp}_${sanitizedFileName}`;
      case 'job-description':
        return `job_descriptions/${userId}/${timestamp}_${sanitizedFileName}`;
      case 'profile-image':
        return `profile-images/${userId}/${timestamp}_${sanitizedFileName}`;
      default:
        return `uploads/${userId}/${timestamp}_${sanitizedFileName}`;
    }
  },

  // Validate file type and size
  validateFile(file: File, allowedTypes: string[], maxSizeMB: number = 10): string | null {
    // Check file type
    const fileType = file.type;
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.slice(0, -1));
      }
      return fileType === type;
    });

    if (!isValidType) {
      return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `File size too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null; // No validation errors
  }
};

// Resume-specific utilities
export const resumeStorage = {
  async upload(
    file: File, 
    userId: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Validate file
    const validationError = storageUtils.validateFile(
      file, 
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      5 // 5MB max
    );
    
    if (validationError) {
      throw new Error(validationError);
    }

    const path = storageUtils.generateFilePath(userId, 'resume', file.name);
    return storageUtils.uploadFile(file, path, onProgress, {
      customMetadata: {
        uploadedBy: userId,
        fileType: 'resume',
        originalName: file.name
      }
    });
  },

  async getUserResumes(userId: string) {
    return storageUtils.listFiles(`resumes/${userId}`);
  },

  async delete(path: string) {
    return storageUtils.deleteFile(path);
  }
};

// Job description utilities
export const jobDescriptionStorage = {
  async upload(
    file: File, 
    userId: string, 
    jobId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Validate file
    const validationError = storageUtils.validateFile(
      file, 
      ['application/pdf', 'text/plain'],
      2 // 2MB max
    );
    
    if (validationError) {
      throw new Error(validationError);
    }

    const path = `job_descriptions/${jobId}.pdf`; // Standardized path for functions
    return storageUtils.uploadFile(file, path, onProgress, {
      customMetadata: {
        uploadedBy: userId,
        jobId: jobId,
        fileType: 'job-description',
        originalName: file.name
      }
    });
  },

  async getJobDescription(jobId: string) {
    try {
      return await storageUtils.getDownloadURL(`job_descriptions/${jobId}.pdf`);
    } catch (error) {
      return null; // File doesn't exist
    }
  },

  async delete(jobId: string) {
    return storageUtils.deleteFile(`job_descriptions/${jobId}.pdf`);
  }
};

// Profile image utilities
export const profileImageStorage = {
  async upload(
    file: File, 
    userId: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Validate file
    const validationError = storageUtils.validateFile(
      file, 
      ['image/*'],
      2 // 2MB max
    );
    
    if (validationError) {
      throw new Error(validationError);
    }

    const path = storageUtils.generateFilePath(userId, 'profile-image', file.name);
    return storageUtils.uploadFile(file, path, onProgress, {
      customMetadata: {
        uploadedBy: userId,
        fileType: 'profile-image',
        originalName: file.name
      }
    });
  },

  async delete(path: string) {
    return storageUtils.deleteFile(path);
  }
};

export type { UploadTask, UploadMetadata };