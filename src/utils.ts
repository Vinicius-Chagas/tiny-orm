export function toString(val: unknown) {
  if (typeof val !== 'string') return val as string;
  return `'${String(val)}'`;
}
