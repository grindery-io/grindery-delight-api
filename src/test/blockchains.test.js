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
  deleteElementsAfterTest,
} from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionBlockchains,
  pathBlockchains,
  blockchain,
  usefulAddress,
  toDeleteDb,
} from './utils/variables.js';

chai.use(chaiHttp);

/**
 * This function modifies a specific field in a blockchain object and tests that the modification was
 * successful.
 */
function modifyBlockchainField({ field, value }) {
  it(`PUT /blockchains/blockchainId - ${field} - Should modify ${field}`, async function () {
    // Create a custom blockchain object with modified field values
    const customBlockchain = {
      ...blockchain,
      isActive: false,
      isEvm: false,
      isTestnet: false,
    };

    // Create a new blockchain entry in the database with the customBlockchain object
    const createResponse = await createBaseBlockchain(customBlockchain);

    // Send a PUT request to update the blockchain with the specified field and value
    const res = await chai
      .request(app)
      .put(`/test/blockchains/${createResponse.body.insertedId}`)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send({ [field]: value });

    // Assertions to check the response status and body
    chai.expect(res).to.have.status(200);
    chai.expect(res.body).to.deep.equal({
      acknowledged: true,
      modifiedCount: 1,
      upsertedId: null,
      upsertedCount: 0,
      matchedCount: 1,
    });

    // Fetch the updated blockchain from the database
    const blockchainDB = await collectionBlockchains.findOne({
      _id: new ObjectId(createResponse.body.insertedId),
    });

    // Delete the _id field from the fetched blockchain object for comparison
    delete blockchainDB._id;

    // Assertions to check if the fetched blockchain matches the expected result
    chai
      .expect(blockchainDB)
      .to.deep.equal({ ...customBlockchain, [field]: value });
  });
}

/**
 * This function creates a new blockchain in a database using a POST request and expects a successful
 * response.
 * @param blockchain - The parameter `blockchain` is an object that represents the data of a blockchain
 * that will be created. It is being passed as an argument to the `createBaseBlockchain` function.
 */
async function createBaseBlockchain(blockchain) {
  const res = await chai
    .request(app)
    .post(pathBlockchains)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(blockchain);
  toDeleteDb.push({
    collection: collectionBlockchains,
    id: res.body.insertedId,
  });
  chai.expect(res).to.have.status(200);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

afterEach(async function () {
  await deleteElementsAfterTest(toDeleteDb);
  toDeleteDb.length = 0;
});

describe('Blockchains route', async function () {
  // Retry all tests in this suite up to 4 times
  this.retries(4);

  describe('POST new blockchain', async function () {
    describe('Core of the route', async function () {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post(pathBlockchains)
          .send(blockchain);
        chai.expect(createResponse).to.have.status(403);
      });
      it('Should create a new blockchain', async function () {
        await createBaseBlockchain(blockchain);
      });
      it('Should create a new blockchain with the proper fields', async function () {
        const createResponse = await createBaseBlockchain(blockchain);
        const res = await chai
          .request(app)
          .get(`/test/blockchains/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        delete res.body._id;
        chai.expect(res.body).to.deep.equal(blockchain);
      });
      it('Should create a new blockchain with the proper fields', async function () {
        await createBaseBlockchain(blockchain);
        const createResponse1 = await chai
          .request(app)
          .post(pathBlockchains)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(blockchain);
        chai.expect(createResponse1).to.have.status(404);
        chai
          .expect(createResponse1.body)
          .to.deep.equal({ msg: 'This blockchain already exists.' });
      });
    });
    describe('Validators', async function () {
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
        chai.expect(
          res.body.some((err) => err.msg === 'must be an array of URL')
        ).to.be.true;
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
  });
  describe('GET active blockchains', async function () {
    it('Should return all active blockchains', async function () {
      await createBaseBlockchain(blockchain);
      await createBaseBlockchain({
        ...blockchain,
        caipId: 'eip155:45',
        isActive: false,
      });
      const res = await chai
        .request(app)
        .get('/test/blockchains/active')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('array');
      const expectedArray = await collectionBlockchains
        .find({
          isActive: true,
        })
        .toArray();
      expectedArray.forEach((obj) => {
        obj._id = obj._id.toString();
      });
      chai.expect(res.body).to.deep.equal(expectedArray);
      chai.expect(res.body.every((obj) => obj.isActive === true)).to.be.true;
    });
  });
  describe('GET blockchain by MongoDBId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get('/test/blockchains/1234');
      chai.expect(res).to.have.status(403);
    });
    it('Should return blockchain with the proper blockchainId', async function () {
      const createResponse = await createBaseBlockchain(blockchain);
      const res = await chai
        .request(app)
        .get(`/test/blockchains/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai
        .expect(res.body._id.toString())
        .to.be.equal(createResponse.body.insertedId);
    });
    it('Should return null if no blockchain found', async function () {
      const res = await chai
        .request(app)
        .get('/test/blockchains/111111111111111111111111')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
    testNonMongodbId({
      method: 'get',
      path: '/test/blockchains/1111111111111111',
      body: {},
      query: {},
      field: 'blockchainId',
    });
  });
  describe('PUT blockchain', async function () {
    describe('Core of the route', async function () {
      it('Should return 403 if no token is provided', async function () {
        const res = await chai.request(app).put('/test/blockchains/1234');
        chai.expect(res).to.have.status(403);
      });
      modifyBlockchainField({ field: 'chainId', value: 'modifiedChainId' });
      modifyBlockchainField({ field: 'caipId', value: 'eip155:343' });
      modifyBlockchainField({ field: 'label', value: 'newLabel' });
      modifyBlockchainField({ field: 'icon', value: 'newIcon' });
      modifyBlockchainField({
        field: 'rpc',
        value: [
          'https://new.goerli.blockpi.network/v1/rpc/public',
          'https://new.rpc.ankr.com/eth_goerli',
          'https://new.eth-goerli.public.blastapi.io',
        ],
      });
      modifyBlockchainField({
        field: 'nativeTokenSymbol',
        value: 'newNativeTokenSymbol',
      });
      modifyBlockchainField({ field: 'isEvm', value: true });
      modifyBlockchainField({
        field: 'isTestnet',
        value: true,
      });
      modifyBlockchainField({ field: 'isActive', value: true });
      modifyBlockchainField({
        field: 'transactionExplorerUrl',
        value: 'https://new.goerli.etherscan.io/tx/{hash}',
      });
      modifyBlockchainField({
        field: 'addressExplorerUrl',
        value: 'https://new.goerli.etherscan.io/address/{hash}',
      });
      it('Should fail if no blockchain found', async function () {
        const res = await chai
          .request(app)
          .put('/test/blockchains/111111111111111111111111')
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(404);
        chai.expect(res.body).to.deep.equal({ msg: 'No blockchain found' });
      });
    });
    describe('Validators', async function () {
      it('PUT /blockchains/11111111111111111111 - rpc - Should fail if rpc is not an array', async function () {
        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .put('/test/blockchains/11111111111111111111')
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
          .put('/test/blockchains/11111111111111111111')
          .set({ Authorization: `Bearer ${mockedToken}` })
          .send({ rpc: ['notAnURL', 123] });
        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(
          res.body.some((err) => err.msg === 'must be an array of URL')
        ).to.be.true;
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
            path: '/test/blockchains/11111111111111111111',
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
            path: '/test/blockchains/11111111111111111111',
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
            path: '/test/blockchains/11111111111111111111',
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
            path: '/test/blockchains/11111111111111111111',
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
          path: '/test/blockchains/11111111111111111111',
          body: {
            ...blockchain,
            [testCase]: '',
          },
          query: {},
          field: testCase,
        });
      }
    });
  });
  describe('DELETE blockchain', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .delete('/test/blockchains/11111111111111111111');
      chai.expect(res).to.have.status(403);
    });
    it('Should delete one blockchain', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathBlockchains)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(blockchain);
      toDeleteDb.push({
        collection: collectionBlockchains,
        id: createResponse.body.insertedId,
      });
      chai.expect(createResponse).to.have.status(200);
      chai.expect(createResponse.body).to.have.property('acknowledged', true);
      chai.expect(createResponse.body).to.have.property('insertedId');
      const deleteResponse = await chai
        .request(app)
        .delete(`/test/blockchains/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai
        .expect(deleteResponse.body)
        .to.deep.equal({ acknowledged: true, deletedCount: 1 });
      chai.expect(
        await collectionBlockchains.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.be.null;
    });
    testNonMongodbId({
      method: 'delete',
      path: '/test/blockchains/1111111111111111',
      body: {},
      query: {},
      field: 'blockchainId',
    });
  });
  describe('POST useful address', async function () {
    describe('Core of the route', async function () {
      it('Should return 403 if no token is not provided', async function () {
        const res = await chai
          .request(app)
          .put('/test/blockchains/useful-address/1234');
        chai.expect(res).to.have.status(403);
      });
      it('Should return 404 if blockchain is not found', async function () {
        const response = await chai
          .request(app)
          .put(`/test/blockchains/useful-address/111111111111111111111111`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(usefulAddress);
        chai.expect(response).to.have.status(404);
        chai.expect(response.body).to.deep.equal({
          msg: 'No blockchain found',
        });
      });
      it('Should create a new useful address with the proper fields', async function () {
        const createResponse = await createBaseBlockchain(blockchain);
        const newUsefulAddress = await chai
          .request(app)
          .put(
            `/test/blockchains/useful-address/${createResponse.body.insertedId}`
          )
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(usefulAddress);
        chai.expect(newUsefulAddress).to.have.status(200);
        chai.expect(newUsefulAddress.body).to.deep.equal({
          acknowledged: true,
          modifiedCount: 1,
          upsertedId: null,
          upsertedCount: 0,
          matchedCount: 1,
        });
        const res = await chai
          .request(app)
          .get(`/test/blockchains/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        delete res.body._id;
        chai.expect(res.body.usefulAddresses).to.deep.equal({
          ...blockchain.usefulAddresses,
          [usefulAddress.contract]: usefulAddress.address,
        });
      });
      it('Should update a useful address with the proper fields', async function () {
        const createResponse = await createBaseBlockchain(blockchain);
        const updateUsefulAddress = await chai
          .request(app)
          .put(
            `/test/blockchains/useful-address/${createResponse.body.insertedId}`
          )
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            contract: blockchain.usefulAddresses.myUsefulAddress1,
            address: 'modifiedAddress',
          });
        chai.expect(updateUsefulAddress).to.have.status(200);
        chai.expect(updateUsefulAddress.body).to.deep.equal({
          acknowledged: true,
          modifiedCount: 1,
          upsertedId: null,
          upsertedCount: 0,
          matchedCount: 1,
        });
        const res = await chai
          .request(app)
          .get(`/test/blockchains/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        delete res.body._id;
        chai.expect(res.body.usefulAddresses).to.deep.equal({
          ...blockchain.usefulAddresses,
          [blockchain.usefulAddresses.myUsefulAddress1]: 'modifiedAddress',
        });
      });
    });
    describe('Validators', async function () {
      const testCases = ['contract', 'address'];
      for (const testCase of testCases) {
        testNonString({
          method: 'put',
          path: '/test/blockchains/useful-address/111111111111111111111111',
          body: {
            ...usefulAddress,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
        testNonEmpty({
          method: 'put',
          path: '/test/blockchains/useful-address/111111111111111111111111',
          body: {
            ...usefulAddress,
            [testCase]: '',
          },
          query: {},
          field: testCase,
        });
      }
    });
  });
  describe('DELETE useful address', async function () {
    describe('Core of the route', async function () {
      it('Should return 403 if no token is not provided', async function () {
        const res = await chai
          .request(app)
          .delete('/test/blockchains/useful-address/1234');
        chai.expect(res).to.have.status(403);
      });

      it('Should return 404 if useful address is not found', async function () {
        const createResponse = await createBaseBlockchain(blockchain);

        const deleteResponse = await chai
          .request(app)
          .delete(
            `/test/blockchains/useful-address/${createResponse.body.insertedId}`
          )
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ contract: usefulAddress.contract });
        chai.expect(deleteResponse).to.have.status(404);
        chai.expect(deleteResponse.body).to.deep.equal({
          msg: 'No blockchain found or contract doesnt exist',
        });
      });

      it('Should return 404 if blockchain is not found', async function () {
        const deleteResponse = await chai
          .request(app)
          .delete('/test/blockchains/useful-address/111111111111111111111111')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ contract: blockchain.usefulAddresses.myUsefulAddress1 });
        chai.expect(deleteResponse).to.have.status(404);
        chai.expect(deleteResponse.body).to.deep.equal({
          msg: 'No blockchain found or contract doesnt exist',
        });
      });

      it('Should delete useful address', async function () {
        const createResponse = await createBaseBlockchain(blockchain);

        const deleteResponse = await chai
          .request(app)
          .delete(
            `/test/blockchains/useful-address/${createResponse.body.insertedId}`
          )
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ contract: Object.keys(blockchain.usefulAddresses)[0] });
        chai.expect(deleteResponse).to.have.status(200);
      });
    });

    describe('Validators', async function () {
      testNonString({
        method: 'delete',
        path: '/test/blockchains/useful-address/111111111111111111111111',
        body: { contract: 123 },
        query: {},
        field: 'contract',
      });

      testNonEmpty({
        method: 'delete',
        path: '/test/blockchains/useful-address/111111111111111111111111',
        body: { contract: '' },
        query: {},
        field: 'contract',
      });
    });
  });
});
