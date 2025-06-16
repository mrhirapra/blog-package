import React from 'react';
import { BlogEditorConfig } from './types';
/**
 * Check if client IP is allowed to access the editor
 * @param clientIP The client IP address
 * @param allowedIPs Array of allowed IPs or CIDR ranges
 * @returns boolean indicating if access is allowed
 */
export declare function checkIPAccess(clientIP: string, allowedIPs?: string[]): boolean;
/**
 * Check for multiple React instances
 * @param appReact The React instance from the host application
 */
export declare function checkReactInstance(appReact: typeof React): void;
/**
 * Validate an image file against configuration
 * @param file The image file to validate
 * @param config Blog editor configuration
 * @returns Validation result
 */
export declare function validateImageFile(file: File, config: BlogEditorConfig): {
    valid: boolean;
    error?: string;
};
/**
 * Convert file to base64 string
 * @param file The file to convert
 * @returns Promise resolving to base64 string
 */
export declare function fileToBase64(file: File): Promise<string>;
/**
 * Generate a unique ID
 * @returns Generated ID string
 */
export declare function generateId(): string;
