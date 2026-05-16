export const safeArray = <T>(value: unknown): T[] => {
  return Array.isArray(value) ? value : [];
};

export const safeObject = <T extends object>(value: unknown): T => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : ({} as T);
};
