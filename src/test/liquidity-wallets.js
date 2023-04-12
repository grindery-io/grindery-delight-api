import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn.js';
import jwt from 'jsonwebtoken';
import { mockedToken } from './mock.js';
import { ObjectId } from 'mongodb';

chai.use(chaiHttp);
const expect = chai.expect;

const collection = db.collection('liquidity-wallets');

const liquidityWallet = {
  walletAddress: 'myWalletAddress',
  chainId: 'myChainId',
};

describe('Liquidity wallets route', () => {
  describe('POST new liquidity wallet', () => {
    describe('Core of the route', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should create a new liquidity wallet', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);
        chai.expect(createResponse.body).to.have.property('acknowledged', true);
        chai.expect(createResponse.body).to.have.property('insertedId');

        const deleteResponse = await chai
          .request(app)
          .delete(`/liquidity-wallets`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: liquidityWallet.chainId,
            walletAddress: liquidityWallet.walletAddress,
          });
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should create a new liquidity wallet with the proper walletAddress and chainId', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);

        const wallet = await collection.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        });
        chai
          .expect(wallet)
          .to.have.property('walletAddress', liquidityWallet.walletAddress);
        chai
          .expect(wallet)
          .to.have.property('chainId', liquidityWallet.chainId);

        const deleteResponse = await chai
          .request(app)
          .delete(`/liquidity-wallets`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: liquidityWallet.chainId,
            walletAddress: liquidityWallet.walletAddress,
          });
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should create a new liquidity wallet with empty token object', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);

        const wallet = await collection.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        });

        chai.expect(wallet).to.have.property('tokens').that.is.an('object').that
          .is.empty;

        const deleteResponse = await chai
          .request(app)
          .delete(`/liquidity-wallets`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: liquidityWallet.chainId,
            walletAddress: liquidityWallet.walletAddress,
          });
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should fail if liquidity wallet already exists', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);

        const createResponse1 = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse1).to.have.status(404);
        chai
          .expect(createResponse1.body)
          .to.deep.equal({ msg: 'This wallet already exists on this chain.' });

        const deleteResponse = await chai
          .request(app)
          .delete(`/liquidity-wallets`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: liquidityWallet.chainId,
            walletAddress: liquidityWallet.walletAddress,
          });
        chai.expect(deleteResponse).to.have.status(200);
      });
    });

    describe('Validators', () => {
      it('Should fail if walletAddress is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            walletAddress: 123,
            chainId: 'myChainId',
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0]).to.have.property('param', 'walletAddress');
        chai
          .expect(res.body[0])
          .to.have.property('msg', 'must be string value');
      });

      it('Should fail if walletAddress is empty', async function () {
        const res = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            walletAddress: '',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0]).to.have.property('param', 'walletAddress');
        chai.expect(res.body[0]).to.have.property('msg', 'should not be empty');
      });

      it('Should fail if chainId is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            walletAddress: 'myWalletAddress',
            chainId: 123,
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0]).to.have.property('param', 'chainId');
        chai
          .expect(res.body[0])
          .to.have.property('msg', 'must be string value');
      });

      it('Should fail if chainId is empty', async function () {
        const res = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            walletAddress: 'myWalletAddress',
            chainId: '',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0]).to.have.property('param', 'chainId');
        chai.expect(res.body[0]).to.have.property('msg', 'should not be empty');
      });

      it('Should return an error if unexpected field in body', async function () {
        const response = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            walletAddress: 'myWalletAddress',
            chainId: 'myChainId',
            unexpectedField: 'unexpectedValue',
          });
        chai.expect(response).to.have.status(400);
        chai.expect(response.body).to.deep.equal([
          {
            value: {
              walletAddress: 'myWalletAddress',
              chainId: 'myChainId',
              unexpectedField: 'unexpectedValue',
            },
            msg: 'The following fields are not allowed in body: unexpectedField',
            param: '',
            location: 'body',
          },
        ]);
      });

      it('Should fail with unexpected field in query', async function () {
        const response = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet)
          .query({ unexpectedField: 'unexpectedValue' });
        chai.expect(response).to.have.status(400);
        chai.expect(response.body).to.deep.equal([
          {
            value: {
              unexpectedField: 'unexpectedValue',
            },
            msg: 'The following fields are not allowed in query: unexpectedField',
            param: '',
            location: 'query',
          },
        ]);
      });
    });
  });
});
