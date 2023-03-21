import express, { query } from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import {
  createTradeValidator,
  getTradeByTradeIdValidator,
  getTradeByIdValidator,
  setTradeStatusValidator,
} from '../validators/trades.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ObjectId } from 'mongodb';

const router = express.Router();
const collection = db.collection('trades');

/* This is a POST request that creates a new trade. */
router.post('/', createTradeValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  if (
    !(await collection.findOne({
      tradeId: req.body.tradeId,
    }))
  ) {
    let newDocument = req.body;
    newDocument.date = new Date();
    newDocument.userId = res.locals.userId;
    newDocument.isComplete = false;
    res.send(await collection.insertOne(newDocument)).status(201);
  } else {
    res.status(404).send({
      msg: 'This trade already exists.',
    });
  }
});

/* This is a GET request that returns all trades for a specific user. */
router.get('/user', isRequired, async (req, res) => {
  let results = await collection.find({ userId: res.locals.userId }).toArray();
  if (results.length !== 0) {
    res.send(results).status(200);
  } else {
    res.status(404).send({
      msg: 'No trade found.',
    });
  }
});

/* This is a GET request that returns a trade for a specific user by the trade id. */
router.get(
  '/tradeId',
  getTradeByTradeIdValidator,
  isRequired,
  async (req, res) => {
    const result = await collection.findOne({
      userId: res.locals.userId,
      tradeId: req.query.tradeId,
    });
    if (result) {
      res.send(result).status(200);
    } else {
      res.status(404).send({
        msg: 'No trade found.',
      });
    }
  }
);

/* This is a GET request that returns a trade for a specific user by the trade id. */
router.get('/id', getTradeByIdValidator, isRequired, async (req, res) => {
  const result = await collection.findOne({
    userId: res.locals.userId,
    _id: new ObjectId(req.query.id),
  });
  if (result) {
    res.send(result).status(200);
  } else {
    res.status(404).send({
      msg: 'No trade found',
    });
  }
});

/* This is a PUT request that adds a trade to an offer. */
router.put(
  '/complete',
  setTradeStatusValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const trade = await collection.findOne({
      tradeId: req.body.tradeId,
      userId: res.locals.userId,
    });
    if (trade) {
      res.status(200).send(
        await collection.updateOne(trade, {
          $set: {
            isComplete: req.body.isComplete,
          },
        })
      );
    } else {
      res.status(404).send({
        msg: 'No trade found.',
      });
    }
  }
);

export default router;
