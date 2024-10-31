declare global {
  namespace App {}

  namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:outclick'?: (e: CustomEvent) => void;
    }
  }
}

export {};
