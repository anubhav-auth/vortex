// Operational errors thrown by controllers. The global error middleware
// recognises `AppError` and emits a clean JSON response without leaking
// stack traces or internal details.

export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = true; // safe to send `message` to client
  }
}

export const BadRequest   = (msg = 'Bad request',   details) => new AppError(400, 'BAD_REQUEST',   msg, details);
export const Unauthorized = (msg = 'Unauthorized',  details) => new AppError(401, 'UNAUTHORIZED',  msg, details);
export const Forbidden    = (msg = 'Forbidden',     details) => new AppError(403, 'FORBIDDEN',     msg, details);
export const NotFound     = (msg = 'Not found',     details) => new AppError(404, 'NOT_FOUND',     msg, details);
export const Conflict     = (msg = 'Conflict',      details) => new AppError(409, 'CONFLICT',      msg, details);
export const Unprocessable = (msg = 'Unprocessable entity', details) => new AppError(422, 'UNPROCESSABLE', msg, details);
