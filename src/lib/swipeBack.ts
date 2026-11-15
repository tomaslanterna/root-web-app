// Only the last mounted back gesture is live, so a full-screen layer with its
// own back button wins over the route underneath it.
const owners: object[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function registerSwipeBack(owner: object) {
  owners.push(owner);
  notify();
  return () => {
    const index = owners.lastIndexOf(owner);
    if (index !== -1) owners.splice(index, 1);
    notify();
  };
}

export function subscribeSwipeBack(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function isActiveSwipeBack(owner: object) {
  return owners.at(-1) === owner;
}
