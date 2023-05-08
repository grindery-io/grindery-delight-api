import { body } from 'express-validator';

export const updateOfferOnChainValidator = [
  body('rpc')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];
