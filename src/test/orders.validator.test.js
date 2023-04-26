import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonMongodbId,
} from './utils/utils.js';
import { pathOrders, order } from './utils/variables.js';
import { Database } from '../db/conn.js';

chai.use(chaiHttp);

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

describe('Orders route - Validators', async function () {
  // Retry all tests in this suite up to 4 times
  this.retries(4);

  describe('POST new order', async function () {
    for (const testCase of Object.keys(order)) {
      testNonString({
        method: 'post',
        path: pathOrders,
        body: {
          ...order,
          [testCase]: 123,
        },
        query: {},
        field: testCase,
      });

      testNonEmpty({
        method: 'post',
        path: pathOrders,
        body: {
          ...order,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }

    testUnexpectedField({
      method: 'post',
      path: pathOrders,
      body: {
        ...order,
        unexpectedField: 'Unexpected field',
      },
      query: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'post',
      path: pathOrders,
      body: {
        ...order,
      },
      query: { unexpectedField: 'Unexpected field' },
      field: 'unexpectedField',
      location: 'query',
    });
  });

  describe('GET by orderId', async function () {
    testNonString({
      method: 'get',
      path: '/test/orders/orderId',
      body: {},
      query: { orderId: [123, 123] },
      field: 'orderId',
    });

    testNonEmpty({
      method: 'get',
      path: '/test/orders/orderId',
      body: {},
      query: { orderId: '' },
      field: 'orderId',
    });
  });

  describe('GET by MongoDbId', async function () {
    testNonMongodbId({
      method: 'get',
      path: '/test/orders/id',
      body: {},
      query: { id: 'nonMongodbId' },
      field: 'id',
    });
  });

  describe('PUT order as complete', async function () {
    testNonString({
      method: 'put',
      path: '/test/orders/complete',
      body: {
        orderId: 123,
      },
      query: {},
      field: 'orderId',
    });

    testNonEmpty({
      method: 'put',
      path: '/test/orders/complete',
      body: {
        orderId: '',
      },
      query: {},
      field: 'orderId',
    });

    testUnexpectedField({
      method: 'put',
      path: '/test/orders/complete',
      body: {
        orderId: '123',
        unexpectedField: 'Unexpected field',
      },
      field: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'put',
      path: '/test/orders/complete',
      body: {
        orderId: '123',
      },
      query: { unexpectedField: 'Unexpected field' },
      field: 'unexpectedField',
      location: 'query',
    });
  });
});
