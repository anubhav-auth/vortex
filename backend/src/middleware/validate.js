// Validate `body`, `params`, and/or `query` against Zod schemas.
//
// Usage:
//   router.post('/', validate({ body: createUserSchema }), handler)
//   router.get('/:id', validate({ params: idParamSchema, query: listQuerySchema }), handler)
//
// On success the request fields are REPLACED with the parsed/coerced data,
// so handlers always see clean, typed values.

export const validate = (schemas) => (req, res, next) => {
  const errors = {};

  for (const part of ['body', 'params', 'query']) {
    const schema = schemas[part];
    if (!schema) continue;
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      errors[part] = result.error.flatten().fieldErrors;
    } else {
      // `req.query` and `req.params` are getters in Express 5; assign per-key.
      if (part === 'body') {
        req.body = result.data;
      } else {
        for (const k of Object.keys(result.data)) req[part][k] = result.data[k];
      }
    }
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
    });
  }

  next();
};
