import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonBoolean,
  testNonMongodbId,
} from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionTokens,
  pathTokens,
  token,
  toDeleteDb,
} from './utils/variables.js';
import { Database } from '../db/conn.js';

chai.use(chaiHttp);

describe('Tokens route - Validators', async function () {
  /* The above code is a test cleanup function that runs after each test. It gets an instance of a
database and checks if the namespace is 'grindery-delight-test-server'. If it is, it drops the
'blockchains' collection from the database. This ensures that the database is cleaned up after each
test and is ready for the next test. */
  afterEach(async function () {
    const db = await Database.getInstance({});
    if (db.namespace === 'grindery-delight-test-server') {
      db.dropDatabase();
    }
  });

  // Retry all tests in this suite up to 4 times
  this.retries(4);

  describe('POST new token', async function () {
    for (const testCase of Object.keys(token)) {
      if (testCase !== 'isNative' && testCase !== 'isActive') {
        testNonString({
          method: 'post',
          path: pathTokens,
          body: {
            ...token,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      testNonEmpty({
        method: 'post',
        path: pathTokens,
        body: {
          ...token,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }
  });

  describe('GET by MongoDBId', async function () {
    testNonMongodbId({
      method: 'get',
      path: '/unit-test/tokens/1111111111111111',
      body: {},
      query: {},
      field: 'tokenId',
    });
  });

  describe('PUT by MongoDBId', async function () {
    for (const testCase of Object.keys(token)) {
      if (testCase === 'isActive' || testCase === 'isNative') {
        testNonBoolean({
          method: 'put',
          path: '/unit-test/tokens/111111111111111111111111',
          body: {
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else {
        testNonString({
          method: 'put',
          path: '/unit-test/tokens/111111111111111111111111',
          body: {
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      testNonEmpty({
        method: 'put',
        path: '/unit-test/tokens/111111111111111111111111',
        body: {
          ...token,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }

    testUnexpectedField({
      method: 'put',
      path: '/unit-test/tokens/111111111111111111111111',
      body: {
        unexpectedField: 'unexpectedField',
      },
      query: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'put',
      path: '/unit-test/tokens/111111111111111111111111',
      body: {},
      query: { unexpectedField: 'unexpectedField' },
      field: 'unexpectedField',
      location: 'query',
    });

    testNonMongodbId({
      method: 'put',
      path: '/unit-test/tokens/1111111111111111',
      body: {},
      query: {},
      field: 'tokenId',
    });
  });

  describe('DELETE by MongoDBId', async function () {
    testNonMongodbId({
      method: 'delete',
      path: '/unit-test/tokens/1111111111111111',
      body: {},
      query: {},
      field: 'tokenId',
    });
  });
});
