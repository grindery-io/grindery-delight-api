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
  getAbis,
  getOrderIdFromHash,
  getOrderInformation,
  getProviderFromRpc,
} from '../utils/view-blockchains-utils.js';
const require = createRequire(import.meta.url);

const ERC20 = require('../abis/erc20.json');
const GrinderyNexusHub = require('../abis/GrinderyNexusHub.json');
const router = express.Router();
const GrtPoolAddress = '0x29e2b23FF53E6702FDFd8C8EBC0d9E1cE44d241A';

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
          new ethers.providers.JsonRpcProvider(chain.rpc[0])
        ).getUserDroneAddress(res.locals.userId.split(':').pop())
      )
      .status(200);
  }
);

router.put('/update-order-user', isRequired, async (req, res) => {
  const db = await Database.getInstance(req);

  const orders = await db
    .collection('orders')
    .find({ userId: res.locals.userId })
    .toArray();

  const modifiedOrders = await Promise.all(
    orders.map(async (order) => {
      const chain = await db.collection('blockchains').findOne({
        chainId: order.chainId,
      });

      const orderId = await getOrderIdFromHash(chain.rpc[0], order.hash);

      if (orderId === '') {
        order.status = 'failure';
      } else {
        const onChainOrder = await getOrderInformation(
          new ethers.Contract(
            GrtPoolAddress,
            (
              await getAbis()
            ).poolAbi,
            getProviderFromRpc(chain.rpc[0])
          ),
          orderId
        );

        order.amountTokenDeposit = onChainOrder.depositAmount;
        order.addressTokenDeposit = onChainOrder.depositToken;
        order.chainIdTokenDeposit = onChainOrder.depositChainId;
        order.destAddr = onChainOrder.destAddr;
        order.offerId = onChainOrder.offerId;
        order.amountTokenOffer = onChainOrder.amountTokenOffer;
        order.status = 'success';
      }
      return order;
    })
  );

  res.status(200).send(
    await Promise.all(
      modifiedOrders.map(async (order) => {
        await db
          .collection('orders')
          .updateOne({ _id: order._id }, { $set: order });

        return order;
      })
    )
  );
});

export default router;
