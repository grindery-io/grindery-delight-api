import express from 'express';
import {
  updateStatusOfferValidator,
  updateChainIdOfferValidator,
  updateTokenOfferValidator,
  updateMinPriceOfferValidator,
  updateMaxPriceOfferValidator,
} from '../validators/webhook.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import getDBConnection from '../db/conn.js';
import webhooks from 'node-webhooks';

const router = express.Router();

/* This is a PUT request that updates max price offer. */
router.put(
  '/offer/max-price',
  updateMaxPriceOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    const collection = (await getDBConnection(req)).collection('offers');

    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      offerId: req.body._idOffer,
    });
    if (offer) {
      const response = await collection.updateOne(offer, {
        $set: {
          max: req.body._upperLimitFn ? req.body._upperLimitFn : offer.min,
        },
      });
      if (response.modifiedCount > 0)
        trigger('offer', { offerId: req.body._idOffer });
      return res.status(200).send(response);
    }
  }
);

/* This is a PUT request that updates min price offer. */
router.put(
  '/offer/min-price',
  updateMinPriceOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    const collection = (await getDBConnection(req)).collection('offers');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      offerId: req.body._idOffer,
    });
    if (offer) {
      const response = await collection.updateOne(offer, {
        $set: {
          min: req.body._lowerLimitFn ? req.body._lowerLimitFn : offer.min,
        },
      });
      if (response.modifiedCount > 0)
        trigger('offer', { offerId: req.body._idOffer });
      return res.status(200).send(response);
    }
    res.status(400).send({
      msg: 'Not found.',
    });
  }
);

/* This is a PUT request that updates token offer. */
router.put('/offer/token', updateTokenOfferValidator, async (req, res) => {
  const validator = validateResult(req, res);
  const collection = (await getDBConnection(req)).collection('offers');
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const offer = await collection.findOne({
    offerId: req.body._idOffer,
  });
  if (offer) {
    const response = await collection.updateOne(offer, {
      $set: {
        tokenAddress: req.body._token ? req.body._token : offer.tokenAddress,
      },
    });
    if (response.modifiedCount > 0)
      trigger('offer', { offerId: req.body._idOffer });
    return res.status(200).send(response);
  }
  res.status(400).send({
    msg: 'Not found.',
  });
});

/* This is a PUT request that updates chain id offer. */
router.put('/offer/chain', updateChainIdOfferValidator, async (req, res) => {
  const validator = validateResult(req, res);
  const collection = (await getDBConnection(req)).collection('offers');
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const offer = await collection.findOne({
    offerId: req.body._idOffer,
  });
  if (offer) {
    const response = await collection.updateOne(offer, {
      $set: {
        chainId: req.body._chainId ? req.body._chainId : offer.chainId,
      },
    });
    if (response.modifiedCount > 0)
      trigger('offer', { offerId: req.body._idOffer });
    return res.status(200).send(response);
  }
  res.status(400).send({
    msg: 'Not found.',
  });
});

/* This is a PUT request that updates status offer. */
router.put('/offer/status', updateStatusOfferValidator, async (req, res) => {
  const validator = validateResult(req, res);
  const collection = (await getDBConnection(req)).collection('offers');
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const offer = await collection.findOne({
    offerId: req.body._idOffer,
  });
  if (offer) {
    const response = await collection.updateOne(offer, {
      $set: {
        isActive:
          req.body._isActive === undefined
            ? offer.isActive
            : req.body._isActive,
      },
    });
    if (response.modifiedCount > 0)
      trigger('offer', { offerId: req.body._idOffer });
    return res.status(200).send(response);
  }
  res.status(404).send({
    msg: 'Not found.',
  });
});

const registerHooks = () => {
  return new webhooks({
    db: {
      callback_hook: [process.env.GRINDERY_MERCARI_CLIENT],
    },
  });
};

const hooks = registerHooks();

const trigger = (topic, data) =>
  hooks.trigger('callback_hook', {
    msg: topic,
    data: data,
  });

export default router;
