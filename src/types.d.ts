// Type extension for CSS custom properties
declare global {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
