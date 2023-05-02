import express from 'express';
import { Database } from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import {
  createOfferValidator,
  getOfferByOfferIdValidator,
  deleteOfferValidator,
  updateOfferValidator,
  getOfferByIdValidator,
  getOffersValidator,
} from '../validators/offers.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ObjectId } from 'mongodb';
import {
  getOffersWithLiquidityWallets,
  getOneOfferWithLiquidityWallet,
} from '../utils/offers-utils.js';

const router = express.Router();

/* This is a POST request that creates a new offer. */
router.post('/', createOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('offers');

  if (validator.length) {
    return res.status(400).send(validator);
  }
  if (
    !(await collection.findOne({
      offerId: req.body.offerId,
      userId: { $regex: res.locals.userId, $options: 'i' },
    }))
  ) {
    let newDocument = req.body;
    newDocument.date = new Date();
    newDocument.userId = res.locals.userId;
    newDocument.status = 'pending';
    res.send(await collection.insertOne(newDocument)).status(201);
  } else {
    res.status(404).send({
      msg: 'This offer already exists.',
    });
  }
});

/* This is a GET request that returns all offers. */
router.get('/', async (req, res) => {
  const db = await Database.getInstance(req);

  res
    .send(
      await getOffersWithLiquidityWallets(
        db,
        await db.collection('offers').find({}).toArray()
      )
    )
    .status(200);
});

/* This is a GET request that returns all activated offers
and filter by exchangeChainId, exchangeToken, chainId,token */
router.get('/search', getOffersValidator, async (req, res) => {
  const validator = validateResult(req, res);

  if (validator.length) {
    return res.status(400).send(validator);
  }

  const db = await Database.getInstance(req);
  const collection = db.collection('offers');

  res
    .send(
      await getOffersWithLiquidityWallets(
        db,
        (
          await collection
            .find({
              isActive: true,
              exchangeChainId: req.query.exchangeChainId,
              exchangeToken: req.query.exchangeToken,
              chainId: req.query.chainId,
              token: req.query.token,
            })
            .toArray()
        ).filter((offer) => {
          const rateAmount = req.query.depositAmount / offer.exchangeRate;
          return offer.min <= rateAmount && offer.max >= rateAmount;
        })
      )
    )
    .status(200);
});

/* This is a GET request that returns all offers for a specific user. */
router.get('/user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);
  const collection = db.collection('offers');

  res
    .send(
      await getOffersWithLiquidityWallets(
        db,
        await collection
          .find({ userId: { $regex: res.locals.userId, $options: 'i' } })
          .toArray()
      )
    )
    .status(200);
});

/* This is a GET request that returns an offer by id. */
router.get(
  '/offerId',
  getOfferByOfferIdValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);
    const collection = db.collection('offers');

    res.status(200).send(
      await getOneOfferWithLiquidityWallet(
        db.collection('liquidity-wallets'),
        await collection.findOne({
          offerId: req.query.offerId,
        })
      )
    );
  }
);

/* This is a GET request that returns an offer by id. */
router.get('/id', getOfferByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }

  const db = await Database.getInstance(req);
  const collection = db.collection('offers');

  res.status(200).send(
    await getOneOfferWithLiquidityWallet(
      db.collection('liquidity-wallets'),
      await collection.findOne({
        _id: new ObjectId(req.query.id),
        userId: { $regex: res.locals.userId, $options: 'i' },
      })
    )
  );
});

/* This is a DELETE request that deletes an offer by id. */
router.delete(
  '/:offerId',
  deleteOfferValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('offers');

    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      offerId: req.params.offerId,
      userId: { $regex: res.locals.userId, $options: 'i' },
    });
    if (offer) {
      res.status(200).send(await collection.deleteOne(offer));
    } else {
      res.status(404).send({
        msg: 'No offer found',
      });
    }
  }
);

/* This is a PUT request that updates an offer by id. */
router.put('/:offerId', updateOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('offers');

  if (validator.length) {
    return res.status(400).send(validator);
  }
  const offer = await collection.findOne({
    offerId: req.params.offerId,
    userId: { $regex: res.locals.userId, $options: 'i' },
  });
  if (offer) {
    res.status(200).send(
      await collection.updateOne(offer, {
        $set: {
          chainId: req.body.chainId ?? offer.chainId,
          min: req.body.min ?? offer.min,
          max: req.body.max ?? offer.max,
          tokenId: req.body.tokenId ?? offer.tokenId,
          token: req.body.token ?? offer.token,
          tokenAddress: req.body.tokenAddress ?? offer.tokenAddress,
          isActive: req.body.isActive ?? offer.isActive,
          exchangeRate: req.body.exchangeRate ?? offer.exchangeRate,
          exchangeToken: req.body.exchangeToken ?? offer.exchangeToken,
          exchangeChainId: req.body.exchangeChainId ?? offer.exchangeChainId,
          estimatedTime: req.body.estimatedTime ?? offer.estimatedTime,
          provider: req.body.provider ?? offer.provider,
          title: req.body.title ?? offer.title,
          image: req.body.image ?? offer.image,
          amount: req.body.amount ?? offer.amount,
          offerId: req.body.offerId ?? offer.offerId,
        },
      })
    );
  } else {
    res.status(404).send({
      msg: 'No offer found',
    });
  }
});

export default router;
