import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import {
  createStakingValidator,
  getStakeByIdvalidator,
} from '../validators/staking.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

// POST

router.post('/', createStakingValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.send(validator).status(400);
  }
  let collection = db.collection('staking');
  let newDocument = req.body;
  newDocument.date = new Date();
  newDocument.userId = res.locals.userId;
  let result = await collection.insertOne(newDocument);
  res.send(result).status(201);
});

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

// GET

router.get('/', isRequired, async (req, res) => {
  let collection = db.collection('staking');
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

router.get('/user', isRequired, async (req, res) => {
  let collection = db.collection('staking');
  let results = await collection.find({ userId: res.locals.userId }).toArray();
  res.send(results).status(200);
});

router.get('/:stakeId', getStakeByIdvalidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.send(validator).status(400);
  }
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

// DELETE

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
