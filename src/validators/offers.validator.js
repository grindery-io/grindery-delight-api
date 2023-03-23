import { body, param, query } from 'express-validator';

export const createOfferValidator = [
  body('chainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('min')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('max')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('tokenId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('token')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('tokenAddress')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('offerId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('isActive')
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const getOfferByOfferIdValidator = [
  query('offerId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const getOfferByIdValidator = [
  query('id')
    .isMongoId()
    .withMessage('must not be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const deleteOfferValidator = [
  param('offerId').notEmpty().withMessage('must not be empty'),
];

export const updateOfferValidator = [
  body('offerId').notEmpty().withMessage('must not be empty'),
];

export const addTradeOfferValidator = [
  body('amountGRT')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  body('offerId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  body('destAddr')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  body('user')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  body('amountToken')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
  body('tradeId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('should not be empty'),
];
