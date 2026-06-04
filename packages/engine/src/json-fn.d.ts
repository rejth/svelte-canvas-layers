// Ambient type declarations for the untyped `json-fn` CommonJS package
// (https://www.npmjs.com/package/json-fn). No `@types/json-fn` exists.
// json-fn extends JSON.stringify/parse to (de)serialize functions — used by the
// worker render path to ship a self-contained render fn's SOURCE across the
// main-thread → worker boundary (WRK-02). Only the two methods the engine uses
// are typed; the default export is the JSONfn object.
declare module 'json-fn' {
  interface JSONfn {
    stringify(value: unknown, replacer?: unknown, space?: string | number): string
    parse<T = unknown>(text: string, reviver?: unknown): T
  }

  const JSONfn: JSONfn
  export default JSONfn
}
