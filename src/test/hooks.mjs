import { Database } from '../db/conn.js';
import {
  blockchainBscTestnet,
  blockchainGoerli,
  collectionAdmins,
  collectionBlockchains,
} from './utils/variables.js';

export const mochaHooks = {
  beforeEach: async function () {
    await collectionAdmins.insertOne({
      userId: process.env.USER_ID_TEST,
    });

    await collectionBlockchains.insertOne({
      ...blockchainGoerli,
    });

    await collectionBlockchains.insertOne(blockchainBscTestnet);
  },
  afterEach: async function () {
    const db = await Database.getInstance({});
    if (db.namespace === 'grindery-delight-test-server') {
      await db.dropDatabase();
    }
  },
};
