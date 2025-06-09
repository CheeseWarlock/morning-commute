type KeysWithPayload<T> = {
  [K in keyof T]: T[K] extends void ? never : K;
}[keyof T];

type KeysWithNoPayload<T> = {
  [K in keyof T]: T[K] extends void ? K : never;
}[keyof T];

/**
 * A strongly-typed event dispatcher.
 * Pass a type to it with keys of the event names and values of the payloads.
 * For example, `new EventDispatcher<{ EVENT_A: void; EVENT_B: number; }>`
 * If `void` is the payload, no second parameter can be passed to `publish` for that event.
 */
export class EventDispatcher<
  Events extends Record<string, any> = Record<string, any>,
> {
  _listeners: Map<keyof Events, Function[]> = new Map();

  /**
   * Add a function to call when a given key is published.
   * @param key
   * @param callback the function to call when the event is published.
   */
  on<K extends keyof Events>(key: K, callback: (data: Events[K]) => void) {
    if (!this._listeners.get(key)) this._listeners.set(key, []);
    const arr = this._listeners.get(key);
    arr?.push(callback);
  }

  /**
   * Remove a function from the list to call when a given key is published.
   * @param key
   * @param callback the function that was previously passed to `on`.
   * @returns
   */
  off<K extends keyof Events>(key: K, callback: (data: Events[K]) => void) {
    if (!this._listeners.get(key)) return;

    this._listeners.set(
      key,
      this._listeners.get(key)!.filter((func) => func !== callback),
    );
  }

  /**
   * Clear all event listeners for a given key.
   * @param key
   */
  clear<K extends keyof Events>(key: K) {
    this._listeners.set(key, []);
  }

  /**
   * Publish an event with no payload.
   * @param key
   */
  publish<K extends keyof Pick<Events, KeysWithNoPayload<Events>>>(
    key: K,
  ): void;
  /**
   * Publish an event with a payload.
   * @param key
   * @param data
   */
  publish<K extends keyof Pick<Events, KeysWithPayload<Events>>>(
    key: K,
    data: Events[K],
  ): void;
  publish<K extends keyof Events>(key: K, data?: Events[K]): void {
    if (!this._listeners.get(key)) return;

    this._listeners.get(key)!.forEach((func) => func(data));
    return;
  }
}
