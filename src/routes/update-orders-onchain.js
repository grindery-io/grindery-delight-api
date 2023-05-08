import express from 'express';
import isRequired from '../utils/auth-utils.js';
import { createRequire } from 'node:module';
import { Database } from '../db/conn.js';
import {
  updateCompletionOrder,
  updateOrderFromDb,
} from '../utils/view-blockchains-utils.js';
import {
  updateOrderCompletionValidator,
  updateOrderValidator,
} from '../validators/update-orders-onchain.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ORDER_STATUS } from '../utils/orders-utils.js';

const router = express.Router();

router.put(
  '/update-order-user',
  updateOrderValidator,
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
            .find({ userId: res.locals.userId, status: ORDER_STATUS.PENDING })
            .toArray()
        ).map(async (order) => {
          await db
            .collection('orders')
            .updateOne(
              { _id: order._id },
              { $set: await updateOrderFromDb(req, order) }
            );

          return order;
        })
      )
    );
  }
);

router.put(
  '/update-order-all',
  updateOrderValidator,
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
            .find({ status: ORDER_STATUS.PENDING })
            .toArray()
        ).map(async (order) => {
          await db
            .collection('orders')
            .updateOne(
              { _id: order._id },
              { $set: await updateOrderFromDb(req, order) }
            );
          return order;
        })
      )
    );
  }
);

router.put(
  '/update-order-completion-user',
  updateOrderCompletionValidator,
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
              $set: await updateCompletionOrder(req, order),
            }
          );

          return order;
        })
      )
    );
  }
);

router.put(
  '/update-order-completion-all',
  updateOrderCompletionValidator,
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
              $set: await updateCompletionOrder(req, order),
            }
          );

          return order;
        })
      )
    );
  }
);

export default router;
