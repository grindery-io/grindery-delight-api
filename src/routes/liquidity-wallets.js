import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import {
  createLiquidityWalletValidator,
  getLiquidityWalletValidator,
} from '../validators/liquidity-wallets.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

/* Creating a new wallet for the user. */
router.post(
  '/create-wallet',
  createLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    let collection = db.collection('liquidity-wallets');
    const validator = validateResult(req, res);
    let newDocument = req.body;
    newDocument.userId = res.locals.userId;
    if (validator.length || (await collection.findOne(newDocument))) {
      return res.status(400).send(validator);
    }
    newDocument.date = new Date();
    newDocument.tokens = [];
    let result = await collection.insertOne(newDocument);
    res.status(201).send(result);
  }
);

/* This is a route that is used to update the wallet. */
router.put(
  '/wallet-address/:walletAddress/chainId/:chainId/tokenId/:tokenId/amount/:amount',
  isRequired,
  async (req, res) => {
    const filter = {
      chainId: req.params.chainId,
      walletAddress: req.params.walletAddress,
      userId: res.locals.userId,
    };
    const collection = db.collection('liquidity-wallets');
    const wallet = await collection.findOne(filter);

    if (wallet) {
      const token = wallet.tokens.findIndex(
        (e) => e.tokenId === req.params.tokenId
      );
      const result = await collection.updateOne(
        wallet,
        token === -1
          ? {
              $push: {
                tokens: {
                  tokenId: req.params.tokenId,
                  amount: req.params.amount,
                },
              },
            }
          : { $set: { [`tokens.${token}.amount`]: req.params.amount } },
        { upsert: false }
      );
      res.status(200).send(result);
    } else {
      filter.date = new Date();
      filter.tokens = [];
      filter.tokens.push({
        tokenId: req.params.tokenId,
        amount: req.params.amount,
      });
      let result = await collection.insertOne(filter);
      res.status(201).send(result);
    }
  }
);

/* This is a route that is used to get the wallet. */
router.get('/', getLiquidityWalletValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const wallets = (
    await db.collection('liquidity-wallets').find(req.body).toArray()
  ).filter((e) => e.userId === res.locals.userId);
  if (wallets.length !== 0) {
    res.status(200).send(wallets);
  } else {
    res.status(404).send({
      message: 'Not Found',
    });
  }
});

router.delete(
  '/wallet-address/:walletAddress/chainId/:chainId',
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const collection = db.collection('liquidity-wallets');
    const wallet = await collection.findOne({
      walletAddress: req.params.walletAddress,
      chainId: req.params.chainId,
      userId: res.locals.userId,
    });
    if (wallet) {
      res.send(await collection.deleteOne(wallet)).status(200);
    } else {
      res.sendStatus(404);
    }
  }
);

export default router;
