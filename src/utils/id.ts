// ============================================
// ID 生成工具
// ============================================

import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

// Short human-friendly ID for display
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}
