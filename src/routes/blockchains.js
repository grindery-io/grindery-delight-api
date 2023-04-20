import express from 'express';
import getDBConnection from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import {
  createBlockchainValidator,
  getBlockchainByIdValidator,
  modifyBlockchainValidator,
  getUsefullAddressByNameValidator,
} from '../validators/blockchains.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

/* This is a post request to the blockchain route. It is using the createBlockchainValidator to
validate the request body. It is also using the isRequired middleware to check if the user is logged
in. If the user is not logged in, it will return a 401 error. If the user is logged in, it will
check if the blockchain already exists. If it does not exist, it will create the blockchain. If it
does exist, it will return a 404 error. */
router.post('/', createBlockchainValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const collectionAdmin = (await getDBConnection(req)).collection('admins');
  const collection = (await getDBConnection(req)).collection('blockchains');
  if (
    validator.length ||
    !(await collectionAdmin.findOne({ userId: res.locals.userId }))
  ) {
    return res.status(400).send(validator);
  }
  if (!(await collection.findOne({ caipId: req.body.caipId }))) {
    res.send(await collection.insertOne(req.body)).status(201);
  } else {
    res.status(404).send({
      msg: 'This blockchain already exists.',
    });
  }
});

/* This is a get request to the blockchain route. It is using the getBlockchainByIdValidator to
validate the request body. It is also using the isRequired middleware to check if the user is logged
in. If the user is not logged in, it will return a 401 error. If the user is logged in, it will
check if the blockchain already exists. If it does not exist, it will create the blockchain. If it
does exist, it will return a 404 error. */
router.get('/active', isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const collection = (await getDBConnection(req)).collection('blockchains');
  if (validator.length) {
    return res.status(400).send(validator);
  }
  res.status(200).send(
    await collection
      .find({
        isActive: true,
      })
      .toArray()
  );
});

/* This is a get request to the blockchain route. It is using the getBlockchainByIdValidator to
validate the request body. It is also using the isRequired middleware to check if the user is logged
in. If the user is not logged in, it will return a 401 error. If the user is logged in, it will
check if the blockchain already exists. If it does not exist, it will create the blockchain. If it
does exist, it will return a 404 error. */
router.get(
  '/:blockchainId',
  getBlockchainByIdValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const collection = (await getDBConnection(req)).collection('blockchains');
    if (validator.length) {
      return res.status(400).send(validator);
    }
    res.status(200).send(
      await collection.findOne({
        _id: new ObjectId(req.params.blockchainId),
      })
    );
  }
);

router.put(
  '/:blockchainId',
  modifyBlockchainValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const collectionAdmin = (await getDBConnection(req)).collection('admins');
    const collection = (await getDBConnection(req)).collection('blockchains');
    const user = await collectionAdmin.findOne({ userId: res.locals.userId });
    if (validator.length || !user) {
      return res.status(400).send(validator);
    }

    const blockchain = await collection.findOne({
      _id: new ObjectId(req.params.blockchainId),
    });
    if (!blockchain) {
      return res.status(404).send({ msg: 'No blockchain found' });
    }

    res.status(200).send(
      await collection.updateOne(blockchain, {
        $set: {
          chainId: req.body.chainId ?? blockchain.chainId,
          caipId: req.body.caipId ?? blockchain.caipId,
          label: req.body.label ?? blockchain.label,
          icon: req.body.icon ?? blockchain.icon,
          rpc: req.body.rpc ?? blockchain.rpc,
          nativeTokenSymbol:
            req.body.nativeTokenSymbol ?? blockchain.nativeTokenSymbol,
          isEvm: req.body.isEvm ?? blockchain.isEvm,
          isTestnet: req.body.isTestnet ?? blockchain.isTestnet,
          isActive: req.body.isActive ?? blockchain.isActive,
          transactionExplorerUrl:
            req.body.transactionExplorerUrl ??
            blockchain.transactionExplorerUrl,
          addressExplorerUrl:
            req.body.addressExplorerUrl ?? blockchain.addressExplorerUrl,
          usefulAddresses:
            req.body.usefulAddresses ?? blockchain.usefulAddresses,
        },
      })
    );
  }
);

/* This is a delete request to the blockchain route. It is using the getBlockchainByIdValidator to
validate the request body. It is also using the isRequired middleware to check if the user is logged
in. If the user is not logged in, it will return a 401 error. If the user is logged in, it will
check if the blockchain already exists. If it does not exist, it will create the blockchain. If it
does exist, it will return a 404 error. */
router.delete(
  '/:blockchainId',
  getBlockchainByIdValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const collection = (await getDBConnection(req)).collection('blockchains');
    const collectionAdmin = (await getDBConnection(req)).collection('admins');
    if (
      validator.length ||
      !(await collectionAdmin.findOne({ userId: res.locals.userId }))
    ) {
      return res.status(400).send(validator);
    }
    const blockchain = await collection.findOne({
      _id: new ObjectId(req.params.blockchainId),
    });
    if (blockchain) {
      res.status(200).send(await collection.deleteOne(blockchain));
    } else {
      res.status(404).send({
        msg: 'No blockchain found',
      });
    }
  }
);

/* This is a post request to the blockchain route. It is using the createBlockchainValidator to
validate the request body. It is also using the isRequired middleware to check if the user is logged
in. If the user is not logged in, it will return a 401 error. If the user is logged in, it will
check if the blockchain already exists. If it does not exist, it will create the blockchain. If it
does exist, it will return a 404 error. */
router.post('/', createBlockchainValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const collectionAdmin = (await getDBConnection(req)).collection('admins');
  const collection = (await getDBConnection(req)).collection('blockchains');
  if (
    validator.length ||
    !(await collectionAdmin.findOne({ userId: res.locals.userId }))
  ) {
    return res.status(400).send(validator);
  }
  if (!(await collection.findOne({ caipId: req.body.caipId }))) {
    res.send(await collection.insertOne(req.body)).status(201);
  } else {
    res.status(404).send({
      msg: 'This blockchain already exists.',
    });
  }
});

export default router;

/* This is a delete request to usefull address in the blockchain route. It is using the getUsefullAddressByNameValidator to
validate the request body. It is also using the isRequired middleware to check if the user is logged
in. If the user is not logged in, it will return a 401 error. If the user is logged in, it will
check if the blockchain and usefull address already exists. If it does not exist, it will return a 404 error. If it
exist, it will delete the usefull address. */
router.delete(
  '/useful-address/:blockchainId',
  getUsefullAddressByNameValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const collection = (await getDBConnection(req)).collection('blockchains');
    const collectionAdmin = (await getDBConnection(req)).collection('admins');
    if (
      validator.length ||
      !(await collectionAdmin.findOne({ userId: res.locals.userId }))
    ) {
      return res.status(400).send(validator);
    }
    const response = await collection.updateOne(
      { _id: new ObjectId(req.params.blockchainId) },
      { $pull: { usefulAddresses: { contract: req.query.contract } } },
      false,
      true
    );
    if (response.modifiedCount > 0) {
      res.send(response).status(201);
    } else {
      res.status(404).send({
        msg: 'No blockchain or usefull address found',
      });
    }
  }
);
