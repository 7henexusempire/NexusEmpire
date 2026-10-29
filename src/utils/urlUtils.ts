/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility functions for clean URL formatting and port stripping across Nexus Empire.
 */

export function cleanUrlPort(url: string): string {
  if (!url) return '';
  // Strips :8443, :3000, and :8080 from host or URL string
  return url.replace(/:8443/g, '').replace(/:3000/g, '').replace(/:8080/g, '');
}

export function getCleanOrigin(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return cleanUrlPort(origin);
}
