import { Database } from '../db/conn.js';
import {
  mockBlockchainBscTestnet,
  mockBlockchainGoerli,
  collectionAdmins,
  collectionBlockchains,
} from './utils/variables.js';

export const mochaHooks = {
  beforeEach: async function () {
    await collectionAdmins.insertOne({
      userId: process.env.USER_ID_TEST,
    });

    await collectionBlockchains.insertOne({
      ...mockBlockchainGoerli,
    });

    await collectionBlockchains.insertOne(mockBlockchainBscTestnet);
  },
  afterEach: async function () {
    const db = await Database.getInstance({});
    if (db.namespace === 'grindery-delight-test-server') {
      await db.dropDatabase();
    }
  },
};
