interface ClickOutsideOptions {
  enabled?: boolean;
  exclude?: Array<HTMLElement | null>;
  handler?: (...arg: unknown[]) => void;
}

export function clickOutside(node: HTMLElement, options: ClickOutsideOptions) {
  const { exclude = [] } = options;

  const handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;

    if (!event.target || exclude.some((excludedNode) => excludedNode?.contains(target))) {
      return;
    }

    if (!node.contains(target) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent('outclick'));
    }
  };

  document.addEventListener('mousedown', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('mouseup', handleClick, true);
    },
  };
}
