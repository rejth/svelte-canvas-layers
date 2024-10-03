function validateIterable<T>(iterable: Iterable<T>): void {
  if (typeof iterable[Symbol.iterator] !== 'function') {
    throw new Error('The object does not have iterator and cannot be iterable');
  }
}

export function* watch<T>(executor: () => Iterable<T>): Generator<T> {
  while (true) {
    for (const value of executor()) {
      yield value;
    }
  }
}

export function* sequence(...iterables: Iterable<unknown>[]): Generator<unknown> {
  for (const iterable of iterables) {
    validateIterable(iterable);

    for (const item of iterable) {
      yield item;
    }
  }
}

export function* filter<T>(
  iterable: Iterable<T>,
  onFilter: (value: unknown) => boolean,
): Generator<T> {
  validateIterable(iterable);

  const iterator = iterable[Symbol.iterator]();

  while (true) {
    const { done, value } = iterator.next();
    if (done) return;
    if (onFilter(value)) yield value;
  }
}

export function* every<T>(iterable: Iterable<T>, predicate: (value: T) => boolean): Generator<T> {
  validateIterable(iterable);

  for (const value of iterable) {
    if (!predicate(value)) break;
    yield value;
  }
}

export function* take<T>(iterable: Iterable<T>, count: number): Generator<T> {
  validateIterable(iterable);

  const iterator = iterable[Symbol.iterator]();
  let cursor = 0;

  while (count !== cursor++) {
    const { value } = iterator.next();
    yield value;
  }
}

export function map<T>(
  iterable: Iterable<T>,
  mappers: Array<(value: T) => unknown>,
): IterableIterator<unknown[]> {
  validateIterable(iterable);

  const collectionIterator = iterable[Symbol.iterator]();

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      const mapperIterator = mappers[Symbol.iterator]();
      let mapper = mapperIterator.next();

      const next = collectionIterator.next();
      const { done } = next;
      let { value } = next;

      while (!mapper.done) {
        value = mapper.value(value);
        mapper = mapperIterator.next();
      }

      return { done, value };
    },
  };
}

export function* slice<T>(
  iterable: Iterable<T> | IterableIterator<T>,
  start: number,
  stop: number,
  step: number = 1,
): Generator<T> {
  const iterator = iterable[Symbol.iterator]();

  while (start > 0) {
    if (iterator.next().done) return;
    --start;
    --stop;
  }

  while (stop > 0) {
    const current = iterator.next();
    if (current.done) return;

    yield current.value;
    --stop;

    let n = step;
    while (n > 1) {
      if (iterator.next().done) return;
      --n;
    }
  }
}

export function enumerate<T>(
  iterable: Iterable<T> | IterableIterator<T>,
): IterableIterator<[number, T]> {
  const iterator = iterable[Symbol.iterator]();
  let cursor = 0;

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      const current = iterator.next();

      return {
        done: current.done,
        value: [cursor++, current.value],
      };
    },
  };
}

export function zip(...iterables: Iterable<unknown>[]): IterableIterator<unknown[]> {
  const iterators = Array.from(iterables).map((iterable) => iterable[Symbol.iterator]());

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      const results = iterators.map((iterator) => iterator.next());

      return {
        done: results.every((res) => res.done),
        value: results.map((res) => res.value),
      };
    },
  };
}

export function onlyEvent<E extends keyof HTMLElementEventMap>(
  eventType: E,
): (event: Event) => boolean {
  return (event) => event.type === eventType;
}
