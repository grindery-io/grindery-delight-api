import { body, param, query } from 'express-validator';
import { validateFields } from '../utils/validators-utils.js';

export const updateOrderUserValidator = [
  body('rpc')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('grtPoolAddress')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];
