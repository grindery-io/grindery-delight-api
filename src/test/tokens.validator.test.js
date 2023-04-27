import chai from 'chai';
import chaiHttp from 'chai-http';
import {
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonBoolean,
  testNonMongodbId,
} from './utils/utils.js';
import { pathTokens, token } from './utils/variables.js';

chai.use(chaiHttp);

describe('Tokens route - Validators', async function () {
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
      path: '/unit-test/tokens/notAMongoDBId',
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
          path: '/unit-test/tokens/myMongoDBId',
          body: {
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else {
        testNonString({
          method: 'put',
          path: '/unit-test/tokens/myMongoDBId',
          body: {
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      testNonEmpty({
        method: 'put',
        path: '/unit-test/tokens/myMongoDBId',
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
      path: '/unit-test/tokens/myMongoDBId',
      body: {
        unexpectedField: 'unexpectedField',
      },
      query: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'put',
      path: '/unit-test/tokens/myMongoDBId',
      body: {},
      query: { unexpectedField: 'unexpectedField' },
      field: 'unexpectedField',
      location: 'query',
    });

    testNonMongodbId({
      method: 'put',
      path: '/unit-test/tokens/notAMongoDBId',
      body: {},
      query: {},
      field: 'tokenId',
    });
  });

  describe('DELETE by MongoDBId', async function () {
    testNonMongodbId({
      method: 'delete',
      path: '/unit-test/tokens/notAMongoDBId',
      body: {},
      query: {},
      field: 'tokenId',
    });
  });
});
