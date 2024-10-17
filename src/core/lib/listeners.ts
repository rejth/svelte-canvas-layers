export type Target = (Window & typeof globalThis) | Document | HTMLElement;

export function on<E extends keyof HTMLElementEventMap>(
  target: Target,
  eventType: E,
): AsyncIterableIterator<Event> {
  if (!target) throw new Error('There is no such event target in DOM');

  return {
    [Symbol.asyncIterator]() {
      return this;
    },

    async next(): Promise<IteratorResult<Event>> {
      return new Promise((resolve) => {
        target.addEventListener(eventType, (event) => resolve({ done: false, value: event }), {
          once: true,
        });
      });
    },
  };
}

export function once<E extends keyof HTMLElementEventMap>(
  target: Target,
  eventType: E,
): AsyncIterableIterator<Event> {
  if (!target) throw new Error('There is no such event target in DOM');
  let isEventFired = false;

  return {
    [Symbol.asyncIterator]() {
      return this;
    },

    async next(): Promise<IteratorResult<Event>> {
      return new Promise((resolve) => {
        if (isEventFired) {
          resolve({ done: true, value: undefined });
          return;
        }

        target.addEventListener(
          eventType,
          (event) => {
            isEventFired = true;
            resolve({ done: false, value: event });
          },
          { once: true },
        );
      });
    },
  };
}
