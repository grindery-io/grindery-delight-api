import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import {
  createStakingValidator,
  deleteStakeValidator,
  getStakeByIdValidator,
  updateStakingValidator,
} from '../validators/staking.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

router.post('/', createStakingValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  let collection = db.collection('staking');
  let newDocument = req.body;
  newDocument.date = new Date();
  newDocument.userId = res.locals.userId;
  let result = await collection.insertOne(newDocument);
  res.status(201).send(result);
});

router.put('/', updateStakingValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  let collection = db.collection('staking');
  let result = await collection.updateOne(
    {
      userId: res.locals.userId,
      chainId: req.body.chainId,
    },
    {
      $set: { amount: req.body.amount },
    }
  );
  if (result.matchedCount >= 1) {
    res.status(201).send(result);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

router.get('/', isRequired, async (req, res) => {
  let collection = db.collection('staking');
  let results = await collection.find({}).toArray();
  res.status(200).send(results);
});

router.get('/user', isRequired, async (req, res) => {
  let collection = db.collection('staking');
  let results = await collection.find({ userId: res.locals.userId }).toArray();
  res.status(200).send(results);
});

router.get('/:stakeId', getStakeByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  let collection = db.collection('staking');
  let result = await collection.findOne({
    _id: new ObjectId(req.params.stakeId),
  });
  if (result?.userId === res.locals.userId) {
    res.status(200).send(result);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

router.delete('/', deleteStakeValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const query = {
    chainId: req.query.chainId,
    userId: res.locals.userId,
  };
  const collection = db.collection('staking');
  const stake = await collection.findOne(query);
  if (stake?.userId === query.userId) {
    let result = await collection.deleteOne(query);
    res.status(200).send(result);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

export default router;
