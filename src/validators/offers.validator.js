import { body, param, query } from 'express-validator';
import { validateFields } from '../utils/validators-utils.js';

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
  body('hash')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('offerId').isString().withMessage('must be string value'),
  body('isActive')
    .not()
    .isString()
    .withMessage('must not be string value')
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('estimatedTime')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('exchangeRate')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('exchangeToken')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('exchangeChainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('provider').isString().withMessage('must be string value'),
  body('title').isString().withMessage('must be string value'),
  body('image').isString().withMessage('must be string value'),
  body('amount').isString().withMessage('must be string value'),
  body().custom((value, { req }) => {
    validateFields(
      req.body,
      [
        'chainId',
        'min',
        'max',
        'tokenId',
        'token',
        'tokenAddress',
        'hash',
        'exchangeRate',
        'exchangeToken',
        'exchangeChainId',
        'estimatedTime',
        'provider',
        'offerId',
        'isActive',
        'title',
        'image',
        'amount',
      ],
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
  body().custom((value, { req }) => {
    const { min, max } = req.body;
    if (parseFloat(min) > parseFloat(max)) {
      throw new Error('min must be less than max');
    }
    // validation is successful
    return true;
  }),
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
    .withMessage('must be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const getOffersValidator = [
  query('exchangeChainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  query('exchangeToken')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  query('chainId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  query('token')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  query('limit').optional().isInt().withMessage('must be int value'),
  query('offset').optional().isInt().withMessage('must be int value'),
];

export const getOffersPaginationValidator = [
  query('limit').optional().isInt().withMessage('must be int value'),
  query('offset').optional().isInt().withMessage('must be int value'),
];

export const deleteOfferValidator = [
  param('offerId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const validationOfferValidator = [
  body('activating')
    .not()
    .isString()
    .withMessage('must not be string value')
    .isBoolean()
    .withMessage('must be boolean value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('offerId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('hash')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const updateOfferValidator = [
  body('offerId')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('chainId')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('min')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('max')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('tokenId')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('token')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('tokenAddress')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  param('offerId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('estimatedTime')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('exchangeRate')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('exchangeToken')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('exchangeChainId')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('provider')
    .optional()
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('title').optional().isString().withMessage('must be string value'),
  body('image').optional().isString().withMessage('must be string value'),
  body('amount').optional().isString().withMessage('must be string value'),
  body().custom((value, { req }) => {
    validateFields(
      req.body,
      [
        'offerId',
        'chainId',
        'min',
        'max',
        'tokenId',
        'token',
        'tokenAddress',
        'exchangeRate',
        'exchangeToken',
        'exchangeChainId',
        'estimatedTime',
        'provider',
        'title',
        'image',
        'amount',
      ],
      'body'
    );
    return true;
  }),
  query().custom((value, { req }) => {
    validateFields(req.query, [], 'query');
    return true;
  }),
  param().custom((value, { req }) => {
    validateFields(req.params, ['offerId'], 'params');
    return true;
  }),
];
