import chai from 'chai';
import chaiHttp from 'chai-http';
import {
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonMongodbId,
  mockedToken,
} from './utils/utils.js';
import {
  pathOrders_Post,
  order,
  pathOrders_Get_OrderId,
  pathOrders_Get_MongoDBId,
  pathOrders_Put_Complete,
} from './utils/variables.js';
import app from '../index.js';

chai.use(chaiHttp);

describe('Orders route - Validators', async function () {
  describe('POST new order', async function () {
    it('Should fail if status is not pending, success or failure', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .post(pathOrders_Post)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .send({ ...order, status: 'notAppropriate' });

      // Assertions
      chai.expect(res).to.have.status(400);
      chai.expect(res.body).to.be.an('array');
      chai.expect(
        res.body.some(
          (err) =>
            err.msg === 'must be one of "pending", "success" or "failure"' &&
            err.param === 'status'
        )
      ).to.be.true;
    });

    for (const testCase of Object.keys(order)) {
      if (testCase !== 'status') {
        testNonString({
          method: 'post',
          path: pathOrders_Post,
          body: {
            ...order,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      if (testCase !== 'orderId' && testCase !== 'status') {
        testNonEmpty({
          method: 'post',
          path: pathOrders_Post,
          body: {
            ...order,
            [testCase]: '',
          },
          query: {},
          field: testCase,
        });
      }
    }

    testUnexpectedField({
      method: 'post',
      path: pathOrders_Post,
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
      path: pathOrders_Post,
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
      path: pathOrders_Get_OrderId,
      body: {},
      query: { orderId: [123, 123] },
      field: 'orderId',
    });

    testNonEmpty({
      method: 'get',
      path: pathOrders_Get_OrderId,
      body: {},
      query: { orderId: '' },
      field: 'orderId',
    });
  });

  describe('GET by MongoDbId', async function () {
    testNonMongodbId({
      method: 'get',
      path: pathOrders_Get_MongoDBId,
      body: {},
      query: { id: 'notAMongoDBId' },
      field: 'id',
    });
  });

  describe('PUT order as complete', async function () {
    testNonString({
      method: 'put',
      path: pathOrders_Put_Complete,
      body: {
        orderId: 123,
      },
      query: {},
      field: 'orderId',
    });

    testNonEmpty({
      method: 'put',
      path: pathOrders_Put_Complete,
      body: {
        orderId: '',
      },
      query: {},
      field: 'orderId',
    });

    testUnexpectedField({
      method: 'put',
      path: pathOrders_Put_Complete,
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
      path: pathOrders_Put_Complete,
      body: {
        orderId: '123',
      },
      query: { unexpectedField: 'Unexpected field' },
      field: 'unexpectedField',
      location: 'query',
    });
  });
});
