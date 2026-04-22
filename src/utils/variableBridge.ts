const bridgedVariables: Record<string, number> = {};

export const getBridgedVariables = () => {
  return { ...bridgedVariables };
};

export const updateBridgedVariable = (path: string, value: number) => {
  bridgedVariables[path] = value;
};
