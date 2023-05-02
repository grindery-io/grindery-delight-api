import express from 'express';
import { Database } from '../db/conn.js';
import isRequired from '../utils/auth-utils.js';
import { ObjectId } from 'mongodb';
import {
  createBlockchainValidator,
  getBlockchainByIdValidator,
  modifyBlockchainValidator,
  getUsefullAddressByNameValidator,
  modifyUsefullAddressValidator,
} from '../validators/blockchains.validator.js';
import { validateResult } from '../utils/validators-utils.js';

const router = express.Router();

/* This is a POST request to create a new blockchain. It is using the `createBlockchainValidator` and
`isRequired` middleware to validate the request body and check if the user is logged in. It first
checks if there are any validation errors or if the user is not an admin. If there are errors or the
user is not an admin, it returns a 400 error. If the blockchain with the same `caipId` already
exists, it returns a 404 error. Otherwise, it inserts the new blockchain into the database and
returns a 201 status code. */
router.post('/', createBlockchainValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collectionAdmin = db.collection('admins');
  const collection = db.collection('blockchains');
  if (
    validator.length ||
    !(await collectionAdmin.findOne({
      userId: { $regex: res.locals.userId, $options: 'i' },
    }))
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
router.get('/active', async (req, res) => {
  const validator = validateResult(req, res);
  const db = await Database.getInstance(req);
  const collection = db.collection('blockchains');
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
    const db = await Database.getInstance(req);
    const collection = db.collection('blockchains');

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

/* This is a PUT request to modify an existing blockchain. It is using the `modifyBlockchainValidator`
and `isRequired` middleware to validate the request body and check if the user is logged in. It
first checks if there are any validation errors or if the user is not an admin. If there are errors
or the user is not an admin, it returns a 400 error. If the blockchain with the specified
`blockchainId` does not exist, it returns a 404 error. Otherwise, it updates the blockchain with the
new values provided in the request body and returns a 200 status code. */
router.put(
  '/:blockchainId',
  modifyBlockchainValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collectionAdmin = db.collection('admins');
    const collection = db.collection('blockchains');

    const user = await collectionAdmin.findOne({
      userId: { $regex: res.locals.userId, $options: 'i' },
    });
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
    const db = await Database.getInstance(req);
    const collectionAdmin = db.collection('admins');
    const collection = db.collection('blockchains');

    if (
      validator.length ||
      !(await collectionAdmin.findOne({
        userId: { $regex: res.locals.userId, $options: 'i' },
      }))
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

/* This is a post request to usefull address in the blockchain route. It is using the modifyUsefullAddressValidator to
validate the request body. It is also using the isRequired middleware to check if the user is logged
in. If the user is not logged in, it will return a 401 error. If the user is logged in, it will
check if the usefull address already exists. If it does not exist, it will create a new usefull address. If it
exist, it will update actual the usefull address. */
router.put(
  '/useful-address/:blockchainId',
  modifyUsefullAddressValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    const db = await Database.getInstance(req);
    const collectionAdmin = db.collection('admins');
    const collection = db.collection('blockchains');

    if (
      validator.length ||
      !(await collectionAdmin.findOne({
        userId: { $regex: res.locals.userId, $options: 'i' },
      }))
    ) {
      return res.status(400).send(validator);
    }

    const blockchain = await collection.findOne({
      _id: new ObjectId(req.params.blockchainId),
    });

    if (!blockchain) {
      res.status(404).send({
        msg: 'No blockchain found',
      });
    }

    res.status(200).send(
      await collection.updateOne(blockchain, {
        $set: { [`usefulAddresses.${req.body.contract}`]: req.body.address },
      })
    );
  }
);

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
    const db = await Database.getInstance(req);
    const collectionAdmin = db.collection('admins');
    const collection = db.collection('blockchains');

    if (
      validator.length ||
      !(await collectionAdmin.findOne({
        userId: { $regex: res.locals.userId, $options: 'i' },
      }))
    ) {
      return res.status(400).send(validator);
    }

    const blockchain = await collection.findOne({
      _id: new ObjectId(req.params.blockchainId),
      [`usefulAddresses.${req.body.contract}`]: { $exists: true },
    });

    if (!blockchain) {
      res.status(404).send({
        msg: 'No blockchain found or contract doesnt exist',
      });
    }

    res
      .status(200)
      .send(
        await collection.updateOne(
          { _id: new ObjectId(req.params.blockchainId) },
          { $unset: { [`usefulAddresses.${req.body.contract}`]: 1 } }
        )
      );
  }
);

export default router;
