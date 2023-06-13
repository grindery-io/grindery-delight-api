import express from 'express';
import { isRequired } from '../utils/auth-utils.js';
import { Database } from '../db/conn.js';
import { validateResult } from '../utils/validators-utils.js';
import {
  getNotificationTokenValidator,
  updateNotificationTokenValidator,
} from '../validators/push-notifications.validator.js';

const router = express.Router();

router.put(
  '/',
  isRequired,
  updateNotificationTokenValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);
    const collection = db.collection('notification-tokens');

    res.status(200).send(
      await collection.updateOne(
        {
          userId: res.locals.userId,
        },
        {
          $set: { token: req.body.token },
        },
        { upsert: true }
      )
    );
  }
);

router.delete(
  '/:token',
  isRequired,
  getNotificationTokenValidator,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);
    const collection = db.collection('notification-tokens');

    const token = await collection.findOne({
      token: req.params.token,
      userId: res.locals.userId,
    });

    if (!token) {
      res.status(404).send({
        msg: 'No notification token found',
      });
    }

    res.status(200).send(await collection.deleteOne(token));
  }
);

export default router;
