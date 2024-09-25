function validateIterable<T>(asyncIterable: AsyncIterable<T>): void {
  if (typeof asyncIterable[Symbol.asyncIterator] !== 'function') {
    throw new Error('The object does not have asynchronous iterator and cannot be iterable');
  }
}

export async function* watch<T>(executor: () => AsyncIterable<T>): AsyncGenerator<T> {
  while (true) {
    for await (const value of executor()) {
      yield value;
    }
  }
}

export async function* sequence(...asyncIterables: AsyncIterable<any>[]): AsyncGenerator<any> {
  for (const iterable of asyncIterables) {
    validateIterable(iterable);

    for await (const item of iterable) {
      yield item;
    }
  }
}

export async function* filter<T>(
  asyncIterable: AsyncIterable<T>,
  onFilter: (value: any) => boolean,
): AsyncGenerator<T> {
  validateIterable(asyncIterable);
  const asyncIterator = asyncIterable[Symbol.asyncIterator]();

  while (true) {
    const { done, value } = await asyncIterator.next();
    if (done) return;
    if (onFilter(value)) yield value;
  }
}

export async function* every<T>(
  asyncIterable: AsyncIterable<T>,
  predicate: (value: T) => boolean,
): AsyncGenerator<T> {
  validateIterable(asyncIterable);

  for await (const value of asyncIterable) {
    if (!predicate(value)) break;
    yield value;
  }
}

export async function* any(...asyncIterables: AsyncIterable<any>[]): AsyncGenerator<any> {
  const asyncIterators = asyncIterables.map((el) => el[Symbol.asyncIterator]());

  while (true) {
    yield (await Promise.race(asyncIterators.map((item) => item.next()))).value;
  }
}

export async function* take<T>(asyncIterable: AsyncIterable<T>, count: number): AsyncGenerator<T> {
  validateIterable(asyncIterable);
  const asyncIterator = asyncIterable[Symbol.asyncIterator]();
  let cursor = 0;

  while (count !== cursor++) {
    const { value } = await asyncIterator.next();
    yield value;
  }
}

export function onlyEvent<E extends keyof HTMLElementEventMap>(
  eventType: E,
): (event: Event) => boolean {
  return (event) => event.type === eventType;
}
