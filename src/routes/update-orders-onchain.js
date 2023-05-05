import express from 'express';
import isRequired from '../utils/auth-utils.js';
import { createRequire } from 'node:module';
import { Database } from '../db/conn.js';
import {
  updateCompletionOrder,
  updateOrderFromDb,
} from '../utils/view-blockchains-utils.js';

const router = express.Router();

router.put('/update-order-user', isRequired, async (req, res) => {
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
            { $set: await updateOrderFromDb(db, order) }
          );

        return order;
      })
    )
  );
});

router.put('/update-order-all', isRequired, async (req, res) => {
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
            { $set: await updateOrderFromDb(db, order) }
          );
        return order;
      })
    )
  );
});

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
