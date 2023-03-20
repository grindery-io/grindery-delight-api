import express, { query } from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import {
  createOfferValidator,
  getOfferByIdValidator,
  deleteOfferValidator,
  updateOfferValidator,
  addTradeOfferValidator,
} from '../validators/offers.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

/* This is a POST request that creates a new offer. */
router.post('/', createOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const collection = db.collection('offers');
  if (
    !(await collection.findOne({
      idOffer: req.body.idOffer,
      userId: res.locals.userId,
    }))
  ) {
    let newDocument = req.body;
    newDocument.date = new Date();
    newDocument.userId = res.locals.userId;
    newDocument.trades = new Map();
    res.send(await collection.insertOne(newDocument)).status(201);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

/* This is a GET request that returns all offers. */
router.get('/', isRequired, async (req, res) => {
  let results = await db.collection('offers').find({}).toArray();
  if (results.length !== 0) {
    res.send(results).status(200);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

/* This is a GET request that returns all offers for a specific user. */
router.get('/user', isRequired, async (req, res) => {
  let results = await db
    .collection('offers')
    .find({ userId: res.locals.userId })
    .toArray();
  if (results.length !== 0) {
    res.send(results).status(200);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

/* This is a GET request that returns an offer by id. */
router.get('/:idOffer', getOfferByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const result = await db.collection('offers').findOne({
    idOffer: req.params.idOffer,
    userId: res.locals.userId,
  });
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

/* This is a DELETE request that deletes an offer by id. */
router.delete(
  '/:idOffer',
  deleteOfferValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const collection = db.collection('offers');
    const offer = await collection.findOne({
      idOffer: req.params.idOffer,
      userId: res.locals.userId,
    });
    if (offer) {
      res.status(200).send(await collection.deleteOne(offer));
    } else {
      res.status(404).send({
        msg: 'Not Found',
      });
    }
  }
);

/* This is a PUT request that adds a trade to an offer. */
router.put(
  '/new-trade',
  addTradeOfferValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const collection = db.collection('offers');
    const offer = await collection.findOne({
      idOffer: req.body.idOffer,
      userId: res.locals.userId,
    });
    if (offer && !(req.body.idTrade in offer.trades)) {
      res.status(200).send(
        await collection.updateOne(offer, {
          $set: {
            [`trades.${req.body.idTrade}`]: {
              amountGRT: req.body.amountGRT,
              user: req.body.user,
              destAddr: req.body.destAddr,
              amountToken: req.body.amountToken,
              idTrade: req.body.idTrade,
              isComplete: false,
            },
          },
        })
      );
    } else {
      res.status(404).send({
        msg: 'Not Found',
      });
    }
  }
);

/* This is a PUT request that updates an offer by id. */
router.put('/:idOffer', updateOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const collection = db.collection('offers');
  const offer = await collection.findOne({
    idOffer: req.params.idOffer,
    userId: res.locals.userId,
  });
  if (offer) {
    res.status(200).send(
      await collection.updateOne(offer, {
        $set: {
          chain: req.body.chain ? req.body.chain : offer.chain,
          min: req.body.min ? req.body.min : offer.min,
          max: req.body.max ? req.body.max : offer.max,
          tokenId: req.body.tokenId ? req.body.tokenId : offer.tokenId,
          token: req.body.token ? req.body.token : offer.token,
          tokenAddress: req.body.tokenAddress
            ? req.body.tokenAddress
            : offer.tokenAddress,
          isActive: req.body.isActive ? req.body.isActive : offer.isActive,
        },
      })
    );
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

export default router;
