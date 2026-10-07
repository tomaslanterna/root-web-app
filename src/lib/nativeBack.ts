type BackHandler = () => void;
const handlers: BackHandler[] = [];

// The last mounted overlay gets Back before the route underneath it.
export function registerNativeBackHandler(handler: BackHandler) {
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  };
}

export function consumeNativeBack() {
  const handler = handlers.at(-1);
  if (!handler) return false;
  handler();
  return true;
}

export function nativeBackDestination(pathname: string, canGoBack: boolean) {
  if (pathname === "/" || pathname === "/feed") return "confirm-exit";
  if (canGoBack) return "history-back";
  // A notification/deep link may have no in-app history yet.
  for (const parent of ["/chat", "/communities", "/events", "/match", "/profile"]) {
    if (pathname.startsWith(`${parent}/`)) return parent;
  }
  return "/feed";
}
