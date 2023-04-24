import express from 'express';
import { updateStatusOfferValidator } from '../validators/webhook.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();
//const collection = db.collection('offers');

/* This is a POST request that updates colletions based on the message. */
router.put('/', updateStatusOfferValidator, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  console.log(req.body);
});

export default router;
