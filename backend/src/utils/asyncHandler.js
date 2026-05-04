// Wraps an async route handler so a thrown/rejected error is forwarded to
// Express's error middleware. Express 4 does not await handler return values.

export const ah = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
