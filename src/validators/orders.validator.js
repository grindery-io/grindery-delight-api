import { body, param, query } from 'express-validator';

export const createOrderValidator = [
  body('orderId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('amountTokenDeposit')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('addressTokenDeposit')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('chainIdTokenDeposit')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('destAddr')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('amountTokenOffer')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('offerId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const getOrderByOrderIdValidator = [
  query('orderId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
];

export const getOrderByIdValidator = [
  query('id')
    .isMongoId()
    .withMessage('must be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const setOrderStatusValidator = [
  body('orderId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isComplete')
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
];
