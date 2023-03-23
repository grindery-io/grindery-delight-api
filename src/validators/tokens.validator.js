import { body, param, query, check, matchedData } from 'express-validator';

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
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
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
  check('coinmarketcapId')
    .optional()
    .isString()
    .withMessage('must be string value'),
  check('symbol').optional().isString().withMessage('must be string value'),
  check('icon').optional().isString().withMessage('must be string value'),
  check('chainId').optional().isString().withMessage('must be string value'),
  check('address').optional().isString().withMessage('must be string value'),
  check('isNative').optional().isBoolean().withMessage('must be boolean value'),
  check('isActive').optional().isBoolean().withMessage('must be boolean value'),
];
