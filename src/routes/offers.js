import express from 'express';
import getDBConnection from '../db/conn.js';
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

const router = express.Router();
// const collection = db.collection('offers');

/* This is a POST request that creates a new offer. */
router.post('/', createOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const collection = (await getDBConnection(req)).collection('offers');
  if (validator.length) {
    console.log(
      'Offer creation - Validation failed - userId',
      res.locals.userId
    );
    console.log('Offer creation - Validation failed - request body', req.body);
    console.log('Offer creation - Validation failed - Validator', validator);
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
    res.send(await collection.insertOne(newDocument)).status(201);
  } else {
    console.log(
      'Offer creation - Offer already exists - userId',
      res.locals.userId
    );
    console.log(
      'Offer creation - Offer already exists - request body',
      req.body
    );
    res.status(404).send({
      msg: 'This offer already exists.',
    });
  }
});

/* This is a GET request that returns all offers. */
router.get('/', async (req, res) => {
  const collection = (await getDBConnection(req)).collection('offers');
  res.send(await collection.find({}).toArray()).status(200);
});

/* This is a GET request that returns all activated offers
and filter by exchangeChainId, exchangeToken, chainId,token */
router.get('/search', getOffersValidator, async (req, res) => {
  const validator = validateResult(req, res);
  const collection = (await getDBConnection(req)).collection('offers');
  if (validator.length) {
    return res.status(400).send(validator);
  }
  let offers = await collection
    .find({
      isActive: true,
      exchangeChainId: req.query.exchangeChainId,
      exchangeToken: req.query.exchangeToken,
      chainId: req.query.chainId,
      token: req.query.token,
    })
    .toArray();

  offers = offers.filter((offer) => {
    offer.rateAmount = req.query.depositAmount / offer.exchangeRate;
    return offer.min <= offer.rateAmount && offer.max >= offer.rateAmount;
  });

  res.send(offers).status(200);
});

/* This is a GET request that returns all offers for a specific user. */
router.get('/user', isRequired, async (req, res) => {
  const collection = (await getDBConnection(req)).collection('offers');
  res
    .send(
      await collection
        .find({ userId: { $regex: res.locals.userId, $options: 'i' } })
        .toArray()
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
    const collection = (await getDBConnection(req)).collection('offers');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    res.status(200).send(
      await collection.findOne({
        offerId: req.query.offerId,
      })
    );
  }
);

/* This is a GET request that returns an offer by id. */
router.get('/id', getOfferByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const collection = (await getDBConnection(req)).collection('offers');
  if (validator.length) {
    return res.status(400).send(validator);
  }
  res.status(200).send(
    await collection.findOne({
      _id: new ObjectId(req.query.id),
      userId: { $regex: res.locals.userId, $options: 'i' },
    })
  );
});

/* This is a DELETE request that deletes an offer by id. */
router.delete(
  '/:offerId',
  deleteOfferValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const collection = (await getDBConnection(req)).collection('offers');
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
  const collection = (await getDBConnection(req)).collection('offers');
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
          chainId: req.body.chainId ? req.body.chainId : offer.chainId,
          min: req.body.min ? req.body.min : offer.min,
          max: req.body.max ? req.body.max : offer.max,
          tokenId: req.body.tokenId ? req.body.tokenId : offer.tokenId,
          token: req.body.token ? req.body.token : offer.token,
          tokenAddress: req.body.tokenAddress
            ? req.body.tokenAddress
            : offer.tokenAddress,
          isActive:
            req.body.isActive === undefined
              ? offer.isActive
              : req.body.isActive,
          exchangeRate: req.body.exchangeRate
            ? req.body.exchangeRate
            : offer.exchangeRate,
          exchangeToken: req.body.exchangeToken
            ? req.body.exchangeToken
            : offer.exchangeToken,
          exchangeChainId: req.body.exchangeChainId
            ? req.body.exchangeChainId
            : offer.exchangeChainId,
          estimatedTime: req.body.estimatedTime
            ? req.body.estimatedTime
            : offer.estimatedTime,
          provider: req.body.provider ? req.body.provider : offer.provider,
          title: req.body.title ? req.body.title : offer.title,
          image: req.body.image ? req.body.image : offer.image,
          amount: req.body.amount ? req.body.amount : offer.amount,
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
