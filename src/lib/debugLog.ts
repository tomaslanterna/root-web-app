/**
 * Logs de diagnóstico solo en desarrollo. En producción (y en la app nativa, donde cada console.log cruza del WebView
 * al lado nativo) no hacen nada. Para errores y avisos seguí usando console.error / console.warn.
 */
export function debugLog(...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production") console.log(...args);
}
