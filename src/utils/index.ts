export function assertUnreachable(_: never): never {
  throw new Error('Statement should be unreachable');
}

export const generateId = () => Math.floor(Math.random() * 100);
