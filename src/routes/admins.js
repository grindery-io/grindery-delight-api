import express from 'express';
import getDBConnection from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';

const router = express.Router();

router.get('/', isRequired, async (req, res) => {
  const collection = (await getDBConnection(req)).collection('admins');
  res.status(200).send(
    (await collection.findOne({
      userId: res.locals.userId,
    }))
      ? true
      : false
  );
});

export default router;
