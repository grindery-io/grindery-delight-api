import express from 'express';
import { isRequired } from '../utils/auth-utils.js';
import {
  getBalanceTokenValidator,
  getDroneAddressValidator,
} from '../validators/view-blockchains.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { ethers } from 'ethers';
import { createRequire } from 'node:module';
import { Database } from '../db/conn.js';
import { getProviderFromRpc } from '../utils/view-blockchains-utils.js';
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
      .status(200)
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
      );
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
      .status(200)
      .send(
        await new ethers.Contract(
          process.env.EVM_HUB_ADDRESS,
          GrinderyNexusHub,
          getProviderFromRpc(chain.rpc[0])
        ).getUserDroneAddress(res.locals.userId.split(':').pop())
      );
  }
);

router.post('/master-contract-address', async (req, res) => {
  const db = await Database.getInstance(req);
  const collection = db.collection('blockchains');

  const blockchain = await collection.findOne({
    caipId: req.body.params?.fieldData?._grinderyChain,
  });

  res.status(200).send({
    inputFields: [
      {
        key: '_grinderyChain',
        required: true,
        type: 'string',
        label: 'Blockchain',
      },
      {
        key: '_mercariMasterContractAddress',
        label: 'Mercari master contract address',
        type: 'string',
        required: true,
        placeholder: 'Mercari master contract address',
        computed: true,
        default: blockchain
          ? blockchain.usefulAddresses.grtPoolAddress
          : '0x0000000000000000000000000000000000000000',
      },
    ],
  });
});

export default router;
