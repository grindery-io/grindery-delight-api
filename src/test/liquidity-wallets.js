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

  describe('GET by chainId', () => {
    describe('Core of the route', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .get('/liquidity-wallets')
          .query({ chainId: liquidityWallet.chainId });
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should return empty array if no offer available', async function () {
        const res = await chai
          .request(app)
          .get('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ chainId: liquidityWallet.chainId });
        chai.expect(res).to.have.status(200);
        chai.expect(res.body).to.be.an('array').that.is.empty;
      });

      it('Should return an array of liquidity wallets with the proper chainId', async function () {
        const nbrLiquidityWallet = 1;
        let wallets = [];
        let userId = '';
        for (let i = 0; i < nbrLiquidityWallet; i++) {
          const createResponse = await chai
            .request(app)
            .post('/liquidity-wallets')
            .set('Authorization', `Bearer ${mockedToken}`)
            .send({
              chainId: liquidityWallet.chainId,
              walletAddress: `${liquidityWallet.walletAddress}-${i}`,
            });
          chai.expect(createResponse).to.have.status(201);

          wallets.push(
            await collection.findOne({
              _id: new ObjectId(createResponse.body.insertedId),
            })
          );

          if (i === 0) {
            userId = (
              await collection.findOne({
                _id: new ObjectId(createResponse.body.insertedId),
              })
            ).userId;
          }
        }

        const res = await chai
          .request(app)
          .get('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ chainId: liquidityWallet.chainId });
        chai.expect(res).to.have.status(200);
        chai.expect(res.body).to.be.an('array').that.is.not.empty;
        res.body.forEach((wallet) => {
          chai.expect(wallet.chainId).to.equal(liquidityWallet.chainId);
        });

        for (let i = 0; i < nbrLiquidityWallet; i++) {
          const deleteResponse = await chai
            .request(app)
            .delete(`/liquidity-wallets`)
            .set('Authorization', `Bearer ${mockedToken}`)
            .query({
              chainId: liquidityWallet.chainId,
              walletAddress: `${liquidityWallet.walletAddress}-${i}`,
            });
          chai.expect(deleteResponse).to.have.status(200);
        }
      });
    });

    describe('Validators', () => {
      it('Should return a 400 error if `chainId` is empty', async function () {
        const res = await chai
          .request(app)
          .get('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ chainId: '' });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0]).to.have.property('param', 'chainId');
        chai.expect(res.body[0]).to.have.property('msg', 'should not be empty');
      });
    });
  });

  describe('GET all liquidity wallets', () => {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .get('/liquidity-wallets/all');
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should return an array with all the liquidity wallets', async function () {
      const createResponse = await chai
        .request(app)
        .post('/liquidity-wallets')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(liquidityWallet);
      chai.expect(createResponse).to.have.status(201);

      const userId = (
        await collection.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).userId;

      const res = await chai
        .request(app)
        .get('/liquidity-wallets/all')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      const wallets = await collection.find({ userId: userId }).toArray();

      // Check that all objects in the response body have chainId and walletAddress elements that exist in wallets
      res.body.forEach((wallet) => {
        chai.expect(wallet.chainId).to.be.oneOf(wallets.map((w) => w.chainId));
        chai
          .expect(wallet.walletAddress)
          .to.be.oneOf(wallets.map((w) => w.walletAddress));
        chai.expect(wallet.userId).to.equal(userId);
      });

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

  describe('GET single liquidity wallets', () => {
    describe('Core of the route', () => {
      it('Should return a single liquidity wallet (without walletAddress in the query)', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);

        const userId = (
          await collection.findOne({
            _id: new ObjectId(createResponse.body.insertedId),
          })
        ).userId;

        const res = await chai
          .request(app)
          .get('/liquidity-wallets/single')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ chainId: liquidityWallet.chainId, userId: userId });
        chai.expect(res).to.have.status(200);
        chai.expect(res.body).to.be.an('object');
        chai.expect(res.body.userId).to.equal(userId);
        chai
          .expect(res.body.walletAddress)
          .to.equal(liquidityWallet.walletAddress);
        chai.expect(res.body.chainId).to.equal(liquidityWallet.chainId);

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

      it('Should return a single liquidity wallet (with walletAddress in the query)', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);

        const userId = (
          await collection.findOne({
            _id: new ObjectId(createResponse.body.insertedId),
          })
        ).userId;

        const res = await chai
          .request(app)
          .get('/liquidity-wallets/single')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: liquidityWallet.chainId,
            userId: userId,
            walletAddress: liquidityWallet.walletAddress,
          });
        chai.expect(res).to.have.status(200);
        chai.expect(res.body).to.be.an('object');
        chai.expect(res.body.userId).to.equal(userId);
        chai
          .expect(res.body.walletAddress)
          .to.equal(liquidityWallet.walletAddress);
        chai.expect(res.body.chainId).to.equal(liquidityWallet.chainId);

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
      it('Should return a 400 status and an error message when walletAddress is an empty string', async function () {
        const res = await chai
          .request(app)
          .get('/liquidity-wallets/single')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: liquidityWallet.chainId,
            userId: 'myUserId',
            walletAddress: '',
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body[0].msg).to.equal('should not be empty');
      });

      it('Should return a 400 status and an error message when chainId is an empty string', async function () {
        const res = await chai
          .request(app)
          .get('/liquidity-wallets/single')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: '',
            userId: 'myUserId',
            walletAddress: liquidityWallet.walletAddress,
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body[0].msg).to.equal('should not be empty');
      });

      it('Should return a 400 status and an error message when userId is an empty string', async function () {
        const res = await chai
          .request(app)
          .get('/liquidity-wallets/single')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: liquidityWallet.chainId,
            userId: '',
            walletAddress: liquidityWallet.walletAddress,
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body[0].msg).to.equal('should not be empty');
      });
    });
  });

  describe('GET liquidity wallet by MongoDbId', () => {
    describe('Core of the route', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .get('/liquidity-wallets/id/myId');
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should return a single liquidity wallet', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);

        const userId = (
          await collection.findOne({
            _id: new ObjectId(createResponse.body.insertedId),
          })
        ).userId;

        const MongoDBId = createResponse.body.insertedId;

        const res = await chai
          .request(app)
          .get(`/liquidity-wallets/id/${MongoDBId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        chai.expect(res).to.have.status(200);
        chai.expect(res.body).to.be.an('object');
        chai.expect(res.body._id).to.equal(MongoDBId);
        chai.expect(res.body.userId).to.equal(userId);
        chai
          .expect(res.body.walletAddress)
          .to.equal(liquidityWallet.walletAddress);
        chai.expect(res.body.chainId).to.equal(liquidityWallet.chainId);

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

      it('Should return an empty object if no wallet exists', async function () {
        const res = await chai
          .request(app)
          .get('/liquidity-wallets/id/111111111111111111111111')
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        chai.expect(res.body).to.be.an('object').that.is.empty;
      });
    });

    describe('Validator', () => {
      it('Should return a 400 status and an error message if id is not a MongoDbId', async function () {
        const res = await chai
          .request(app)
          .get('/liquidity-wallets/id/notAValidMongoDbId')
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body[0].msg).to.equal('must be mongodb id');
      });
    });
  });

  describe('DELETE liquidity wallets', () => {
    describe('Core of the route', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .delete('/liquidity-wallets');
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should delete one liquidity wallet', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);

        const deleteResponse = await chai
          .request(app)
          .delete(`/liquidity-wallets`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: liquidityWallet.chainId,
            walletAddress: liquidityWallet.walletAddress,
          });
        chai.expect(deleteResponse).to.have.status(200);
        chai.expect(deleteResponse.body).to.be.an('object').that.deep.equals({
          acknowledged: true,
          deletedCount: 1,
        });

        chai.expect(
          await collection.findOne({
            _id: new ObjectId(createResponse.body.insertedId),
          })
        ).to.be.null;
      });

      it('Should return a 404 status and an error message if the wallet does not exist', async function () {
        const deleteResponse = await chai
          .request(app)
          .delete(`/liquidity-wallets`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            chainId: liquidityWallet.chainId,
            walletAddress: '0xnonexistentwalletaddress',
          });
        chai.expect(deleteResponse).to.have.status(404);
        chai.expect(deleteResponse.body).to.be.an('object');
        chai
          .expect(deleteResponse.body.msg)
          .to.equal('No liquidity wallet found');
      });
    });
  });

  describe('PUT liquidity wallets', () => {
    describe('Core of the route', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .put('/liquidity-wallets');
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should modify one liquidity wallet', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);

        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            tokenId: 'USDC',
            amount: '3435',
          });
        chai.expect(res).to.have.status(201);
        chai.expect(res.body).to.deep.equal({
          acknowledged: true,
          modifiedCount: 1,
          upsertedId: null,
          upsertedCount: 0,
          matchedCount: 1,
        });

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

      it('Should modify token amount of the liquidity wallet', async function () {
        const createResponse = await chai
          .request(app)
          .post('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(liquidityWallet);
        chai.expect(createResponse).to.have.status(201);

        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            tokenId: 'USDC',
            amount: '3435',
          });
        chai.expect(res).to.have.status(201);
        const wallet = await collection.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        });
        chai.expect(wallet.tokens['USDC']).to.equal('3435');

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

      it('Should fail if liquidity wallet doesnt exist', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            walletAddress: 'unexpectedWalletAddress',
            tokenId: 'USDC',
            amount: '3435',
          });

        chai.expect(res).to.have.status(404);
        chai
          .expect(res.body)
          .to.deep.equal({ msg: 'This liquidity wallet does not exist.' });
      });

      it('Should fail if walletAddress is not a string', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            walletAddress: 123,
            tokenId: 'USDC',
            amount: '3435',
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array').that.deep.includes({
          value: 123,
          msg: 'must be string value',
          param: 'walletAddress',
          location: 'body',
        });
      });

      it('Should fail if walletAddress is an empty string', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            walletAddress: '',
            tokenId: 'USDC',
            amount: '3435',
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array').that.deep.includes({
          value: '',
          msg: 'should not be empty',
          param: 'walletAddress',
          location: 'body',
        });
      });

      it('Should return a validation error if chainId is not a string', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            chainId: 123,
            tokenId: 'USDC',
            amount: '3435',
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array').that.deep.includes({
          value: 123,
          msg: 'must be string value',
          param: 'chainId',
          location: 'body',
        });
      });

      it('Should return a validation error if chainId is an empty string', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            chainId: '',
            tokenId: 'USDC',
            amount: '3435',
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array').that.deep.includes({
          value: '',
          msg: 'should not be empty',
          param: 'chainId',
          location: 'body',
        });
      });

      it('Should fail if tokenId is not a string', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            walletAddress: 'unexpectedWalletAddress',
            chainId: '1',
            tokenId: 123,
            amount: '3435',
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array').that.is.not.empty;
        chai
          .expect(res.body[0])
          .to.have.property('msg', 'must be string value');
        chai.expect(res.body[0]).to.have.property('param', 'tokenId');
        chai.expect(res.body[0]).to.have.property('location', 'body');
      });

      it('Should fail if tokenId is empty', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            walletAddress: 'unexpectedWalletAddress',
            chainId: '1',
            tokenId: '',
            amount: '3435',
          });

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array').that.is.not.empty;
        chai.expect(res.body[0]).to.have.property('msg', 'should not be empty');
        chai.expect(res.body[0]).to.have.property('param', 'tokenId');
        chai.expect(res.body[0]).to.have.property('location', 'body');
      });

      it('Should return an error if amount is not a string', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            walletAddress: 'randomWalletAddress',
            chainId: '1',
            tokenId: 'USDC',
            amount: 123,
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.deep.equal([
          {
            value: 123,
            msg: 'must be string value',
            param: 'amount',
            location: 'body',
          },
        ]);
      });

      it('Should return an error if amount is an empty string', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            walletAddress: 'randomWalletAddress',
            chainId: '1',
            tokenId: 'USDC',
            amount: '',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.deep.equal([
          {
            value: '',
            msg: 'should not be empty',
            param: 'amount',
            location: 'body',
          },
        ]);
      });

      it('Should fail if body contains unexpected field', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            ...liquidityWallet,
            walletAddress: 'unexpectedWalletAddress',
            tokenId: 'USDC',
            amount: '3435',
            unexpectedField: 'someValue',
          });

        expect(res).to.have.status(400);
        expect(res.body).to.be.an('array');
        expect(res.body[0].msg).to.equal(
          'The following fields are not allowed in body: unexpectedField'
        );
      });

      it('Should fail if unexpected field in query', async function () {
        const res = await chai
          .request(app)
          .put('/liquidity-wallets')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            unexpectedField: 'someValue',
          })
          .send({
            ...liquidityWallet,
            walletAddress: 'myWalletAddress',
            chainId: 'myChainId',
            tokenId: 'USDC',
            amount: '3435',
          });

        expect(res).to.have.status(400);
        expect(res.body).to.be.an('array');
        expect(res.body[0].msg).to.equal(
          'The following fields are not allowed in query: unexpectedField'
        );
      });
    });
  });
});
