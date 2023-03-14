import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";

const router = express.Router();

/* Getting the offers from the database. */
router.get("/", async (req, res) => {
  let collection = db.collection("offers");
  let results = await collection.find({})
    .toArray();
  res.send(results).status(200);
});

/* This is a get request that is looking for a specific offer. */
router.get("/idOffer=:idOffer", async (req, res) => {
  let collection = db.collection("offers");
  let results = await collection.find({idOffer: req.params.idOffer})
    .toArray();
  res.send(results).status(200);
});

/* Creating a new document in the database. */
router.post("/", async (req, res) => {
  let collection = db.collection("offers");
  let newDocument = req.body;
  newDocument.date = new Date();
  let result = await collection.insertOne(newDocument);
  res.send(result).status(204);
});

/* Deleting an entry from the database. */
router.delete("/idOffer=:idOffer", async (req, res) => {
  const query = { idOffer: req.params.idOffer };
  const collection = db.collection("offers");
  let result = await collection.deleteOne(query);

  res.send(result).status(200);
});

export default router;