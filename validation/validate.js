

 const  validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ success: false, errors: error.details.map((d) => d.message) });
  next();
};

export default validate;

// Escape characters that have specific meaning in regex, so user input is treated as a literal string match instead of being compiled as a regex pattern.
export const escapeRegex = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');