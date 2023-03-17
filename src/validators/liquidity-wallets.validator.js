import { body, validationResult, query, param } from 'express-validator';

export const liquidityWalletValidator = [
  body('walletAddress').isString().withMessage('must be string value'),
  body('chainId').isString().withMessage('must be string value'),
];
