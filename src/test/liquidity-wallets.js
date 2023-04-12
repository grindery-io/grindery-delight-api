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

    describe('Validators', () => {});
  });
});
