import { body, param, query } from 'express-validator';

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

export const updateStakingValidator = [
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

export const getStakeByIdValidator = [
  param('stakeId')
    .isMongoId()
    .withMessage('must be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const deleteStakeValidator = [
  query('chainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];
