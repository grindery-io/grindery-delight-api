import express from 'express';
import isRequired from '../utils/auth-utils.js';
import {
  getBalanceTokenValidator,
  getDroneAddressValidator,
} from '../validators/view-blockchains.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ethers } from 'ethers';
import { createRequire } from 'node:module';
import getDBConnection from '../db/conn.js';
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
    const collectionBlockchains = (await getDBConnection(req)).collection(
      'blockchains'
    );
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const chain = await collectionBlockchains.findOne({
      chainId: req.query.chainId,
    });
    const provider = new ethers.providers.JsonRpcProvider(chain.rpc[0]);

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
    const chain = await collectionBlockchains.findOne({
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

export default router;
