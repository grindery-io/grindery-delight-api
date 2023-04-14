import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonCaipId,
  testNonURL,
  testNonBoolean,
} from './utils.js';
import { ObjectId } from 'mongodb';

chai.use(chaiHttp);
const expect = chai.expect;

const collection = db.collection('blockchains');
const blockchainPath = '/blockchains';
const blockchain = {
  caipId: 'eip155:5',
  chainId: '5',
  icon: 'https://www.grindery.io/hubfs/delight-assets/icons/blockchains/eip155-5.png',
  isActive: true,
  isEvm: true,
  isTestnet: true,
  label: 'Goerli Testnet',
  nativeTokenSymbol: 'ETH',
  rpc: [
    'https://goerli.blockpi.network/v1/rpc/public',
    'https://rpc.ankr.com/eth_goerli',
    'https://eth-goerli.public.blastapi.io',
  ],
  transactionExplorerUrl: 'https://goerli.etherscan.io/tx/{hash}',
  addressExplorerUrl: 'https://goerli.etherscan.io/address/{hash}',
};

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
          .delete(`/blockchains/${createResponse.body.insertedId}`)
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
          .get(`/blockchains/${createResponse.body.insertedId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        delete res.body._id;
        chai.expect(res.body).to.deep.equal(blockchain);

        const deleteResponse = await chai
          .request(app)
          .delete(`/blockchains/${createResponse.body.insertedId}`)
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
          .delete(`/blockchains/${createResponse.body.insertedId}`)
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
    });
  });
});
