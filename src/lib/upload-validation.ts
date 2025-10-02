/**
 * Client-side file upload validation
 * Validates files before upload to prevent invalid uploads
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const FILE_CONSTRAINTS = {
  'profile-photos': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 100, height: 100 },
  },
  'creator-content': {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 100, height: 100 },
  },
  'id-documents': {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 100, height: 100 },
  },
} as const;

export type BucketName = keyof typeof FILE_CONSTRAINTS;

/**
 * Validate file size
 */
export function validateFileSize(file: File, bucket: BucketName): ValidationResult {
  const constraints = FILE_CONSTRAINTS[bucket];
  
  if (file.size > constraints.maxSize) {
    const sizeMB = (constraints.maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size must be less than ${sizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(file: File, bucket: BucketName): ValidationResult {
  const constraints = FILE_CONSTRAINTS[bucket];
  
  if (!constraints.allowedTypes.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${constraints.allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  file: File,
  bucket: BucketName
): Promise<ValidationResult> {
  // Skip dimension validation for non-images
  if (!file.type.startsWith('image/')) {
    return { valid: true };
  }

  const constraints = FILE_CONSTRAINTS[bucket];

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (
        img.width > constraints.maxDimensions.width ||
        img.height > constraints.maxDimensions.height
      ) {
        resolve({
          valid: false,
          error: `Image dimensions ${img.width}x${img.height} exceed maximum ${constraints.maxDimensions.width}x${constraints.maxDimensions.height}`,
        });
        return;
      }

      if (
        img.width < constraints.minDimensions.width ||
        img.height < constraints.minDimensions.height
      ) {
        resolve({
          valid: false,
          error: `Image dimensions ${img.width}x${img.height} are below minimum ${constraints.minDimensions.width}x${constraints.minDimensions.height}`,
        });
        return;
      }

      resolve({ valid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Failed to load image for validation',
      });
    };

    img.src = url;
  });
}

/**
 * Validate file completely before upload
 */
export async function validateFile(file: File, bucket: BucketName): Promise<ValidationResult> {
  // Check size
  const sizeResult = validateFileSize(file, bucket);
  if (!sizeResult.valid) return sizeResult;

  // Check type
  const typeResult = validateFileType(file, bucket);
  if (!typeResult.valid) return typeResult;

  // Check dimensions (for images)
  const dimensionsResult = await validateImageDimensions(file, bucket);
  if (!dimensionsResult.valid) return dimensionsResult;

  return { valid: true };
}
