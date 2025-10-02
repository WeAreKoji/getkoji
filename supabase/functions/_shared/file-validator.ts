// Magic number signatures for file validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

const MAX_FILE_SIZES: Record<string, number> = {
  'profile-photos': 5 * 1024 * 1024, // 5MB
  'creator-content': 50 * 1024 * 1024, // 50MB
  'id-documents': 10 * 1024 * 1024, // 10MB
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
}

export function validateFileMagicNumber(
  buffer: Uint8Array,
  expectedMimeType: string
): FileValidationResult {
  const signatures = FILE_SIGNATURES[expectedMimeType];
  
  if (!signatures) {
    return { valid: false, error: `Unsupported file type: ${expectedMimeType}` };
  }

  const isValid = signatures.some(signature => {
    if (buffer.length < signature.length) return false;
    return signature.every((byte, index) => buffer[index] === byte);
  });

  if (!isValid) {
    return { 
      valid: false, 
      error: `File content does not match declared type ${expectedMimeType}` 
    };
  }

  return { valid: true, mimeType: expectedMimeType };
}

export function validateFileSize(
  fileSize: number,
  bucket: string
): FileValidationResult {
  const maxSize = MAX_FILE_SIZES[bucket];
  
  if (!maxSize) {
    return { valid: false, error: `Unknown bucket: ${bucket}` };
  }

  if (fileSize > maxSize) {
    return { 
      valid: false, 
      error: `File size ${fileSize} exceeds maximum ${maxSize} bytes for ${bucket}` 
    };
  }

  return { valid: true };
}

export function validateImageDimensions(
  width: number,
  height: number,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): FileValidationResult {
  if (width > maxWidth || height > maxHeight) {
    return {
      valid: false,
      error: `Image dimensions ${width}x${height} exceed maximum ${maxWidth}x${maxHeight}`,
    };
  }

  if (width < 100 || height < 100) {
    return {
      valid: false,
      error: `Image dimensions ${width}x${height} are too small (minimum 100x100)`,
    };
  }

  return { valid: true };
}

export async function validateFile(
  file: File | Blob,
  bucket: string,
  expectedMimeType: string
): Promise<FileValidationResult> {
  // Validate file size
  const sizeValidation = validateFileSize(file.size, bucket);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Read first bytes for magic number validation
  const buffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Validate magic number
  const magicValidation = validateFileMagicNumber(bytes, expectedMimeType);
  if (!magicValidation.valid) {
    return magicValidation;
  }

  return { valid: true, mimeType: expectedMimeType };
}
