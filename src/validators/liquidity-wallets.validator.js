import { body, validationResult, query, param } from 'express-validator';

export const createLiquidityWalletValidator = [
  body('walletAddress').isString().withMessage('must be string value'),
  body('chainId').isString().withMessage('must be string value'),
];

export const getLiquidityWalletValidator = [
  body('chainId').isString().withMessage('must be string value'),
];
