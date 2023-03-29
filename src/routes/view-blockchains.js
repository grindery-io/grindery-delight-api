import express from 'express';
import db from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { getBalanceTokenValidator } from '../validators/view-blockchains.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ethers } from 'ethers';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const ERC20 = require('../abis/erc20.json');
const router = express.Router();
const blockchainsCollection = db.collection('blockchains');

router.get(
  '/balance-token',
  getBalanceTokenValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }
    const chain = await blockchainsCollection.findOne({
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

export default router;
