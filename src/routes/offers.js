import express, { query } from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import {
  createOfferValidator,
  getOfferByIdValidator,
  deleteOfferValidator,
  updateOfferValidator,
} from '../validators/offers.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

// POST

router.post('/', createOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.send(validator).status(400);
  }
  let collection = db.collection('offers');
  let newDocument = req.body;
  newDocument.date = new Date();
  newDocument.userId = res.locals.userId;
  let result = await collection.insertOne(newDocument);
  res.send(result).status(201);
});

// GET

router.get('/', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

router.get('/user', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({ userId: res.locals.userId }).toArray();
  res.send(results).status(200);
});

router.get('/:idOffer', getOfferByIdValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.send(validator).status(400);
  }
  let collection = db.collection('offers');
  let result = await collection.findOne({
    _id: new ObjectId(req.params.idOffer),
  });
  if (result?.userId === res.locals.userId) {
    res.send(result).status(200);
  } else {
    res.status(404).send({
      message: 'Not Found',
    });
  }
});

// DELETE

router.delete(
  '/:idOffer',
  deleteOfferValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.send(validator).status(400);
    }
    const query = { tokenId: req.params.idOffer };
    const collection = db.collection('offers');
    const offer = await collection.findOne(query);
    if (offer?.userId === res.locals.userId) {
      let result = await collection.deleteOne(query);
      res.send(result).status(200);
    } else {
      res.sendStatus(404);
    }
  }
);

// PUT

router.put('/:idOffer', updateOfferValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.send(validator).status(400);
  }
  const query = { _id: new ObjectId(req.params.idOffer) };
  const collection = db.collection('offers');
  const offer = await collection.findOne(query);
  if (offer?.userId === res.locals.userId) {
    const updateDoc = {
      $set: {
        isActive: !offer.isActive,
      },
    };
    const options = { upsert: false };
    const result = await collection.updateOne(query, updateDoc, options);
    res.send(result).status(200);
  } else {
    res.sendStatus(404);
  }
});

export default router;
