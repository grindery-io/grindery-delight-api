import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

/* Getting the offers from the database. */
router.get('/', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

/* This is a get request that is looking for a specific offer. */
router.get('/:idOffer', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.findOne({
    _id: new ObjectId(req.params.idOffer),
  });
  res.send(results).status(200);
});

/* This is a get request that is looking user offers. */
router.get('/user', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({ userId: res.locals.userId }).toArray();
  res.send(results).status(200);
});

/* Creating a new document in the database. */
router.post('/', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let newDocument = req.body;
  newDocument.date = new Date();
  newDocument.userId = res.locals.userId;
  let result = await collection.insertOne(newDocument);
  res.send(result).status(201);
});

/* Deleting an entry from the database. */
router.delete('/:idOffer', isRequired, async (req, res) => {
  const query = { _id: req.params.idOffer };
  const collection = db.collection('offers');
  let result = await collection.deleteOne({
    _id: new ObjectId(query._id),
  });
  res.send(result).status(200);
});

export default router;
