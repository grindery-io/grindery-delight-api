import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

/* This is a post request to the staking collection. */
router.post('/', isRequired, async (req, res) => {
    let collection = db.collection('staking');
    let newDocument = req.body;
    newDocument.date = new Date();
    newDocument.userId = res.locals.userId;
    let result = await collection.insertOne(newDocument);
    res.send(result).status(201);
});

/* This is a post request to the staking collection. */
router.post('/modify/chainId/:chainId/amount/:amount', isRequired, async (req, res) => {
    let collection = db.collection('staking');
    let result = await collection.updateOne(
        {
            userId: res.locals.userId,
            chainId: req.params.chainId
        },
        {
            $set: {amount: req.params.amount}
        }
    );
    res.send(result).status(201);
});

/* This is a delete request to the staking collection. */
router.delete('/chainId/:chainId', isRequired, async (req, res) => {
    const query = {
        chainId: req.params.chainId,
        userId: res.locals.userId
     };
    const collection = db.collection('staking');
    let result = await collection.deleteOne(query);
    res.send(result).status(200);
});

export default router;
