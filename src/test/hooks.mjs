import { Database } from '../db/conn.js';

export const mochaHooks = {
  beforeEach: async function () {
    const db = await Database.getInstance({});
    const collectionAdmin = db.collection('admins');
    await collectionAdmin.insertOne({
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
