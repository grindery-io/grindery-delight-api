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
const collection = db.collection('staking');

/* This is a POST request to the /staking endpoint. It is using the createStakingValidator middleware
to validate the request body. It is also using the isRequired middleware to check if the user is
logged in. If the user is not logged in, it will return a 401 error. If the user is logged in, it
will check if the user has already staked for the chain. If the user has not staked for the chain,
it will create a new staking document in the database. If the user has already staked for the chain,
it will return a 404 error. */
router.post('/', createStakingValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  if (
    !(await collection.findOne({
      chainId: req.body.chainId,
      userId: res.locals.userId,
    }))
  ) {
    let newDocument = req.body;
    newDocument.date = new Date();
    newDocument.userId = res.locals.userId;
    res.status(201).send(await collection.insertOne(newDocument));
  } else {
    res.status(404).send({
      msg: 'Staking for this chain and this user already exists.',
    });
  }
});

/* This is a PUT request to the /staking endpoint. It is using the updateStakingValidator middleware to
validate the request body. It is also using the isRequired middleware to check if the user is logged
in. If the user is not logged in, it will return a 401 error. If the user is logged in, it will
check if the user has already staked for the chain. If the user has not staked for the chain, it
will return a 404 error. If the user has already staked for the chain, it will update the staking
document in the database. */
router.put('/', updateStakingValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
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
      msg: 'No staking mapping found for this blockchain.',
    });
  }
});

/* This is a GET request to the /staking endpoint. It is using the isRequired middleware to check
if the user is logged in. If the user is not logged in, it will return a 401 error. If the user is
logged in, it will check if the user has staked for any chains. If the user has not staked for any
chains, it will return a 404 error. If the user has staked for any chains, it will return all of the
staking documents for the user. */
router.get('/', isRequired, async (req, res) => {
  if (await collection.findOne({})) {
    res.status(200).send(await collection.find({}).toArray());
  } else {
    res.status(404).send({
      msg: 'No staking found.',
    });
  }
});

/* This is a GET request to the /staking/user endpoint. It is using the isRequired middleware to check
if the user is logged in. If the user is not logged in, it will return a 401 error. If the user is
logged in, it will check if the user has staked for any chains. If the user has not staked for any
chains, it will return a 404 error. If the user has staked for any chains, it will return all of the
staking documents for the user. */
router.get('/user', isRequired, async (req, res) => {
  if (
    await collection.findOne({
      userId: res.locals.userId,
    })
  ) {
    res
      .status(200)
      .send(
        await db
          .collection('staking')
          .find({ userId: res.locals.userId })
          .toArray()
      );
  } else {
    res.status(404).send({
      msg: 'No staking found for this user.',
    });
  }
});

/* This is a GET request to the /staking/:stakeId endpoint. It is using the getStakeByIdValidator
middleware to validate the request params. It is also using the isRequired middleware to check if
the
user is logged in. If the user is not logged in, it will return a 401 error. If the user is logged
in, it will check if the user has staked for the chain. If the user has not staked for the chain, it
will return a 404 error. If the user has staked for the chain, it will return the staking document
for the user. */
router.get('/:stakeId', getStakeByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const result = await collection.findOne({
    _id: new ObjectId(req.params.stakeId),
    userId: res.locals.userId,
  });
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(404).send({
      msg: 'No staking found for this id',
    });
  }
});

/* This is a DELETE request to the /staking endpoint. It is using the deleteStakeValidator middleware
to validate the request query. It is also using the isRequired middleware to check if the user is
logged in. If the user is not logged in, it will return a 401 error. If the user is logged in, it
will check if the user has staked for the chain. If the user has not staked for the chain, it will
return a 404 error. If the user has staked for the chain, it will delete the staking document for
the user. */
router.delete('/', deleteStakeValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const stake = await collection.findOne({
    chainId: req.query.chainId,
    userId: res.locals.userId,
  });
  if (stake) {
    res.status(200).send(await collection.deleteOne(stake));
  } else {
    res.status(404).send({
      msg: 'No staking found',
    });
  }
});

export default router;
