// ============================================
// 事件总线 - 插件系统核心
// ============================================

import type { EventHandler, WorldEventPayload } from '../types';

type EventName = 'entity:created' | 'entity:updated' | 'entity:deleted' | string;

class EventBus {
  private listeners: Map<EventName, Set<EventHandler>> = new Map();

  on(event: EventName, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: EventName, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: EventName, payload: WorldEventPayload): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventBus] Handler error for event "${event}":`, error);
        }
      });
    }
    // Also emit to wildcard listeners
    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventBus] Wildcard handler error:`, error);
        }
      });
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  getListenerCount(event: EventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// Singleton
export const eventBus = new EventBus();
export default EventBus;
