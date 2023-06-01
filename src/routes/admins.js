import express from 'express';
import { Database } from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';

const router = express.Router();

router.get('/', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);
  const collection = db.collection('admins');
  res.status(200).send(
    !!(await collection.findOne({
      userId: { $regex: res.locals.userId, $options: 'i' },
    }))
  );
});

export default router;
