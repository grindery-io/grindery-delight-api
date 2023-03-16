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
 * @summary Get offers
 * @description Getting the offers from the database.
 * @tags Offers
 * @return {object} 200 - Success response
 * @example response - 200 - Success response example
 * {
 *   "result": "[]"
 * }
 */
router.get('/', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

/* This is a get request that is looking for a specific offer. */
router.get(
  '/idOffer/:idOffer',
  getOfferByIdValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    console.log(validator);
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
      res.sendStatus(404);
    }
  }
);

/* This is a get request that is looking user offers. */
router.get('/user', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({ userId: res.locals.userId }).toArray();
  res.send(results).status(200);
});

/* Creating a new document in the database. */
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

/* Deleting an entry from the database. */
router.delete(
  '/idOffer/:idOffer',
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

/* Updating an offer document from the database */
router.put(
  '/idOffer/:idOffer',
  updateOfferValidator,
  isRequired,
  async (req, res) => {
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
  }
);

export default router;
