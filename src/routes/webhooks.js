import express from 'express';
import {
  updateStatusOfferValidator,
  updateChainIdOfferValidator,
  updateTokenOfferValidator,
  updateMinPriceOfferValidator,
  updateMaxPriceOfferValidator,
  updateOfferValidator,
  updateOrderValidator,
} from '../validators/webhook.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { Database } from '../db/conn.js';
import { dispatch } from '../utils/websocket-utils.js';
import { authenticateApiKey } from '../utils/auth-utils.js';

const router = express.Router();

/* This is a PUT request that updates max price offer. */
router.put(
  '/offer/max-price',
  authenticateApiKey,
  updateMaxPriceOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('offers');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      offerId: req.body._idOffer,
    });
    if (offer) {
      const response = await collection.updateOne(offer, {
        $set: {
          max: req.body._upperLimitFn ? req.body._upperLimitFn : offer.min,
        },
      });
      if (response.modifiedCount > 0)
        dispatch({
          method: 'update',
          params: {
            type: 'offer',
            id: req.body._idOffer,
            userId: offer.userId,
          },
          id: req.body._idOffer,
        });
      return res.status(200).send(response);
    }
    res.status(400).send({
      msg: 'Not found.',
    });
  }
);

/* This is a PUT request that updates min price offer. */
router.put(
  '/offer/min-price',
  authenticateApiKey,
  updateMinPriceOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('offers');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      offerId: req.body._idOffer,
    });
    if (offer) {
      const response = await collection.updateOne(offer, {
        $set: {
          min: req.body._lowerLimitFn ? req.body._lowerLimitFn : offer.min,
        },
      });
      if (response.modifiedCount > 0)
        dispatch({
          method: 'update',
          params: {
            type: 'offer',
            id: req.body._idOffer,
            userId: offer.userId,
          },
          id: req.body._idOffer,
        });
      return res.status(200).send(response);
    }
    res.status(400).send({
      msg: 'Not found.',
    });
  }
);

/* This is a PUT request that updates token offer. */
router.put(
  '/offer/token',
  authenticateApiKey,
  updateTokenOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('offers');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      offerId: req.body._idOffer,
    });
    if (offer) {
      const response = await collection.updateOne(offer, {
        $set: {
          tokenAddress: req.body._token ? req.body._token : offer.tokenAddress,
        },
      });
      if (response.modifiedCount > 0)
        dispatch({
          method: 'update',
          params: {
            type: 'offer',
            id: req.body._idOffer,
            userId: offer.userId,
          },
          id: req.body._idOffer,
        });
      return res.status(200).send(response);
    }
    res.status(400).send({
      msg: 'Not found.',
    });
  }
);

/* This is a PUT request that updates chain id offer. */
router.put(
  '/offer/chain',
  authenticateApiKey,
  updateChainIdOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('offers');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      offerId: req.body._idOffer,
    });
    if (offer) {
      const response = await collection.updateOne(offer, {
        $set: {
          chainId: req.body._chainId ? req.body._chainId : offer.chainId,
        },
      });
      if (response.modifiedCount > 0)
        dispatch({
          method: 'update',
          params: {
            type: 'offer',
            id: req.body._idOffer,
            userId: offer.userId,
          },
          id: req.body._idOffer,
        });
      return res.status(200).send(response);
    }
    res.status(400).send({
      msg: 'Not found.',
    });
  }
);

/* This is a PUT request that updates status offer. */
router.put(
  '/offer/status',
  authenticateApiKey,
  updateStatusOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('offers');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      offerId: req.body._idOffer,
    });
    if (offer) {
      const response = await collection.updateOne(offer, {
        $set: {
          isActive:
            req.body._isActive === undefined
              ? offer.isActive
              : req.body._isActive,
        },
      });
      if (response.modifiedCount > 0)
        dispatch({
          method: 'update',
          params: {
            type: 'offer',
            id: req.body._idOffer,
            userId: offer.userId,
          },
          id: req.body._idOffer,
        });
      return res.status(200).send(response);
    }
    res.status(404).send({
      msg: 'Not found.',
    });
  }
);

/* This is a PUT request that updates the offer id. */
router.put(
  '/offer',
  authenticateApiKey,
  updateOfferValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('offers');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const offer = await collection.findOne({
      hash: req.body._grinderyTransactionHash,
    });
    if (offer) {
      const response = await collection.updateOne(offer, {
        $set: {
          offerId: req.body._idOffer,
          status: 'sucess',
        },
      });
      if (response.modifiedCount > 0)
        dispatch({
          method: 'update',
          params: {
            type: 'offer',
            id: req.body._idOffer,
            userId: offer.userId,
          },
          id: req.body._idOffer,
        });
      return res.status(200).send(response);
    }
    res.status(404).send({
      msg: 'Not found.',
    });
  }
);

/* This is a PUT request that updates offer trade. */
router.put(
  '/order',
  authenticateApiKey,
  updateOrderValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collection = db.collection('orders');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const order = await collection.findOne({
      hash: req.body._grinderyTransactionHash,
    });
    if (order) {
      const response = await collection.updateOne(order, {
        $set: {
          orderId: req.body._idTrade,
          status: 'sucess',
        },
      });
      if (response.modifiedCount > 0)
        dispatch({
          method: 'update',
          params: {
            type: 'order',
            id: req.body._idTrade,
            userId: order.userId,
          },
          id: req.body._idTrade,
        });
      return res.status(200).send(response);
    }
    res.status(404).send({
      msg: 'Not found.',
    });
  }
);

export default router;
