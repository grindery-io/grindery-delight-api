import { body, param, query } from 'express-validator';
import { validateFields } from '../utils/validators-utils.js';

export const createOrderValidator = [
  body('orderId').isString().withMessage('must be string value'),
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
  body('hash')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body().custom((value, { req }) => {
    validateFields(
      req.body,
      [
        'orderId',
        'amountTokenDeposit',
        'addressTokenDeposit',
        'chainIdTokenDeposit',
        'destAddr',
        'amountTokenOffer',
        'offerId',
        'hash',
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
];

export const getOrdersPaginationValidator = [
  query('limit').optional().isInt().withMessage('must be int value'),
  query('offset').optional().isInt().withMessage('must be int value'),
];

export const getOrdersLiquidityProviderValidator = [
  query('isActiveOffers')
    .optional()
    .isString()
    .withMessage('must be string value')
    .isIn(['true', 'false'])
    .withMessage('must be either true or false'),
  query('limit').optional().isInt().withMessage('must be int value'),
  query('offset').optional().isInt().withMessage('must be int value'),
];

export const getOrderByOrderIdValidator = [
  query('orderId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const getOrderByIdValidator = [
  query('id')
    .isMongoId()
    .withMessage('must be mongodb id')
    .notEmpty()
    .withMessage('must not be empty'),
];

export const setOrderCompleteValidator = [
  body('orderId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body('completionHash')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
  body().custom((value, { req }) => {
    validateFields(req.body, ['orderId', 'completionHash'], 'body');
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
];

export const deleteOrderValidator = [
  param('orderId')
    .isString()
    .withMessage('must be string value')
    .notEmpty()
    .withMessage('must not be empty'),
];
