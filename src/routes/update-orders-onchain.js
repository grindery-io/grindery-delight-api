import express from 'express';
import isRequired from '../utils/auth-utils.js';
import { createRequire } from 'node:module';
import { Database } from '../db/conn.js';
import {
  updateCompletionOrder,
  updateOrderFromDb,
} from '../utils/view-blockchains-utils.js';
import { updateOrderUserValidator } from '../validators/update-orders-onchain.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

router.put(
  '/update-order-user',
  updateOrderUserValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);

    res.status(200).send(
      await Promise.all(
        (
          await db
            .collection('orders')
            .find({ userId: res.locals.userId, status: 'pending' })
            .toArray()
        ).map(async (order) => {
          await db
            .collection('orders')
            .updateOne(
              { _id: order._id },
              { $set: await updateOrderFromDb(req, db, order) }
            );

          return order;
        })
      )
    );
  }
);

router.put(
  '/update-order-all',
  updateOrderUserValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);

    res.status(200).send(
      await Promise.all(
        (
          await db.collection('orders').find({ status: 'pending' }).toArray()
        ).map(async (order) => {
          await db
            .collection('orders')
            .updateOne(
              { _id: order._id },
              { $set: await updateOrderFromDb(req, db, order) }
            );
          return order;
        })
      )
    );
  }
);

router.put('/update-order-completion-user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('orders')
          .find({
            userId: res.locals.userId,
            orderId: { $exists: true, $ne: '' },
            isComplete: false,
            status: 'completion',
          })
          .toArray()
      ).map(async (order) => {
        await db.collection('orders').updateOne(
          { _id: order._id },
          {
            $set: await updateCompletionOrder(db, order),
          }
        );

        return order;
      })
    )
  );
});

router.put('/update-order-completion-all', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('orders')
          .find({
            orderId: { $exists: true, $ne: '' },
            isComplete: false,
            status: 'completion',
          })
          .toArray()
      ).map(async (order) => {
        await db.collection('orders').updateOne(
          { _id: order._id },
          {
            $set: await updateCompletionOrder(db, order),
          }
        );

        return order;
      })
    )
  );
});

export default router;
