import { body, param, query, check } from 'express-validator';

export const createBlockchainValidator = [
  body('chainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('caipId')
    .custom((value) => {
      if (/[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}/.test(value)) {
        return true;
      }
      throw new Error('caipId field does not match the CAIP-2 specifications.');
    })
    .notEmpty()
    .withMessage('must not be empty'),
  body('label')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('icon')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('rpc')
    .isArray()
    .withMessage('must be an array')
    .notEmpty()
    .withMessage('must not be empty'),
  check('rpc.*').isString().withMessage('must be an array of string'),
  body('nativeTokenSymbol')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isEvm')
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isTestnet')
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

export const getBlockchainByIdValidator = [
  param('blockchainId')
    .isMongoId()
    .withMessage('must be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const modifyBlockchainValidator = [
  param('blockchainId')
    .isMongoId()
    .withMessage('must be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
  check('chainId').optional().isString().withMessage('must be string value'),
  check('caipId')
    .optional()
    .custom((value) => {
      if (/[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}/.test(value)) {
        return true;
      }
      throw new Error('caipId field does not match the CAIP-2 specifications.');
    }),
  check('label').optional().isString().withMessage('must be string value'),
  check('icon').optional().isString().withMessage('must be string value'),
  check('rpc.*')
    .optional()
    .isString()
    .withMessage('must be an array of string'),
  check('nativeTokenSymbol')
    .optional()
    .isString()
    .withMessage('must be string value'),
  check('isEvm').optional().isBoolean().withMessage('must be boolean value'),
  check('isTestnet')
    .optional()
    .isBoolean()
    .withMessage('must be boolean value'),
  check('isActive').optional().isBoolean().withMessage('must be boolean value'),
];
