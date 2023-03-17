import { validationResult } from 'express-validator';

export const validateResult = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array();
  }
  return [];
};
