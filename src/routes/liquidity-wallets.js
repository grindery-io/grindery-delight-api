import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import { liquidityWalletValidator } from '../validators/liquidity-wallets.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

/* Creating a new wallet for the user. */
router.post(
  '/create-wallet',
  liquidityWalletValidator,
  isRequired,
  async (req, res) => {
    let collection = db.collection('liquidity-wallets');
    const validator = validateResult(req, res);
    let newDocument = req.body;
    newDocument.userId = res.locals.userId;
    if (validator.length || (await collection.findOne(newDocument))) {
      return res.send(validator).status(400);
    }
    newDocument.date = new Date();
    newDocument.tokens = [];
    let result = await collection.insertOne(newDocument);
    res.send(result).status(201);
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
      res.send(result).status(200);
    } else {
      filter.date = new Date();
      filter.tokens = [];
      filter.tokens.push({
        tokenId: req.params.tokenId,
        amount: req.params.amount,
      });
      let result = await collection.insertOne(filter);
      res.send(result).status(201);
    }
  }
);

// router.get('/', isRequired, async (req, res) => {
//   let collection = db.collection('liquidity-wallets');
//   let result = await collection.findOne({
//     _id: new ObjectId(req.params.idOffer),
//   });
// });

export default router;
