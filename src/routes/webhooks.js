import express from 'express';
import { updateStatusOfferValidator } from '../validators/webhook.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import getDBConnection from '../db/conn.js';

const router = express.Router();

/* This is a POST request that updates colletions based on the message. */
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
