import express from 'express';
import isRequired from '../utils/auth-utils.js';
import { Database } from '../db/conn.js';
import {
  updateActivationOffer,
  updateOfferId,
} from '../utils/view-blockchains-utils.js';
import { OFFER_STATUS } from '../utils/offers-utils.js';

const router = express.Router();

router.put('/update-offer-user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('offers')
          .find({ userId: res.locals.userId, status: OFFER_STATUS.PENDING })
          .toArray()
      ).map(async (offer) => {
        await db
          .collection('offers')
          .updateOne(
            { _id: offer._id },
            { $set: await updateOfferId(db, offer) }
          );

        return offer;
      })
    )
  );
});

router.put('/update-offer-all', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('offers')
          .find({ status: OFFER_STATUS.PENDING })
          .toArray()
      ).map(async (offer) => {
        await db
          .collection('offers')
          .updateOne(
            { _id: offer._id },
            { $set: await updateOfferId(db, offer) }
          );

        return offer;
      })
    )
  );
});

router.put('/update-offer-activation-user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('offers')
          .find({
            userId: res.locals.userId,
            offerId: { $exists: true, $ne: '' },
            $or: [
              { isActive: false, status: OFFER_STATUS.ACTIVATION },
              { isActive: true, status: OFFER_STATUS.DEACTIVATION },
            ],
          })
          .toArray()
      ).map(async (offer) => {
        await db.collection('offers').updateOne(
          { _id: offer._id },
          {
            $set: await updateActivationOffer(db, offer),
          }
        );

        return offer;
      })
    )
  );
});

router.put('/update-offer-activation-all', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('offers')
          .find({
            offerId: { $exists: true, $ne: '' },
            $or: [
              { isActive: false, status: OFFER_STATUS.ACTIVATION },
              { isActive: true, status: OFFER_STATUS.DEACTIVATION },
            ],
          })
          .toArray()
      ).map(async (offer) => {
        await db.collection('offers').updateOne(
          { _id: offer._id },
          {
            $set: await updateActivationOffer(db, offer),
          }
        );

        return offer;
      })
    )
  );
});

export default router;
