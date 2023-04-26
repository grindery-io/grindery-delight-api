import express from 'express';
import { Database } from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import {
  createTokenValidator,
  getTokenByIdValidator,
  modifyTokenValidator,
} from '../validators/tokens.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

/* Creating a new token. */
router.post('/', createTokenValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('tokens');
  const collectionAdmin = db.collection('admins');
  if (
    validator.length ||
    !(await collectionAdmin.findOne({
      userId: { $regex: res.locals.userId, $options: 'i' },
    }))
  ) {
    return res.status(400).send(validator);
  }

  if (
    await collection.findOne({
      chainId: req.body.chainId,
      address: req.body.address,
    })
  ) {
    return res.status(404).send({ msg: 'This token already exists.' });
  }

  res.status(201).send(await collection.insertOne(req.body));
});

/* This is a route that is used to get all active tokens. */
router.get('/active', async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('tokens');

  if (validator.length) {
    return res.status(400).send(validator);
  }
  res.status(200).send(
    await collection
      .find({
        isActive: true,
      })
      .toArray()
  );
});

/* This is a route that is used to get a token by its id. */
router.get('/:tokenId', getTokenByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('tokens');

  if (validator.length) {
    return res.status(400).send(validator);
  }
  res.status(200).send(
    await collection.findOne({
      _id: new ObjectId(req.params.tokenId),
    })
  );
});

/* This is a route that is used to modify a token by its id. */
router.put('/:tokenId', modifyTokenValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('tokens');
  const collectionAdmin = db.collection('admins');

  if (
    validator.length ||
    !(await collectionAdmin.findOne({
      userId: { $regex: res.locals.userId, $options: 'i' },
    }))
  ) {
    return res.status(400).send(validator);
  }

  const token = await collection.findOne({
    _id: new ObjectId(req.params.tokenId),
  });
  if (!token) {
    return res.status(404).send({ msg: 'No token found' });
  }

  res.status(200).send(
    await collection.updateOne(token, {
      $set: {
        coinmarketcapId: req.body.coinmarketcapId ?? token.coinmarketcapId,
        symbol: req.body.symbol ?? token.symbol,
        icon: req.body.icon ?? token.icon,
        chainId: req.body.chainId ?? token.chainId,
        address: req.body.address ?? token.address,
        isNative: req.body.isNative ?? token.isNative,
        isActive: req.body.isActive ?? token.isActive,
      },
    })
  );
});

/* This is a route that is used to delete a token by its id. */
router.delete(
  '/:tokenId',
  getTokenByIdValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('tokens');
    const collectionAdmin = db.collection('admins');

    if (
      validator.length ||
      !(await collectionAdmin.findOne({
        userId: { $regex: res.locals.userId, $options: 'i' },
      }))
    ) {
      return res.status(400).send(validator);
    }
    const token = await collection.findOne({
      _id: new ObjectId(req.params.tokenId),
    });
    if (token) {
      res.status(200).send(await collection.deleteOne(token));
    } else {
      res.status(404).send({
        msg: 'No token found',
      });
    }
  }
);

export default router;
