export const isValid = (joiSchema, considerHeaders = false) => {
  return (req, res, next) => {
    const language = req.headers.language || 'en'; // Default to English
    const schema = joiSchema(language); // Pass language to schema

    let copyReq = {
      ...req.body,
      ...req.params,
      ...req.query,
    };

    if (req.headers?.authorization && considerHeaders) {
      copyReq = { authorization: req.headers.authorization };
    }
    if (req.files || req.file) {
      copyReq.file = req.files || req.file;
    }

    const { error } = schema.validate(copyReq, { abortEarly: false });

    if (error) {
      return res.status(422).json({
        message:'Validation Error',
        status_code: 422,
        errors: Object.fromEntries(
          error.details.map((err) => [err.context.key, err.message])
        ),
      });
    } else {
      return next();
    }
  };
};