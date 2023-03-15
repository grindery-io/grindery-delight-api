import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';

const router = express.Router();

/* Getting the offers from the database. */
router.get('/', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

/* This is a get request that is looking for a specific offer. */
router.get('/idOffer=:idOffer', isRequired, async (req, res) => {
  let collection = db.collection('offers');
  let results = await collection
    .find({ idOffer: req.params.idOffer })
    .toArray();
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
router.delete('/idOffer=:idOffer', isRequired, async (req, res) => {
  const query = { idOffer: req.params.idOffer };
  const collection = db.collection('offers');
  let result = await collection.deleteOne(query);

  res.send(result).status(200);
});

export default router;
