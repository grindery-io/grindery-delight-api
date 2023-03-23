import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';

const router = express.Router();
const collection = db.collection('admins');

router.get('/', isRequired, async (req, res) => {
  res.status(200).send(
    (await collection.findOne({
      userId: res.locals.userId,
    }))
      ? true
      : false
  );
});

export default router;
