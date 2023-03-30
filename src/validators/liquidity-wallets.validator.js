import { body, query, param } from 'express-validator';

export const createLiquidityWalletValidator = [
  body('walletAddress').isString().withMessage('must be string value'),
  body('chainId').isString().withMessage('must be string value'),
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
