import express from 'express';
import isRequired from '../utils/auth-utils.js';
import {
  getBalanceTokenValidator,
  getDroneAddressValidator,
} from '../validators/view-blockchains.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ethers } from 'ethers';
import { createRequire } from 'node:module';
import { Database } from '../db/conn.js';
import {
  getProviderFromRpc,
  updateCompletionOrder,
  updateOrderFromDb,
} from '../utils/view-blockchains-utils.js';
const require = createRequire(import.meta.url);

const ERC20 = require('../abis/erc20.json');
const GrinderyNexusHub = require('../abis/GrinderyNexusHub.json');
const router = express.Router();

router.get(
  '/balance-token',
  getBalanceTokenValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);

    const chain = await db.collection('blockchains').findOne({
      chainId: req.query.chainId,
    });

    const provider = getProviderFromRpc(chain.rpc[0]);
    res
      .send(
        req.query.tokenAddress === '0x0'
          ? (await provider.getBalance(req.query.address)).toString()
          : (
              await new ethers.Contract(
                req.query.tokenAddress,
                ERC20,
                provider
              ).balanceOf(req.query.address)
            ).toString()
      )
      .status(200);
  }
);

router.get(
  '/drone-address',
  getDroneAddressValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    const db = await Database.getInstance(req);

    const chain = await db.collection('blockchains').findOne({
      chainId: req.query.chainId,
    });

    res
      .send(
        await new ethers.Contract(
          process.env.EVM_HUB_ADDRESS,
          GrinderyNexusHub,
          getProviderFromRpc(chain.rpc[0])
        ).getUserDroneAddress(res.locals.userId.split(':').pop())
      )
      .status(200);
  }
);

router.put('/update-order-user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('orders')
          .find({ userId: res.locals.userId })
          .toArray()
      ).map(async (order) => {
        await db
          .collection('orders')
          .updateOne(order, { $set: await updateOrderFromDb(db, order) });

        return order;
      })
    )
  );
});

router.put('/update-order-all', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db.collection('orders').find().toArray()
      ).map(async (order) => {
        await db
          .collection('orders')
          .updateOne(order, { $set: await updateOrderFromDb(db, order) });
        return order;
      })
    )
  );
});

router.put('/update-order-completion-user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  res.status(200).send(
    await Promise.all(
      (
        await db
          .collection('orders')
          .find({
            userId: res.locals.userId,
            orderId: { $exists: true, $ne: '' },
            isComplete: false,
          })
          .toArray()
      ).map(async (order) => {
        await db
          .collection('orders')
          .updateOne(order, { $set: await updateCompletionOrder(db, order) });

        return order;
      })
    )
  );
});

export default router;
