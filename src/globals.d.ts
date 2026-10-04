// Override for CSS custom properties in React style objects
declare global {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

export {}
