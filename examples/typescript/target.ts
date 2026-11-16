// SPDX-License-Identifier: Apache-2.0
// Compile with TypeScript 5.9.3. This file is not passed directly to Node.
export function classify(data: Uint8Array): string {
  if (data.length === 0) return 'empty';
  if (data[0] === 0x41) {
    if (data.length > 1 && data[1] === 0x42) return 'AB';
    return 'A';
  }
  if (data[0] === 0x42) return 'B';
  return 'other';
}
export function fuzz(data: Uint8Array): void { classify(data); }
