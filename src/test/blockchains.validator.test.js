import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonCaipId,
  testNonURL,
  testNonBoolean,
  testNonMongodbId,
} from './utils/utils.js';
import {
  pathBlockchains,
  blockchain,
  usefulAddress,
} from './utils/variables.js';
import { Database } from '../db/conn.js';

chai.use(chaiHttp);

describe('Blockchains route - Validators', async function () {
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

  describe('POST - new blockchain', async function () {
    it('Should fail if rpc is not an array', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .post(pathBlockchains)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .send({ ...blockchain, rpc: 'notAnArray' });
      // Assertions
      chai.expect(res).to.have.status(400);
      chai.expect(res.body).to.be.an('array');
      chai.expect(
        res.body.some(
          (err) => err.msg === 'must be an array' && err.param === 'rpc'
        )
      ).to.be.true;
    });

    it('Should fail if rpc contains non-URL values', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .post(pathBlockchains)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .send({ ...blockchain, rpc: ['notAnURL', 123] });
      // Assertions
      chai.expect(res).to.have.status(400);
      chai.expect(res.body).to.be.an('array');
      chai.expect(res.body.some((err) => err.msg === 'must be an array of URL'))
        .to.be.true;
    });

    const testCases = [
      'chainId',
      'caipId',
      'label',
      'icon',
      'rpc',
      'nativeTokenSymbol',
      'transactionExplorerUrl',
      'addressExplorerUrl',
      'isEvm',
      'isTestnet',
      'isActive',
    ];

    for (const testCase of testCases) {
      if (testCase == 'caipId') {
        testNonCaipId({
          method: 'post',
          path: pathBlockchains,
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else if (
        testCase == 'transactionExplorerUrl' ||
        testCase == 'addressExplorerUrl'
      ) {
        testNonURL({
          method: 'post',
          path: pathBlockchains,
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else if (
        testCase == 'isEvm' ||
        testCase == 'isTestnet' ||
        testCase == 'isActive'
      ) {
        testNonBoolean({
          method: 'post',
          path: pathBlockchains,
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else if (testCase !== 'rpc') {
        testNonString({
          method: 'post',
          path: pathBlockchains,
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }
      testNonEmpty({
        method: 'post',
        path: pathBlockchains,
        body: {
          ...blockchain,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }

    testUnexpectedField({
      method: 'post',
      path: pathBlockchains,
      body: {
        ...blockchain,
        unexpectedField: 'unexpectedField',
      },
      query: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'post',
      path: pathBlockchains,
      body: {
        ...blockchain,
      },
      query: { unexpectedField: 'unexpectedField' },
      field: 'unexpectedField',
      location: 'query',
    });
  });

  describe('GET blockchain by MongoDBId', async function () {
    testNonMongodbId({
      method: 'get',
      path: '/unit-test/blockchains/1111111111111111',
      body: {},
      query: {},
      field: 'blockchainId',
    });
  });

  describe('PUT - modify blockchain', async function () {
    it('PUT /blockchains/11111111111111111111 - rpc - Should fail if rpc is not an array', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .put('/unit-test/blockchains/11111111111111111111')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .send({ rpc: 'notAnArray' });
      // Assertions
      chai.expect(res).to.have.status(400);
      chai.expect(res.body).to.be.an('array');
      chai.expect(
        res.body.some(
          (err) => err.msg === 'must be an array' && err.param === 'rpc'
        )
      ).to.be.true;
    });

    it('PUT /blockchains/11111111111111111111 - rpc - Should fail if rpc contains non-URL values', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .put('/unit-test/blockchains/11111111111111111111')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .send({ rpc: ['notAnURL', 123] });
      // Assertions
      chai.expect(res).to.have.status(400);
      chai.expect(res.body).to.be.an('array');
      chai.expect(res.body.some((err) => err.msg === 'must be an array of URL'))
        .to.be.true;
    });

    const testCases = [
      'chainId',
      'caipId',
      'label',
      'icon',
      'rpc',
      'nativeTokenSymbol',
      'isEvm',
      'isTestnet',
      'isActive',
      'transactionExplorerUrl',
      'addressExplorerUrl',
    ];

    for (const testCase of testCases) {
      if (testCase == 'caipId') {
        testNonCaipId({
          method: 'put',
          path: '/unit-test/blockchains/11111111111111111111',
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else if (
        testCase == 'transactionExplorerUrl' ||
        testCase == 'addressExplorerUrl'
      ) {
        testNonURL({
          method: 'put',
          path: '/unit-test/blockchains/11111111111111111111',
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else if (
        testCase == 'isEvm' ||
        testCase == 'isTestnet' ||
        testCase == 'isActive'
      ) {
        testNonBoolean({
          method: 'put',
          path: '/unit-test/blockchains/11111111111111111111',
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else if (testCase !== 'rpc') {
        testNonString({
          method: 'put',
          path: '/unit-test/blockchains/11111111111111111111',
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      testNonEmpty({
        method: 'put',
        path: '/unit-test/blockchains/11111111111111111111',
        body: {
          ...blockchain,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }
  });

  describe('DELETE blockchain', async function () {
    testNonMongodbId({
      method: 'delete',
      path: '/unit-test/blockchains/1111111111111111',
      body: {},
      query: {},
      field: 'blockchainId',
    });
  });

  describe('POST useful address', async function () {
    const testCases = ['contract', 'address'];

    for (const testCase of testCases) {
      testNonString({
        method: 'put',
        path: '/unit-test/blockchains/useful-address/111111111111111111111111',
        body: {
          ...usefulAddress,
          [testCase]: 123,
        },
        query: {},
        field: testCase,
      });
      testNonEmpty({
        method: 'put',
        path: '/unit-test/blockchains/useful-address/111111111111111111111111',
        body: {
          ...usefulAddress,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }
  });
  describe('DELETE useful address', async function () {
    testNonString({
      method: 'delete',
      path: '/unit-test/blockchains/useful-address/111111111111111111111111',
      body: { contract: 123 },
      query: {},
      field: 'contract',
    });

    testNonEmpty({
      method: 'delete',
      path: '/unit-test/blockchains/useful-address/111111111111111111111111',
      body: { contract: '' },
      query: {},
      field: 'contract',
    });
  });
});
