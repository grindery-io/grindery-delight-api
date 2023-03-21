import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import {
  createOfferValidator,
  getOfferByOfferIdValidator,
  deleteOfferValidator,
  updateOfferValidator,
  getOfferByIdValidator,
} from '../validators/offers.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ObjectId } from 'mongodb';

const router = express.Router();
const collection = db.collection('offers');

/* This is a POST request that creates a new offer. */
router.post('/', createOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  if (
    !(await collection.findOne({
      offerId: req.body.offerId,
      userId: res.locals.userId,
    }))
  ) {
    let newDocument = req.body;
    newDocument.date = new Date();
    newDocument.userId = res.locals.userId;
    res.send(await collection.insertOne(newDocument)).status(201);
  } else {
    res.status(404).send({
      msg: 'This offer already exists.',
    });
  }
});

/* This is a GET request that returns all offers. */
router.get('/', isRequired, async (req, res) => {
  let results = await collection.find({}).toArray();
  if (results.length !== 0) {
    res.send(results).status(200);
  } else {
    res.status(404).send({
      msg: 'No offer found.',
    });
  }
});

/* This is a GET request that returns all offers for a specific user. */
router.get('/user', isRequired, async (req, res) => {
  res
    .send(await collection.find({ userId: res.locals.userId }).toArray())
    .status(200);
});

/* This is a GET request that returns an offer by id. */
router.get(
  '/offerId',
  getOfferByOfferIdValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const result = await collection.findOne({
      offerId: req.query.offerId,
      userId: res.locals.userId,
    });
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(404).send({
        msg: 'No offer found',
      });
    }
  }
);

/* This is a GET request that returns an offer by id. */
router.get('/id', getOfferByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const result = await collection.findOne({
    _id: new ObjectId(req.query.id),
    userId: res.locals.userId,
  });
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(404).send({
      msg: 'No offer found',
    });
  }
});

/* This is a DELETE request that deletes an offer by id. */
router.delete(
  '/:offerId',
  deleteOfferValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      offerId: req.params.offerId,
      userId: res.locals.userId,
    });
    if (offer) {
      res.status(200).send(await collection.deleteOne(offer));
    } else {
      res.status(404).send({
        msg: 'No offer found',
      });
    }
  }
);

/* This is a PUT request that updates an offer by id. */
router.put('/:offerId', updateOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const offer = await collection.findOne({
    offerId: req.params.offerId,
    userId: res.locals.userId,
  });
  console.log(req.body.isActive !== undefined);
  if (offer) {
    res.status(200).send(
      await collection.updateOne(offer, {
        $set: {
          chainId: req.body.chainId ? req.body.chainId : offer.chainId,
          min: req.body.min ? req.body.min : offer.min,
          max: req.body.max ? req.body.max : offer.max,
          tokenId: req.body.tokenId ? req.body.tokenId : offer.tokenId,
          token: req.body.token ? req.body.token : offer.token,
          tokenAddress: req.body.tokenAddress
            ? req.body.tokenAddress
            : offer.tokenAddress,
          isActive:
            req.body.isActive === undefined
              ? offer.isActive
              : req.body.isActive,
        },
      })
    );
  } else {
    res.status(404).send({
      msg: 'No offer found',
    });
  }
});

export default router;
