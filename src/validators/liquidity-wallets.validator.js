import { body, validationResult, query, param, check } from 'express-validator';

export const createLiquidityWalletValidator = [
  body('walletAddress').isString().withMessage('must be string value'),
  body('chainId').isString().withMessage('must be string value'),
];

export const updateLiquidityWalletValidator = [
  query('walletAddress').notEmpty().withMessage('should not be empty'),
  query('chainId').notEmpty().withMessage('should not be empty'),
  query('tokenId').notEmpty().withMessage('should not be empty'),
  query('amount').notEmpty().withMessage('should not be empty'),
];

export const getLiquidityWalletValidator = [
  query('chainId').notEmpty().withMessage('should not be empty'),
];

export const deleteLiquidityWalletValidator = [
  query('walletAddress').notEmpty().withMessage('should not be empty'),
  query('chainId').notEmpty().withMessage('should not be empty'),
];
