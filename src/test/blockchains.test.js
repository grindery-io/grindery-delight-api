import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn-test.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonCaipId,
  testNonURL,
  testNonBoolean,
  testNonMongodbId,
} from './utils.js';
import { ObjectId } from 'mongodb';

chai.use(chaiHttp);
const expect = chai.expect;

const collection = db.collection('blockchains');
const blockchainPath = '/test/blockchains';
const blockchain = {
  caipId: 'eip155:534',
  chainId: '534',
  icon: 'https://www.grindery.io/hubfs/delight-assets/icons/blockchains/eip155-534.png',
  isActive: true,
  isEvm: true,
  isTestnet: true,
  label: 'myTestnet',
  nativeTokenSymbol: 'myTokenSymbol',
  rpc: [
    'https://goerli.blockpi.network/v1/rpc/public',
    'https://rpc.ankr.com/eth_goerli',
    'https://eth-goerli.public.blastapi.io',
  ],
  transactionExplorerUrl: 'https://goerli.etherscan.io/tx/{hash}',
  addressExplorerUrl: 'https://goerli.etherscan.io/address/{hash}',
  usefulAddresses: [
    {
      contract: 'myContract1',
      address: 'myAddress1',
    },
    {
      contract: 'myContract2',
      address: 'myAddress2',
    },
  ],
};

function modifyBlockchainField({ field, value }) {
  it(`PUT /blockchains/blockchainId - ${field} - Should modify ${field}`, async function () {
    const customBlockchain = {
      ...blockchain,
      isActive: false,
      isEvm: false,
      isTestnet: false,
    };
    const createResponse = await chai
      .request(app)
      .post(blockchainPath)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send(customBlockchain);
    chai.expect(createResponse).to.have.status(200);
    chai.expect(createResponse.body).to.have.property('acknowledged', true);
    chai.expect(createResponse.body).to.have.property('insertedId');

    const res = await chai
      .request(app)
      .put(`/test/blockchains/${createResponse.body.insertedId}`)
      .set('Authorization', `Bearer ${mockedToken}`)
      .send({ [field]: value });
    chai.expect(res).to.have.status(200);
    chai.expect(res.body).to.deep.equal({
      acknowledged: true,
      modifiedCount: 1,
      upsertedId: null,
      upsertedCount: 0,
      matchedCount: 1,
    });
    const blockchainDB = await collection.findOne({
      _id: new ObjectId(createResponse.body.insertedId),
    });
    delete blockchainDB._id;
    chai
      .expect(blockchainDB)
      .to.deep.equal({ ...customBlockchain, [field]: value });

    const deleteResponse = await chai
      .request(app)
      .delete(`/test/blockchains/${createResponse.body.insertedId}`)
      .set('Authorization', `Bearer ${mockedToken}`);
    chai.expect(deleteResponse).to.have.status(200);
  });
}

describe('Blockchains route', async function () {
  describe('POST new blockchain', () => {
    describe('Core of the route', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post(blockchainPath)
          .send(blockchain);
        chai.expect(createResponse).to.have.status(403);
      });
      it('Should create a new blockchain', async function () {
        const createResponse = await chai
          .request(app)
          .post(blockchainPath)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(blockchain);
        chai.expect(createResponse).to.have.status(200);
        chai.expect(createResponse.body).to.have.property('acknowledged', true);
        chai.expect(createResponse.body).to.have.property('insertedId');
        const deleteResponse = await chai
          .request(app)
          .delete(`/test/blockchains/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });
      it('Should create a new blockchain with the proper fields', async function () {
        const createResponse = await chai
          .request(app)
          .post(blockchainPath)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(blockchain);
        chai.expect(createResponse).to.have.status(200);
        chai.expect(createResponse.body).to.have.property('acknowledged', true);
        chai.expect(createResponse.body).to.have.property('insertedId');
        const res = await chai
          .request(app)
          .get(`/test/blockchains/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        delete res.body._id;
        chai.expect(res.body).to.deep.equal(blockchain);
        const deleteResponse = await chai
          .request(app)
          .delete(`/test/blockchains/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });
      it('Should create a new blockchain with the proper fields', async function () {
        const createResponse = await chai
          .request(app)
          .post(blockchainPath)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(blockchain);
        chai.expect(createResponse).to.have.status(200);
        chai.expect(createResponse.body).to.have.property('acknowledged', true);
        chai.expect(createResponse.body).to.have.property('insertedId');
        const createResponse1 = await chai
          .request(app)
          .post(blockchainPath)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(blockchain);
        chai.expect(createResponse1).to.have.status(404);
        chai
          .expect(createResponse1.body)
          .to.deep.equal({ msg: 'This blockchain already exists.' });
        const deleteResponse = await chai
          .request(app)
          .delete(`/test/blockchains/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });
    });
    describe('Validators', () => {
      it('Should fail if rpc is not an array', async function () {
        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post(blockchainPath)
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
          .post(blockchainPath)
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
            path: blockchainPath,
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
            path: blockchainPath,
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
            path: blockchainPath,
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
            path: blockchainPath,
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
          path: blockchainPath,
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
        path: blockchainPath,
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
        path: blockchainPath,
        body: {
          ...blockchain,
        },
        query: { unexpectedField: 'unexpectedField' },
        field: 'unexpectedField',
        location: 'query',
      });
    });
  });
  describe('GET active blockchains', () => {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get('/test/blockchains/active');
      chai.expect(res).to.have.status(403);
    });
    it('Should return all active blockchains', async function () {
      const createResponse = await chai
        .request(app)
        .post(blockchainPath)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(blockchain);
      chai.expect(createResponse).to.have.status(200);
      const createResponse1 = await chai
        .request(app)
        .post(blockchainPath)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ ...blockchain, caipId: 'eip155:45', isActive: false });
      chai.expect(createResponse1).to.have.status(200);
      const res = await chai
        .request(app)
        .get('/test/blockchains/active')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('array');
      const expectedArray = await collection
        .find({
          isActive: true,
        })
        .toArray();
      expectedArray.forEach((obj) => {
        obj._id = obj._id.toString();
      });
      chai.expect(res.body).to.deep.equal(expectedArray);
      chai.expect(res.body.every((obj) => obj.isActive === true)).to.be.true;
      const deleteResponse = await chai
        .request(app)
        .delete(`/test/blockchains/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      const deleteResponse1 = await chai
        .request(app)
        .delete(`/test/blockchains/${createResponse1.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse1).to.have.status(200);
    });
  });
  describe('GET blockchain by MongoDBId', () => {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get('/test/blockchains/1234');
      chai.expect(res).to.have.status(403);
    });
    it('Should return blockchain with the proper blockchainId', async function () {
      const createResponse = await chai
        .request(app)
        .post(blockchainPath)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(blockchain);
      chai.expect(createResponse).to.have.status(200);
      const res = await chai
        .request(app)
        .get(`/test/blockchains/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai
        .expect(res.body._id.toString())
        .to.be.equal(createResponse.body.insertedId);
      const deleteResponse = await chai
        .request(app)
        .delete(`/test/blockchains/${createResponse.body.insertedId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
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
  describe('PUT blockchain', () => {
    describe('Core of the route', () => {
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
      modifyBlockchainField({
        field: 'usefulAddresses',
        value: [
          {
            contract: 'myContract1',
            address: 'myAddress1',
          },
          {
            contract: 'myContract2',
            address: 'myAddress2',
          },
        ],
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
    describe('Validators', () => {
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
  describe('DELETE blockchain', () => {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .delete('/test/blockchains/11111111111111111111');
      chai.expect(res).to.have.status(403);
    });
    it('Should delete one blockchain', async function () {
      const createResponse = await chai
        .request(app)
        .post(blockchainPath)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(blockchain);
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
        await collection.findOne({
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
});
