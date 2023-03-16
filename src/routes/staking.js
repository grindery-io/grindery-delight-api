import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

/**
 * GET /staking
 *
 * @summary Get stakes
 * @description Getting stakes from the database.
 * @tags Offers
 * @return {object} 200 - Success response
 * @example response - 200 - Success response example
 * {
 *   "result": "[]"
 * }
 */
router.get('/', isRequired, async (req, res) => {
  let collection = db.collection('staking');
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

/* This is a get request that is looking for a specific stake. */
router.get('/:stakeId', isRequired, async (req, res) => {
  let collection = db.collection('staking');
  let result = await collection.findOne({
    _id: new ObjectId(req.params.stakeId),
  });
  if (result?.userId === res.locals.userId) {
    res.send(result).status(200);
  } else {
    res.sendStatus(404);
  }
});

/* This is a get request that is looking user stakes. */
router.get('/user', isRequired, async (req, res) => {
  let collection = db.collection('staking');
  let results = await collection.find({ userId: res.locals.userId }).toArray();
  res.send(results).status(200);
});

/* This is a post request to the staking collection. */
router.post('/', isRequired, async (req, res) => {
  let collection = db.collection('staking');
  let newDocument = req.body;
  newDocument.date = new Date();
  newDocument.userId = res.locals.userId;
  let result = await collection.insertOne(newDocument);
  res.send(result).status(201);
});

/* This is a post request to the staking collection. */
router.post(
  '/modify/chainId/:chainId/amount/:amount',
  isRequired,
  async (req, res) => {
    let collection = db.collection('staking');
    let result = await collection.updateOne(
      {
        userId: res.locals.userId,
        chainId: req.params.chainId,
      },
      {
        $set: { amount: req.params.amount },
      }
    );
    res.send(result).status(201);
  }
);

/* This is a delete request to the staking collection. */
router.delete('/chainId/:chainId', isRequired, async (req, res) => {
  const query = {
    chainId: req.params.chainId,
    userId: res.locals.userId,
  };
  const collection = db.collection('staking');
  let result = await collection.deleteOne(query);
  res.send(result).status(200);
});

export default router;
