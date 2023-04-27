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
  pathBlockchains_Post_NewBlockchain,
  blockchain,
  usefulAddress,
  pathBlockchains_Get_MongoDBId,
  notAMongoDBId,
  pathBlockchains_Put_MongoDBId,
  randomMongoDBId,
  pathBlockchains_Delete_MongoDBId,
  pathBlockchains_Put_UsefulAddress_MongoDBId,
  pathBlockchains_Delete_UsefulAddress_MongoDBId,
} from './utils/variables.js';

chai.use(chaiHttp);

describe('Blockchains route - Validators', async function () {
  describe('POST - new blockchain', async function () {
    it('Should fail if rpc is not an array', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .post(pathBlockchains_Post_NewBlockchain)
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
        .post(pathBlockchains_Post_NewBlockchain)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .send({ ...blockchain, rpc: ['notAnURL', 123] });
      // Assertions
      chai.expect(res).to.have.status(400);
      chai.expect(res.body).to.be.an('array');
      chai.expect(res.body.some((err) => err.msg === 'must be an array of URL'))
        .to.be.true;
    });

    it('Should fail if usefulAddresses is not an object', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .post(pathBlockchains_Post_NewBlockchain)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .send({ ...blockchain, usefulAddresses: 'notAnObject' });
      // Assertions
      chai.expect(res).to.have.status(400);
      chai.expect(res.body).to.be.an('array');
      chai.expect(
        res.body.some(
          (err) =>
            err.msg === 'must be an object' && err.param === 'usefulAddresses'
        )
      ).to.be.true;
    });

    it('Should fail if usefulAddresses not an object of string', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .post(pathBlockchains_Post_NewBlockchain)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .send({
          ...blockchain,
          usefulAddresses: {
            myUsefulAddress1: 1,
            myUsefulAddress2: 'myAddress2',
          },
        });
      // Assertions
      chai.expect(res).to.have.status(400);
      chai.expect(res.body).to.be.an('array');
      chai.expect(
        res.body.some(
          (err) =>
            err.msg ===
              'usefulAddresses.myUsefulAddress1 must be a string value' &&
            err.param === 'usefulAddresses'
        )
      ).to.be.true;
    });

    for (const testCase of Object.keys(blockchain)) {
      if (testCase == 'caipId') {
        testNonCaipId({
          method: 'post',
          path: pathBlockchains_Post_NewBlockchain,
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
          path: pathBlockchains_Post_NewBlockchain,
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
          path: pathBlockchains_Post_NewBlockchain,
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      } else if (testCase !== 'rpc' && testCase !== 'usefulAddresses') {
        testNonString({
          method: 'post',
          path: pathBlockchains_Post_NewBlockchain,
          body: {
            ...blockchain,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      if (testCase !== 'usefulAddresses') {
        testNonEmpty({
          method: 'post',
          path: pathBlockchains_Post_NewBlockchain,
          body: {
            ...blockchain,
            [testCase]: '',
          },
          query: {},
          field: testCase,
        });
      }
    }

    testUnexpectedField({
      method: 'post',
      path: pathBlockchains_Post_NewBlockchain,
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
      path: pathBlockchains_Post_NewBlockchain,
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
      path: pathBlockchains_Get_MongoDBId + notAMongoDBId,
      body: {},
      query: {},
      field: 'blockchainId',
    });
  });

  describe('PUT - modify blockchain', async function () {
    it('PUT /blockchains/myMongoDBId - rpc - Should fail if rpc is not an array', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .put(pathBlockchains_Put_MongoDBId + randomMongoDBId)
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

    it('PUT /blockchains/myMongoDBId - rpc - Should fail if rpc contains non-URL values', async function () {
      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .put(pathBlockchains_Put_MongoDBId + randomMongoDBId)
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
          path: pathBlockchains_Put_MongoDBId + randomMongoDBId,
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
          path: pathBlockchains_Put_MongoDBId + randomMongoDBId,
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
          path: pathBlockchains_Put_MongoDBId + randomMongoDBId,
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
          path: pathBlockchains_Put_MongoDBId + randomMongoDBId,
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
        path: pathBlockchains_Put_MongoDBId + randomMongoDBId,
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
      path: pathBlockchains_Delete_MongoDBId + notAMongoDBId,
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
        path: pathBlockchains_Put_UsefulAddress_MongoDBId + randomMongoDBId,
        body: {
          ...usefulAddress,
          [testCase]: 123,
        },
        query: {},
        field: testCase,
      });
      testNonEmpty({
        method: 'put',
        path: pathBlockchains_Put_UsefulAddress_MongoDBId + randomMongoDBId,
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
      path: pathBlockchains_Delete_UsefulAddress_MongoDBId + randomMongoDBId,
      body: { contract: 123 },
      query: {},
      field: 'contract',
    });

    testNonEmpty({
      method: 'delete',
      path: pathBlockchains_Delete_UsefulAddress_MongoDBId + randomMongoDBId,
      body: { contract: '' },
      query: {},
      field: 'contract',
    });
  });
});
