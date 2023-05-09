import express from 'express';
import isRequired from '../utils/auth-utils.js';
import { Database } from '../db/conn.js';
import {
  updateCompletionOrder,
  updateOrderFromDb,
} from '../utils/view-blockchains-utils.js';
import { ORDER_STATUS } from '../utils/orders-utils.js';

const router = express.Router();

router.put('/update-order-user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('orders')
          .find({ userId: res.locals.userId, status: ORDER_STATUS.PENDING })
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
});

router.put('/update-order-all', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('orders')
          .find({ status: ORDER_STATUS.PENDING })
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
            status: ORDER_STATUS.COMPLETION,
          })
          .toArray()
      ).map(async (order) => {
        await db.collection('orders').updateOne(
          { _id: order._id },
          {
            $set: await updateCompletionOrder(req, db, order),
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
            status: ORDER_STATUS.COMPLETION,
          })
          .toArray()
      ).map(async (order) => {
        await db.collection('orders').updateOne(
          { _id: order._id },
          {
            $set: await updateCompletionOrder(req, db, order),
          }
        );

        return order;
      })
    )
  );
});

export default router;
