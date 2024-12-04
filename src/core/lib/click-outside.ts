interface ClickOutsideOptions {
  enabled: boolean;
  exclude: Array<string>;
  handler: (...arg: unknown[]) => void;
}

export function clickOutside(node: HTMLElement, options?: Partial<ClickOutsideOptions>) {
  let settings = options || {};

  const handleClick = (event: Event): void => {
    const target = <HTMLElement>event.target;

    const excludedNodes = (settings?.exclude || [])
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!target || excludedNodes.some((node) => node?.contains(target))) {
      return;
    }

    if (!node.contains(target) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent('outclick'));
      settings?.handler?.();
    }
  };

  document.addEventListener('mousedown', handleClick, true);

  return {
    update(options: Partial<ClickOutsideOptions>) {
      settings = options;
    },
    destroy() {
      document.removeEventListener('mouseup', handleClick, true);
    },
  };
}
