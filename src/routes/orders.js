import express from 'express';
import { Database } from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import {
  createOrderValidator,
  getOrderByIdValidator,
  setOrderCompleteValidator,
  getOrderByOrderIdValidator,
  deleteOrderValidator,
} from '../validators/orders.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

/* This is a POST request that creates a new order. */
router.post('/', createOrderValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('orders');

  if (validator.length) {
    return res.status(400).send(validator);
  }
  if (
    !(await collection.findOne({
      orderId: req.body.orderId,
    }))
  ) {
    let newDocument = req.body;
    newDocument.date = new Date();
    newDocument.userId = res.locals.userId;
    newDocument.isComplete = false;
    newDocument.status = 'pending';
    res.send(await collection.insertOne(newDocument)).status(201);
  } else {
    res.status(404).send({
      msg: 'This order already exists.',
    });
  }
});

/* This is a GET request that returns all orders for a specific user. */
router.get('/user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);
  const collection = db.collection('orders');

  res
    .send(
      await collection
        .find({ userId: { $regex: res.locals.userId, $options: 'i' } })
        .toArray()
    )
    .status(200);
});

/* This is a GET request that returns a order for a specific user by the order id. */
router.get(
  '/orderId',
  getOrderByOrderIdValidator,
  isRequired,
  async (req, res) => {
    const db = await Database.getInstance(req);
    const collection = db.collection('orders');
    const validator = validateResult(req, res);

    if (validator.length) {
      return res.status(400).send(validator);
    }

    res
      .send(
        await collection.findOne({
          userId: { $regex: res.locals.userId, $options: 'i' },
          orderId: req.query.orderId,
        })
      )
      .status(200);
  }
);

/* This is a GET request that returns a order for a specific user by the order id. */
router.get('/id', getOrderByIdValidator, isRequired, async (req, res) => {
  const db = await Database.getInstance(req);
  const collection = db.collection('orders');
  const validator = validateResult(req, res);

  if (validator.length) {
    return res.status(400).send(validator);
  }

  res
    .send(
      await collection.findOne({
        userId: { $regex: res.locals.userId, $options: 'i' },
        _id: new ObjectId(req.query.id),
      })
    )
    .status(200);
});

router.get('/liquidity-provider', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);
  const collection = db.collection('orders');
  const collectionOffer = db.collection('offers');

  let result = [];
  const activeOffersForUser = await collectionOffer
    .find({
      userId: { $regex: res.locals.userId, $options: 'i' },
      isActive: true,
    })
    .toArray();

  await Promise.all(
    activeOffersForUser.map(async (offer) => {
      const OrdersForUser = await collection
        .find({
          offerId: offer.offerId,
        })
        .toArray();
      result.push(...OrdersForUser);
    })
  );

  res.send(result).status(200);
});

/* This is a PUT request that adds a order to an offer. */
router.put(
  '/complete',
  setOrderCompleteValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('orders');

    if (validator.length) {
      return res.status(400).send(validator);
    }
    const order = await collection.findOne({
      orderId: req.body.orderId,
      userId: { $regex: res.locals.userId, $options: 'i' },
    });
    if (order) {
      res.status(200).send(
        await collection.updateOne(order, {
          $set: {
            isComplete: true,
          },
        })
      );
    } else {
      res.status(404).send({
        msg: 'No order found.',
      });
    }
  }
);

router.delete(
  '/:orderId',
  deleteOrderValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('orders');

    if (validator.length) {
      return res.status(400).send(validator);
    }
    const order = await collection.findOne({
      orderId: req.params.orderId,
      userId: { $regex: res.locals.userId, $options: 'i' },
    });
    if (order) {
      res.status(200).send(await collection.deleteOne(order));
    } else {
      res.status(404).send({
        msg: 'No order found',
      });
    }
  }
);

export default router;
