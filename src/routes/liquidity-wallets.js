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

/* This is a route that is used to create a wallet. */
router.post(
  '/',
  createLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const collection = db.collection('liquidity-wallets');
    if (
      !(await collection.findOne({
        walletAddress: req.body.walletAddress,
        chainId: req.body.chainId,
      }))
    ) {
      let newDocument = req.body;
      newDocument.userId = res.locals.userId;
      newDocument.date = new Date();
      newDocument.tokens = new Map();
      res.status(201).send(await collection.insertOne(newDocument));
    } else {
      res.status(404).send({
        msg: 'This wallet already exists on this chain.',
      });
    }
  }
);

/* Updating the wallet. */
router.put(
  '/',
  updateLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const collection = db.collection('liquidity-wallets');
    const wallet = await collection.findOne({
      chainId: req.body.chainId,
      walletAddress: req.body.walletAddress,
      userId: res.locals.userId,
    });
    if (wallet) {
      res.status(201).send(
        await collection.updateOne(wallet, {
          $set: { [`tokens.${req.body.tokenId}`]: req.body.amount },
        })
      );
    } else {
      res.status(404).send({
        msg: 'This liquidity wallet does not exist.',
      });
    }
  }
);

/* This is a route that is used to get all the wallets for a specific chain. */
router.get('/', getLiquidityWalletValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const wallets = await db
    .collection('liquidity-wallets')
    .find({ chainId: req.query.chainId, userId: res.locals.userId })
    .toArray();
  console.log(wallets);
  if (wallets.length !== 0) {
    res.status(200).send(wallets);
  } else {
    res.status(404).send({
      msg: 'No wallet found.',
    });
  }
});

/* This is a route that is used to get all the wallets for a specific chain. */
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
      msg: 'No wallet found.',
    });
  }
});

/* This is a route that is used to get a single wallet. */
router.get(
  '/single',
  getSingleLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const wallet = await db.collection('liquidity-wallets').findOne({
      walletAddress: req.query.walletAddress,
      chainId: req.query.chainId,
      userId: res.locals.userId,
    });
    if (wallet) {
      res.status(200).send(wallet);
    } else {
      res.status(404).send({
        msg: 'No wallet found.',
      });
    }
  }
);

/* This is a route that is used to delete a wallet. */
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
