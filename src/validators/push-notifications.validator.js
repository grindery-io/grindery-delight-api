import { body, param, query } from 'express-validator';
import { validateFields } from '../utils/validators-utils.js';

export const updateNotificationTokenValidator = [
  body('token')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body().custom((value, { req }) => {
    validateFields(req.body, ['token'], 'body');
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

export const getNotificationTokenValidator = [
  param('token').notEmpty().withMessage('must not be empty'),
];
