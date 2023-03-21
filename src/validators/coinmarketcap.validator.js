import { body, param, query } from 'express-validator';

export const coinMarketCapGetQuoteValidator = [
  query('token')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];
