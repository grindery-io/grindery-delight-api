import express from 'express';
import { Database } from '../db/conn.js';
import { isRequired } from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import {
  createLiquidityWalletValidator,
  deleteLiquidityWalletValidator,
  getLiquidityWalletValidator,
  getSingleLiquidityWalletValidator,
  updateLiquidityWalletValidator,
  getWalletByIdValidator,
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
    const db = await Database.getInstance(req);
    const collection = db.collection('liquidity-wallets');

    if (validator.length) {
      return res.status(400).send(validator);
    }

    if (
      await collection.findOne({
        walletAddress: req.body.walletAddress,
        chainId: req.body.chainId,
      })
    ) {
      res.status(404).send({
        msg: 'This wallet already exists on this chain.',
      });
    }

    res.status(201).send(
      await collection.insertOne({
        ...req.body,
        userId: res.locals.userId,
        date: new Date(),
        tokens: new Map(),
        reputation: '10',
      })
    );
  }
);

/* Updating the wallet. */
router.put(
  '/',
  updateLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('liquidity-wallets');

    if (validator.length) {
      return res.status(400).send(validator);
    }

    const wallet = await collection.findOne({
      chainId: req.body.chainId,
      walletAddress: req.body.walletAddress,
      userId: { $regex: res.locals.userId, $options: 'i' },
    });

    if (!wallet) {
      res.status(404).send({
        msg: 'This liquidity wallet does not exist.',
      });
    }

    res.status(201).send(
      await collection.updateOne(wallet, {
        $set: { [`tokens.${req.body.tokenId}`]: req.body.amount },
      })
    );
  }
);

/* This is a route that is used to get all the wallets for a specific chain. */
router.get('/', getLiquidityWalletValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('liquidity-wallets');

  if (validator.length) {
    return res.status(400).send(validator);
  }

  res.status(200).send(
    await collection
      .find({
        chainId: req.query.chainId,
        userId: { $regex: res.locals.userId, $options: 'i' },
      })
      .toArray()
  );
});

/* This is a route that is used to get all the wallets for a specific chain. */
router.get('/all', isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('liquidity-wallets');

  if (validator.length) {
    return res.status(400).send(validator);
  }

  res
    .status(200)
    .send(
      await collection
        .find({ userId: { $regex: res.locals.userId, $options: 'i' } })
        .toArray()
    );
});

router.get('/single', getSingleLiquidityWalletValidator, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);

  if (validator.length) {
    return res.status(400).send(validator);
  }

  res.status(200).send(
    await db.collection('liquidity-wallets').findOne({
      chainId: req.query.chainId,
      userId: req.query.userId,
    })
  );
});

/* This is a route that is used to get a single wallet. */
router.get('/id/:id', getWalletByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);

  if (validator.length) {
    return res.status(400).send(validator);
  }

  res.status(200).send(
    await db.collection('liquidity-wallets').findOne({
      _id: new ObjectId(req.params.id),
      userId: { $regex: res.locals.userId, $options: 'i' },
    })
  );
});

/* This is a route that is used to delete a wallet. */
router.delete(
  '/',
  deleteLiquidityWalletValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('liquidity-wallets');

    if (validator.length) {
      return res.status(400).send(validator);
    }

    const wallet = await collection.findOne({
      walletAddress: req.query.walletAddress,
      chainId: req.query.chainId,
      userId: { $regex: res.locals.userId, $options: 'i' },
    });

    if (!wallet) {
      res.status(404).send({
        msg: 'No liquidity wallet found',
      });
    }

    res.status(200).send(await collection.deleteOne(wallet));
  }
);

export default router;
