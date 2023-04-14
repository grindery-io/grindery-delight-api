import { body, param, query, check } from 'express-validator';
import { validateFields } from '../utils/validators-utils.js';

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
  check('rpc.*').isURL().withMessage('must be an array of URL'),
  body('nativeTokenSymbol')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('transactionExplorerUrl')
    .isURL()
    .withMessage('must be URL')
    .notEmpty()
    .withMessage('must not be empty'),
  body('addressExplorerUrl')
    .isURL()
    .withMessage('must be URL')
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
  body().custom((value, { req }) => {
    validateFields(
      req.body,
      [
        'chainId',
        'caipId',
        'label',
        'icon',
        'rpc',
        'nativeTokenSymbol',
        'isEvm',
        'isTestnet',
        'isActive',
        'transactionExplorerUrl',
        'addressExplorerUrl',
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
  body('chainId')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('caipId')
    .optional()
    .custom((value) => {
      if (/[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}/.test(value)) {
        return true;
      }
      throw new Error('caipId field does not match the CAIP-2 specifications.');
    })
    .notEmpty()
    .withMessage('must not be empty'),
  body('label')
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
  body('rpc')
    .optional()
    .isArray()
    .withMessage('must be an array')
    .notEmpty()
    .withMessage('must not be empty'),
  body('rpc.*').optional().isURL().withMessage('must be an array of URL'),
  body('nativeTokenSymbol')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isEvm')
    .optional()
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isTestnet')
    .optional()
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('transactionExplorerUrl')
    .optional()
    .isURL()
    .withMessage('must be URL')
    .notEmpty()
    .withMessage('must not be empty'),
  body('addressExplorerUrl')
    .optional()
    .isURL()
    .withMessage('must be URL')
    .notEmpty()
    .withMessage('must not be empty'),
  body().custom((value, { req }) => {
    validateFields(
      req.body,
      [
        'chainId',
        'caipId',
        'label',
        'icon',
        'rpc',
        'nativeTokenSymbol',
        'isEvm',
        'isTestnet',
        'isActive',
        'transactionExplorerUrl',
        'addressExplorerUrl',
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
    validateFields(req.params, ['blockchainId'], 'params');
    return true;
  }),
];
