import express from 'express';
import isRequired from '../utils/auth-utils.js';
import { createRequire } from 'node:module';
import { Database } from '../db/conn.js';
import {
  getOfferIdFromHash,
  updateCompletionOrder,
  updateOfferId,
  updateOrderFromDb,
} from '../utils/view-blockchains-utils.js';

const router = express.Router();

router.put('/update-offer-user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('offers')
          .find({ userId: res.locals.userId, status: 'pending' })
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

export default router;
