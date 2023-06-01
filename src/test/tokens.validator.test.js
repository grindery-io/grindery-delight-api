import chai from 'chai';
import chaiHttp from 'chai-http';
import {
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonBoolean,
  testNonMongodbId,
} from './utils/utils.js';
import {
  pathTokens_Post,
  pathTokens_Put_MongoDBId,
  mockToken,
  notAMongoDBId,
  randomMongoDBId,
} from './utils/variables.js';

chai.use(chaiHttp);

describe('Tokens route - Validators', async function () {
  describe('POST new mockToken', async function () {
    for (const testCase of Object.keys(mockToken)) {
      if (testCase !== 'isNative' && testCase !== 'isActive') {
        testNonString({
          method: 'post',
          path: pathTokens_Post,
          body: {
            ...mockToken,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      testNonEmpty({
        method: 'post',
        path: pathTokens_Post,
        body: {
          ...mockToken,
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
      path: pathTokens_Put_MongoDBId + notAMongoDBId,
      body: {},
      query: {},
      field: 'tokenId',
    });
  });

  describe('PUT by MongoDBId', async function () {
    for (const testCase of Object.keys(mockToken)) {
      if (testCase === 'isActive' || testCase === 'isNative') {
        testNonBoolean({
          method: 'put',
          path: pathTokens_Put_MongoDBId + randomMongoDBId,
          body: {
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else {
        testNonString({
          method: 'put',
          path: pathTokens_Put_MongoDBId + randomMongoDBId,
          body: {
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      testNonEmpty({
        method: 'put',
        path: pathTokens_Put_MongoDBId + randomMongoDBId,
        body: {
          ...mockToken,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }

    testUnexpectedField({
      method: 'put',
      path: pathTokens_Put_MongoDBId + randomMongoDBId,
      body: {
        unexpectedField: 'unexpectedField',
      },
      query: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'put',
      path: pathTokens_Put_MongoDBId + randomMongoDBId,
      body: {},
      query: { unexpectedField: 'unexpectedField' },
      field: 'unexpectedField',
      location: 'query',
    });

    testNonMongodbId({
      method: 'put',
      path: pathTokens_Put_MongoDBId + notAMongoDBId,
      body: {},
      query: {},
      field: 'tokenId',
    });
  });

  describe('DELETE by MongoDBId', async function () {
    testNonMongodbId({
      method: 'delete',
      path: pathTokens_Put_MongoDBId + notAMongoDBId,
      body: {},
      query: {},
      field: 'tokenId',
    });
  });
});
