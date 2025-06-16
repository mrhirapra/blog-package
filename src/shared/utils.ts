import React from 'react';
import { BlogEditorConfig } from './types';

/**
 * Check if client IP is allowed to access the editor
 * @param clientIP The client IP address
 * @param allowedIPs Array of allowed IPs or CIDR ranges
 * @returns boolean indicating if access is allowed
 */
export function checkIPAccess(clientIP: string, allowedIPs: string[] = ['*']): boolean {
  if (!allowedIPs || allowedIPs.length === 0) return false;
  if (allowedIPs.includes('*')) return true;

  const isIPInRange = (ip: string, range: string): boolean => {
    if (range.includes('/')) {
      const [rangeIP, rangeBits] = range.split('/');
      const mask = (-1 << (32 - parseInt(rangeBits))) >>> 0;
      return (ipToInt(ip) & mask) === (ipToInt(rangeIP) & mask);
    }
    return ip === range;
  };

  const ipToInt = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  };

  return allowedIPs.some(allowedIP => isIPInRange(clientIP, allowedIP));
}

/**
 * Check for multiple React instances
 * @param appReact The React instance from the host application
 */
export function checkReactInstance(appReact: typeof React): void {
  if (React !== appReact) {
    console.warn(
      'Multiple React instances detected. This may cause issues with hooks and context.',
      '\nConsider adding "react" and "react-dom" as peer dependencies.'
    );
  }
}

/**
 * Validate an image file against configuration
 * @param file The image file to validate
 * @param config Blog editor configuration
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  config: BlogEditorConfig
): { valid: boolean; error?: string } {
  const {
    maxImageSize = 5 * 1024 * 1024,
    allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = config;

  if (file.size > maxImageSize) {
    return {
      valid: false,
      error: `Image size exceeds maximum allowed size of ${maxImageSize / 1024 / 1024}MB`,
    };
  }

  if (!allowedImageTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Image type not allowed. Allowed types: ${allowedImageTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Convert file to base64 string
 * @param file The file to convert
 * @returns Promise resolving to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error('File reading failed: ' + error));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a unique ID
 * @returns Generated ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
