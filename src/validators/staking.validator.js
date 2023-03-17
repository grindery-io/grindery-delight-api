import { body, param } from 'express-validator';

export const createStakingValidator = [
  body('chainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('amount')
    .isNumeric()
    .withMessage('must be numeric value')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const getStakeByIdvalidator = [
  param('stakeId')
    .isMongoId()
    .withMessage('must not be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];
