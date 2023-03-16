import express, { query } from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import {
  validateResult,
  createOfferValidator,
  getOfferByIdValidator,
  deleteOfferValidator,
  updateOfferValidator,
} from '../validators/offers.validator.js';

const router = express.Router();

/**
 * GET /offers
 *
 * @summary Get Offers
 * @description Getting the offers from the database
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 401 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * [{
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * },
 * {
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * }]
 * @example response - 401 - Authentication error response example
 * {
 *   "message": "Request failed with status code 400"
 * }
 */
router.get('/', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

/**
 * GET /offers/:idOffers
 *
 * @summary Get Offers by id
 * @description This is a get request that is looking for a specific offer
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 401 - Authentication error response
 * @return {object} 404 - Not found error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * {
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * }
 * @example response - 401 - Authentication error response example
 * {
 *   "message": "Request failed with status code 400"
 * }
 * @example response - 404 - Not found error response
 * {
 *   "message": "Not Found"
 * }
 */
router.get('/:idOffer', getOfferByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.send(validator).status(400);
  }
  let collection = db.collection('offers');
  let result = await collection.findOne({
    _id: new ObjectId(req.params.idOffer),
  });
  if (result?.userId === res.locals.userId) {
    res.send(result).status(200);
  } else {
    res.status(404).send({
      message: 'Not Found',
    });
  }
});

/**
 * GET /offers/user
 *
 * @summary Get Offers by user
 * @description This is a get request that is looking user offers
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 401 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * [{
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * },
 * {
 *  "_id": "6413280d273bbc2ed3c9c98b",
 *  "chain": 55,
 *  "min": "1",
 *  "max": "100",
 *  "tokenId": "1",
 *  "token": "GRT",
 *  "tokenAddress": "123",
 *  "isActive": false,
 *  "date": "2023-03-16T14:30:37.727Z",
 *  "userId": "eip155:1:0xCbDf3d0C2C255d4582171Fc652E8BdCF043b13fE"
 * }]
 * @example response - 401 - Authentication error response example
 * {
 *   "message": "Request failed with status code 400"
 * }
 */
router.get('/user', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({ userId: res.locals.userId }).toArray();
  res.send(results).status(200);
});

/**
 * Create Offer
 * @typedef {object} CreateOffer
 * @property {number} chain - chain id
 * @property {string} min - min amount
 * @property {string} max - max amount
 * @property {string} tokenId - token id
 * @property {string} tokenAddress - token address
 * @property {boolean} isActive - offer status flag
 */
/**
 * POST /offers
 *
 * @summary Create new Offer
 * @description Creating a new document in the database
 * @tags Offers
 * @param {CreateOffer} request.body
 * @return {object} 200 - Success response
 * @return {object} 400 - Error response
 * @return {object} 401 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * {
 *   "success": true,
 *   "id": "123"
 * }
 * @example response - 400 - Error response example
 * {
 *   "message": "Error message"
 * }
 * @example response - 401 - Authentication error response example
 * {
 *   "message": "Request failed with status code 400"
 * }
 */
router.post('/', createOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.send(validator).status(400);
  }
  let collection = db.collection('offers');
  let newDocument = req.body;
  newDocument.date = new Date();
  newDocument.userId = res.locals.userId;
  let result = await collection.insertOne(newDocument);
  res.send(result).status(201);
});

/**
 * DELETE /offers/:idOffer
 *
 * @summary Delete Offer
 * @description Deleting an entry from the database
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 400 - Error response
 * @return {object} 403 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * {
 *   "success": true,
 *   "id": "123"
 * }
 * @example response - 400 - Error response example
 * {
 *   "message": "Error message"
 * }
 * @example response - 403 - Authentication error response
 * {
 *   "message": "No credentials sent"
 * }
 */
router.delete(
  '/:idOffer',
  deleteOfferValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.send(validator).status(400);
    }
    const query = { _id: req.params.idOffer };
    const collection = db.collection('offers');
    const offer = await collection.findOne({ _id: new ObjectId(query._id) });
    if (offer?.userId === res.locals.userId) {
      let result = await collection.deleteOne({
        _id: new ObjectId(query._id),
      });
      res.send(result).status(200);
    } else {
      res.sendStatus(404);
    }
  }
);

/**
 * Update /offers/:idOffer
 *
 * @summary Update Offer
 * @description Updating an offer document from the database
 * @tags Offers
 * @return {object} 200 - Success response
 * @return {object} 400 - Error response
 * @return {object} 403 - Authentication error response
 * @security BearerAuth
 * @example response - 200 - Success response example
 * {
 *   "success": true,
 *   "id": "123"
 * }
 * @example response - 400 - Error response example
 * {
 *   "message": "Error message"
 * }
 * @example response - 403 - Authentication error response
 * {
 *   "message": "No credentials sent"
 * }
 */
router.put('/:idOffer', updateOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.send(validator).status(400);
  }
  const filter = { _id: new ObjectId(req.params.idOffer) };
  const collection = db.collection('offers');
  const offer = await collection.findOne(filter);
  if (offer?.userId === res.locals.userId) {
    const updateDoc = {
      $set: {
        isActive: !offer.isActive,
      },
    };
    const options = { upsert: false };
    const result = await collection.updateOne(filter, updateDoc, options);
    res.send(result).status(200);
  } else {
    res.sendStatus(404);
  }
});

export default router;
