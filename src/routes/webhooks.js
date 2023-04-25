import express from 'express';
import {
  updateStatusOfferValidator,
  updateChainIdOfferValidator,
} from '../validators/webhook.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import getDBConnection from '../db/conn.js';

const router = express.Router();

/* This is a PUT request that updates token offer. */
router.put('/offer/chain', updateChainIdOfferValidator, async (req, res) => {
  const validator = validateResult(req, res);
  const collection = (await getDBConnection(req)).collection('offers');
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const offer = await collection.findOne({
    offerId: req.body._idOffer,
  });
  if (offer)
    return res.status(200).send(
      await collection.updateOne(offer, {
        $set: {
          chainId: req.body._chainId ? req.body._chainId : offer.chainId,
        },
      })
    );
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
  if (offer)
    return res.status(200).send(
      await collection.updateOne(offer, {
        $set: {
          chainId: req.body._chainId ? req.body._chainId : offer.chainId,
        },
      })
    );
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
  if (offer)
    return res.status(200).send(
      await collection.updateOne(offer, {
        $set: {
          isActive:
            req.body._isActive === undefined
              ? offer.isActive
              : req.body._isActive,
        },
      })
    );
  res.status(404).send({
    msg: 'Not found.',
  });
});

export default router;