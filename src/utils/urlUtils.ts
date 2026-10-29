/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility functions for clean URL formatting and port stripping across Nexus Empire.
 */

export function getCleanOrigin(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return origin.replace(':8443', '').replace(':3000', '');
}

export function cleanUrlPort(url: string): string {
  if (!url) return '';
  return url.replace(':8443', '').replace(':3000', '');
}
