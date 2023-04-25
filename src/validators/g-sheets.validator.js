import { body, param, query, check, matchedData } from 'express-validator';
import { validateFields } from '../utils/validators-utils.js';

export const createUserInfoValidator = [
  body('email')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('walletAddress')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('offerId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body().custom((value, { req }) => {
    validateFields(req.body, ['email', 'walletAddress', 'offerId'], 'body');
    return true;
  }),
  query().custom((value, { req }) => {
    validateFields(req.query, [], 'query');
    return true;
  }),
  param().custom((value, { req }) => {
    validateFields(req.params, [], 'params');
    return true;
  }),
];
