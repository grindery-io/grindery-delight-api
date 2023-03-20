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

// POST

router.post('/', createOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  let collection = db.collection('offers');
  let newDocument = req.body;
  newDocument.date = new Date();
  newDocument.userId = res.locals.userId;
  newDocument.trades = new Map();
  let result = await collection.insertOne(newDocument);
  res.send(result).status(201);
});

// GET

router.get('/', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({}).toArray();
  if (results.length !== 0) {
    res.send(results).status(200);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

router.get('/user', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({ userId: res.locals.userId }).toArray();
  if (results.length !== 0) {
    res.send(results).status(200);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

router.get('/:idOffer', getOfferByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  let collection = db.collection('offers');
  let result = await collection.findOne({
    _id: new ObjectId(req.params.idOffer),
  });
  if (result?.userId === res.locals.userId) {
    res.status(200).send(result);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

// DELETE

router.delete(
  '/:idOffer',
  deleteOfferValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const query = { tokenId: req.params.idOffer };
    const collection = db.collection('offers');
    const offer = await collection.findOne(query);
    if (offer?.userId === res.locals.userId) {
      let result = await collection.deleteOne(query);
      res.status(200).send(result);
    } else {
      res.status(404).send({
        msg: 'Not Found',
      });
    }
  }
);

// PUT

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
      offerId: req.body.offerId,
      userId: res.locals.userId,
    });
    if (offer && !(req.body.tradeId in offer.trades)) {
      res.status(200).send(
        await collection.updateOne(
          offer,
          {
            $set: {
              [`trades.${req.body.tradeId}`]: {
                amountGRT: req.body.amountGRT,
                user: req.body.user,
                destAddr: req.body.destAddr,
                amountToken: req.body.amountToken,
                tradeId: req.body.tradeId,
                isComplete: false,
              },
            },
          },
          { upsert: false }
        )
      );
    } else {
      res.status(404).send({
        msg: 'Not Found',
      });
    }
  }
);

// PUT

router.put('/:idOffer', updateOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const query = { _id: new ObjectId(req.params.idOffer) };
  const collection = db.collection('offers');
  const offer = await collection.findOne(query);
  if (offer?.userId === res.locals.userId) {
    const updateDoc = {
      $set: {
        isActive: !offer.isActive,
      },
    };
    const options = { upsert: false };
    const result = await collection.updateOne(query, updateDoc, options);
    res.status(200).send(result);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

export default router;
