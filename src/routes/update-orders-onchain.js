import express from 'express';
import { isRequired, authenticateApiKey } from '../utils/auth-utils.js';
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
    (
      await Promise.all(
        (
          await db
            .collection('orders')
            .find({ userId: res.locals.userId, status: ORDER_STATUS.PENDING })
            .toArray()
        ).map(async (order) => {
          try {
            await db
              .collection('orders')
              .updateOne(
                { _id: order._id },
                { $set: await updateOrderFromDb(db, order) }
              );

            return order;
          } catch (e) {
            console.log(
              '[update-order-user] - Orders MongoDB Id:',
              order._id.toString(),
              '- error:',
              e
            );
          }
        })
      )
    ).filter((order) => order !== undefined)
  );
});

router.put('/update-order-all', authenticateApiKey, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    (
      await Promise.all(
        (
          await db
            .collection('orders')
            .find({ status: ORDER_STATUS.PENDING })
            .toArray()
        ).map(async (order) => {
          try {
            await db
              .collection('orders')
              .updateOne(
                { _id: order._id },
                { $set: await updateOrderFromDb(db, order) }
              );
            return order;
          } catch (e) {
            console.log(
              '[update-order-all] - Orders MongoDB Id:',
              order._id.toString(),
              '- error:',
              e
            );
          }
        })
      )
    ).filter((order) => order !== undefined)
  );
});

router.put('/update-order-completion-user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    (
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
          try {
            await db.collection('orders').updateOne(
              { _id: order._id },
              {
                $set: await updateCompletionOrder(db, order),
              }
            );

            return order;
          } catch (e) {
            console.log(
              '[update-order-completion-user] - Orders MongoDB Id:',
              order._id.toString(),
              '- error:',
              e
            );
          }
        })
      )
    ).filter((order) => order !== undefined)
  );
});

router.put(
  '/update-order-completion-all',
  authenticateApiKey,
  async (req, res) => {
    const db = await Database.getInstance(req);

    res.status(200).send(
      (
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
            try {
              await db.collection('orders').updateOne(
                { _id: order._id },
                {
                  $set: await updateCompletionOrder(db, order),
                }
              );

              return order;
            } catch (e) {
              console.log(
                '[update-order-completion-all] - Orders MongoDB Id:',
                order._id.toString(),
                '- error:',
                e
              );
            }
          })
        )
      ).filter((order) => order !== undefined)
    );
  }
);

router.put('/update-order-completion-seller', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  const filterOrders = await db
    .collection('orders')
    .aggregate([
      {
        $match: {
          orderId: { $exists: true, $ne: '' },
          isComplete: false,
          status: ORDER_STATUS.COMPLETION,
        },
      },
      {
        $lookup: {
          from: 'offers',
          localField: 'offerId',
          foreignField: 'offerId',
          as: 'offer',
        },
      },
      {
        $match: {
          'offer.userId': res.locals.userId,
        },
      },
    ])
    .toArray();

  res.status(200).send(
    (
      await Promise.all(
        filterOrders.map(async (order) => {
          try {
            await db.collection('orders').updateOne(
              { _id: order._id },
              {
                $set: await updateCompletionOrder(db, order),
              }
            );

            return order;
          } catch (e) {
            console.log(
              '[update-order-completion-seller] - Orders MongoDB Id:',
              order._id.toString(),
              '- error:',
              e
            );
          }
        })
      )
    ).filter((order) => order !== undefined)
  );
});

export default router;
