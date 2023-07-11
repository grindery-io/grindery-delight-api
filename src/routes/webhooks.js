import express from 'express';
import {
  updateStatusOfferValidator,
  updateOfferValidator,
  updateOrderValidator,
  updateOfferOrderPaidValidator,
  updateOfferOrderCompletionValidator,
} from '../validators/webhook.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { Database } from '../db/conn.js';
import { authenticateApiKey } from '../utils/auth-utils.js';
import { OFFER_STATUS } from '../utils/offers-utils.js';
import { ORDER_STATUS } from '../utils/orders-utils.js';
import { sendNotification } from '../utils/notification-utils.js';

const router = express.Router();

/* This is a PUT request that updates status offer. */
router.put(
  '/offer/activation-deactivation',
  authenticateApiKey,
  updateStatusOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);
    const collection = db.collection('offers');

    const offer = await collection.findOne({
      offerId: req.body._offerId,
    });

    if (!offer) {
      return res.status(404).send({
        msg: 'Not offer found.',
      });
    }

    const response = await collection.updateOne(offer, {
      $set: {
        isActive: req.body._isActive,
        status: OFFER_STATUS.SUCCESS,
      },
    });
    if (response.modifiedCount > 0) {
      sendNotification('activationDeactivation', {
        type: 'offer',
        id: req.body._offerId,
        userId: offer.userId,
      });
    }
    return res.status(200).send(response);
  }
);

/* This is a PUT request that updates the offer id. */
router.put(
  '/offer',
  authenticateApiKey,
  updateOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);
    const collection = db.collection('offers');

    const offer = await collection.findOne({
      hash: req.body._grinderyTransactionHash,
    });

    if (!offer) {
      return res.status(404).send({
        msg: 'No offer found',
      });
    }

    const response = await collection.updateOne(offer, {
      $set: {
        offerId: req.body._offerId,
        status: OFFER_STATUS.SUCCESS,
        isActive: true,
      },
    });
    if (response.modifiedCount > 0) {
      sendNotification('creation', {
        type: 'offer',
        id: req.body._offerId,
        userId: offer.userId,
      });
    }
    return res.status(200).send(response);
  }
);

/* This is a PUT request that updates offer trade. */
router.put(
  '/order',
  authenticateApiKey,
  updateOrderValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);
    const collection = db.collection('orders');

    const order = await collection.findOne({
      hash: req.body._grinderyTransactionHash,
    });

    if (!order) {
      return res.status(404).send({
        msg: 'No order found',
      });
    }

    const response = await collection.updateOne(order, {
      $set: {
        orderId: req.body._tradeId,
        status: ORDER_STATUS.SUCCESS,
      },
    });
    if (response.modifiedCount > 0) {
      sendNotification('creation', {
        type: 'order',
        id: req.body._tradeId,
        userId: order.userId,
      });
    }
    return res.status(200).send(response);
  }
);

/* This is a PUT request that updates offer trade when paid. */
router.put(
  '/offer/order/paid',
  updateOfferOrderPaidValidator,
  authenticateApiKey,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);
    const collection = db.collection('orders');

    const order = await collection.findOne({
      orderId: req.body._tradeId,
    });

    if (!order) {
      return res.status(404).send({
        msg: 'No order found',
      });
    }

    const response = await collection.updateOne(order, {
      $set: {
        isComplete: true,
        status: ORDER_STATUS.COMPLETE,
        completionHash: req.body._completionHash,
      },
    });

    const collectionOffer = db.collection('offers');

    const offer = await collectionOffer.findOne({
      offerId: order.offerId,
    });

    if (!offer) {
      return res.status(404).send({
        msg: 'No offer found',
      });
    }

    if (response.modifiedCount > 0) {
      sendNotification('completion', {
        type: 'order',
        id: order.orderId,
        userId: order.userId,
      });
      sendNotification('completion', {
        type: 'order',
        id: order.orderId,
        userId: offer.userId,
      });
    }
    return res.status(200).send(response);
  }
);

/* This is a PUT request that updates offer trade. */
router.put(
  '/offer/order/completion',
  updateOfferOrderCompletionValidator,
  authenticateApiKey,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);
    const collection = db.collection('orders');

    const order = await collection.findOne({
      orderId: req.body._tradeId,
      status: ORDER_STATUS.SUCCESS,
    });

    if (!order) {
      return res.status(404).send({
        msg: 'No order found',
      });
    }

    const response = await collection.updateOne(order, {
      $set: {
        status: ORDER_STATUS.COMPLETION,
        completionHash: req.body._completionHash,
      },
    });

    const collectionOffer = db.collection('offers');

    const offer = await collectionOffer.findOne({
      offerId: order.offerId,
    });

    if (!offer) {
      return res.status(404).send({
        msg: 'No offer found',
      });
    }

    if (response.modifiedCount > 0) {
      sendNotification('completion', {
        type: 'order',
        id: order.orderId,
        userId: order.userId,
      });
      sendNotification('completion', {
        type: 'order',
        id: order.orderId,
        userId: offer.userId,
      });
    }
    return res.status(200).send(response);
  }
);

export default router;
