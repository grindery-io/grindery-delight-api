import { body, param, query } from 'express-validator';

export const createTradeValidator = [
  body('idTrade')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('amountGRT')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('destAddr')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('amountToken')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('idOffer')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const getTradeByTradeIdValidator = [
  query('idTrade')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
];

export const getTradeByIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('must not be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const setTradeStatusValidator = [
  body('idTrade')
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
