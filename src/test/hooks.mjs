import { Database } from '../db/conn.js';
import { collectionAdmins } from './utils/variables.js';

export const mochaHooks = {
  beforeEach: async function () {
    await collectionAdmins.insertOne({
      userId: process.env.USER_ID_TEST,
    });
  },
  afterEach: async function () {
    const db = await Database.getInstance({});
    if (db.namespace === 'grindery-delight-test-server') {
      await db.dropDatabase();
    }
  },
};
