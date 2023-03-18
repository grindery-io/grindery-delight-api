import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import {
  createLiquidityWalletValidator,
  deleteLiquidityWalletValidator,
  getLiquidityWalletValidator,
  getSingleLiquidityWalletValidator,
  updateLiquidityWalletValidator,
} from '../validators/liquidity-wallets.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

/* Creating a new wallet for the user. */
router.post(
  '/',
  createLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    const collection = db.collection('liquidity-wallets');
    const validator = validateResult(req, res);
    let newDocument = req.body;
    newDocument.userId = res.locals.userId;
    if (validator.length || (await collection.findOne(newDocument))) {
      return res.status(400).send(validator);
    }
    newDocument.date = new Date();
    newDocument.tokens = new Map();
    const result = await collection.insertOne(newDocument);
    res.status(201).send(result);
  }
);

/* This is a route that is used to update the wallet. */
router.put(
  '/',
  updateLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const tokenId = req.query.tokenId;
    const amount = req.query.amount;
    const filter = {
      chainId: req.query.chainId,
      walletAddress: req.query.walletAddress,
      userId: res.locals.userId,
    };
    const collection = db.collection('liquidity-wallets');
    const wallet = await collection.findOne(filter);
    if (wallet) {
      const tokensEntry = new Map(Object.entries(wallet.tokens));
      tokensEntry.set(tokenId, amount);
      const result = await collection.updateOne(wallet, {
        $set: { tokens: tokensEntry },
      });
      res.status(201).send(result);
    } else {
      res.status(404).send({
        msg: 'Not Found',
      });
    }
  }
);

/* This is a route that is used to get the wallet. */
router.get('/', getLiquidityWalletValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const chainId = req.query.chainId;
  const wallets = (
    await db.collection('liquidity-wallets').find({ chainId }).toArray()
  ).filter((e) => e.userId === res.locals.userId);
  if (wallets.length !== 0) {
    res.status(200).send(wallets);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

router.get('/all', isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const wallets = await db
    .collection('liquidity-wallets')
    .find({ userId: res.locals.userId })
    .toArray();
  if (wallets.length !== 0) {
    res.status(200).send(wallets);
  } else {
    res.status(404).send({
      msg: 'Not Found',
    });
  }
});

router.get(
  '/single/:walletId',
  getSingleLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const wallet = await db
      .collection('liquidity-wallets')
      .findOne({
        _id: new ObjectId(req.params.walletId),
        userId: res.locals.userId,
      });
    if (wallet) {
      res.status(200).send(wallet);
    } else {
      res.status(404).send({
        msg: 'Not Found',
      });
    }
  }
);

router.delete(
  '/',
  deleteLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const collection = db.collection('liquidity-wallets');
    const wallet = await collection.findOne({
      walletAddress: req.query.walletAddress,
      chainId: req.query.chainId,
      userId: res.locals.userId,
    });

    if (wallet) {
      res.status(200).send(await collection.deleteOne(wallet));
    } else {
      res.status(404).send({
        msg: 'Not Found',
      });
    }
  }
);

export default router;
