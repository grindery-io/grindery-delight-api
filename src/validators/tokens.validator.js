import { body, param, query } from 'express-validator';
import { validateFields } from '../utils/validators-utils.js';

export const createTokenValidator = [
  body('coinmarketcapId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('symbol')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('icon')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('chainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('address')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isNative')
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isActive')
    .not()
    .isString()
    .withMessage('must not be string value')
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body().custom((value, { req }) => {
    validateFields(
      req.body,
      [
        'coinmarketcapId',
        'symbol',
        'icon',
        'chainId',
        'address',
        'isNative',
        'isActive',
      ],
      'body'
    );
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

export const getTokenByIdValidator = [
  param('tokenId')
    .isMongoId()
    .withMessage('must be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const modifyTokenValidator = [
  param('tokenId')
    .isMongoId()
    .withMessage('must be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
  body('coinmarketcapId')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('symbol')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('icon')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('chainId')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('address')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isNative')
    .optional()
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isActive')
    .optional()
    .not()
    .isString()
    .withMessage('must not be string value')
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body().custom((value, { req }) => {
    validateFields(
      req.body,
      [
        'coinmarketcapId',
        'symbol',
        'icon',
        'chainId',
        'address',
        'isNative',
        'isActive',
      ],
      'body'
    );
    return true;
  }),
  query().custom((value, { req }) => {
    validateFields(req.query, [], 'query');
    return true;
  }),
  param().custom((value, { req }) => {
    validateFields(req.params, ['tokenId'], 'params');
    return true;
  }),
];
