export const logEvent = (eventName: string, data: Record<string, unknown>) => {
  console.log(`[${eventName}]`, data);
};
