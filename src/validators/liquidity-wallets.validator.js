import { body, query, param } from 'express-validator';

export const createLiquidityWalletValidator = [
  body('walletAddress').isString().withMessage('must be string value'),
  body('chainId').isString().withMessage('must be string value'),
  body().custom((value, { req }) => {
    validateFields(req.body, ['walletAddress', 'chainId'], 'body');
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

export const updateLiquidityWalletValidator = [
  body('walletAddress')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  body('chainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  body('tokenId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  body('amount')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  body().custom((value, { req }) => {
    validateFields(
      req.body,
      ['walletAddress', 'chainId', 'tokenId', 'amount'],
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

export const getLiquidityWalletValidator = [
  query('chainId').notEmpty().withMessage('should not be empty'),
];

export const getSingleLiquidityWalletValidator = [
  query('walletAddress')
    .isString()
    .withMessage('must be string value')
    .optional(),
  query('chainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  query('userId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
];

export const deleteLiquidityWalletValidator = [
  query('walletAddress').notEmpty().withMessage('should not be empty'),
  query('chainId').notEmpty().withMessage('should not be empty'),
];

export const getWalletByIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('must be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];
