import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionLiquidityWallet,
  pathLiquidityWallets_Post_NewLiquidityWallet,
  liquidityWallet,
  pathLiquidityWallets_Delete,
  pathLiquidityWallets_Get_All,
  pathLiquidityWallets_Get_Single,
  pathLiquidityWallets_Get_MongoDBId,
  validMongoDBId,
  randomMongoDBId,
  pathLiquidityWallets_Get_LiquidityWalletByChainId,
  pathLiquidityWallets_Put,
} from './utils/variables.js';

chai.use(chaiHttp);

/**
 * This function creates a base liquidity wallet and returns the response.
 * @param liquidityWallet - It is an object that contains the data for creating a new liquidity wallet.
 * The specific properties and values of this object depend on the requirements of the application.
 * @returns The function `createBaseLiquidityWallet` is returning the response object `res` from the
 * Chai request.
 */
async function createBaseLiquidityWallet(liquidityWallet) {
  const res = await chai
    .request(app)
    .post(pathLiquidityWallets_Post_NewLiquidityWallet)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(liquidityWallet);
  chai.expect(res).to.have.status(201);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;

  return res;
}

describe('Liquidity wallets route', async function () {
  describe('POST new liquidity wallet', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathLiquidityWallets_Post_NewLiquidityWallet)
        .send(liquidityWallet);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should create a new liquidity wallet', async function () {
      await createBaseLiquidityWallet(liquidityWallet);
    });

    it('Should create a new liquidity wallet with the proper walletAddress and chainId', async function () {
      const createResponse = await createBaseLiquidityWallet(liquidityWallet);

      const wallet = await collectionLiquidityWallet.findOne({
        _id: new ObjectId(createResponse.body.insertedId),
      });
      chai
        .expect(wallet)
        .to.have.property('walletAddress', liquidityWallet.walletAddress);
      chai.expect(wallet).to.have.property('chainId', liquidityWallet.chainId);
    });

    it('Should create a new liquidity wallet with empty token object', async function () {
      const createResponse = await createBaseLiquidityWallet(liquidityWallet);

      const wallet = await collectionLiquidityWallet.findOne({
        _id: new ObjectId(createResponse.body.insertedId),
      });
      chai.expect(wallet).to.have.property('tokens').that.is.an('object').that
        .is.empty;
    });

    it('Should fail if liquidity wallet already exists', async function () {
      await createBaseLiquidityWallet(liquidityWallet);

      const createResponse1 = await chai
        .request(app)
        .post(pathLiquidityWallets_Post_NewLiquidityWallet)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(liquidityWallet);
      chai.expect(createResponse1).to.have.status(404);
      chai
        .expect(createResponse1.body)
        .to.deep.equal({ msg: 'This wallet already exists on this chain.' });
    });
  });

  describe('GET by chainId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .get(pathLiquidityWallets_Get_LiquidityWalletByChainId)
        .query({ chainId: liquidityWallet.chainId });
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should return empty array if no liquidity wallet available', async function () {
      const res = await chai
        .request(app)
        .get(pathLiquidityWallets_Get_LiquidityWalletByChainId)
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
        const createResponse = await createBaseLiquidityWallet({
          chainId: liquidityWallet.chainId,
          walletAddress: `${liquidityWallet.walletAddress}-${i}`,
        });

        wallets.push(
          await collectionLiquidityWallet.findOne({
            _id: new ObjectId(createResponse.body.insertedId),
          })
        );
        if (i === 0) {
          userId = (
            await collectionLiquidityWallet.findOne({
              _id: new ObjectId(createResponse.body.insertedId),
            })
          ).userId;
        }
      }
      const res = await chai
        .request(app)
        .get(pathLiquidityWallets_Get_LiquidityWalletByChainId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ chainId: liquidityWallet.chainId });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('array').that.is.not.empty;
      res.body.forEach((wallet) => {
        chai.expect(wallet.chainId).to.equal(liquidityWallet.chainId);
      });
    });
  });

  describe('GET all liquidity wallets', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .get(pathLiquidityWallets_Get_All);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should return an array with all the liquidity wallets', async function () {
      const createResponse = await createBaseLiquidityWallet(liquidityWallet);

      const userId = (
        await collectionLiquidityWallet.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).userId;
      const res = await chai
        .request(app)
        .get(pathLiquidityWallets_Get_All)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      const wallets = await collectionLiquidityWallet
        .find({ userId: userId })
        .toArray();
      // Check that all objects in the response body have chainId and walletAddress elements that exist in wallets
      res.body.forEach((wallet) => {
        chai.expect(wallet.chainId).to.be.oneOf(wallets.map((w) => w.chainId));
        chai
          .expect(wallet.walletAddress)
          .to.be.oneOf(wallets.map((w) => w.walletAddress));
        chai.expect(wallet.userId).to.equal(userId);
      });
    });
  });

  describe('GET single liquidity wallets', async function () {
    it('Should return a single liquidity wallet (without walletAddress in the query)', async function () {
      const createResponse = await createBaseLiquidityWallet(liquidityWallet);

      const userId = (
        await collectionLiquidityWallet.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).userId;
      const res = await chai
        .request(app)
        .get(pathLiquidityWallets_Get_Single)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ chainId: liquidityWallet.chainId, userId: userId });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body.userId).to.equal(userId);
      chai
        .expect(res.body.walletAddress)
        .to.equal(liquidityWallet.walletAddress);
      chai.expect(res.body.chainId).to.equal(liquidityWallet.chainId);
    });

    it('Should return a single liquidity wallet (with walletAddress in the query)', async function () {
      const createResponse = await createBaseLiquidityWallet(liquidityWallet);

      const userId = (
        await collectionLiquidityWallet.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).userId;
      const res = await chai
        .request(app)
        .get(pathLiquidityWallets_Get_Single)
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
    });
  });

  describe('GET liquidity wallet by MongoDbId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .get(pathLiquidityWallets_Get_MongoDBId + randomMongoDBId);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should return a single liquidity wallet', async function () {
      const createResponse = await createBaseLiquidityWallet(liquidityWallet);

      const userId = (
        await collectionLiquidityWallet.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).userId;

      const res = await chai
        .request(app)
        .get(
          pathLiquidityWallets_Get_MongoDBId + createResponse.body.insertedId
        )
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body._id).to.equal(createResponse.body.insertedId);
      chai.expect(res.body.userId).to.equal(userId);
      chai
        .expect(res.body.walletAddress)
        .to.equal(liquidityWallet.walletAddress);
      chai.expect(res.body.chainId).to.equal(liquidityWallet.chainId);
    });

    it('Should return an empty object if no wallet exists', async function () {
      const res = await chai
        .request(app)
        .get(pathLiquidityWallets_Get_MongoDBId + validMongoDBId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('DELETE liquidity wallets', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .delete(pathLiquidityWallets_Delete);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should delete one liquidity wallet', async function () {
      const createResponse = await createBaseLiquidityWallet(liquidityWallet);

      const deleteResponse = await chai
        .request(app)
        .delete(pathLiquidityWallets_Delete)
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
        await collectionLiquidityWallet.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.be.null;
    });

    it('Should return a 404 status and an error message if the wallet does not exist', async function () {
      const deleteResponse = await chai
        .request(app)
        .delete(pathLiquidityWallets_Delete)
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

  describe('PUT liquidity wallets', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .put(pathLiquidityWallets_Put);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should modify one liquidity wallet', async function () {
      await createBaseLiquidityWallet(liquidityWallet);

      const res = await chai
        .request(app)
        .put(pathLiquidityWallets_Put)
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
    });

    it('Should modify token amount of the liquidity wallet', async function () {
      const createResponse = await createBaseLiquidityWallet(liquidityWallet);
      const res = await chai
        .request(app)
        .put(pathLiquidityWallets_Put)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          ...liquidityWallet,
          tokenId: 'USDC',
          amount: '3435',
        });
      chai.expect(res).to.have.status(201);
      const wallet = await collectionLiquidityWallet.findOne({
        _id: new ObjectId(createResponse.body.insertedId),
      });
      chai.expect(wallet.tokens['USDC']).to.equal('3435');
    });

    it('Should fail if liquidity wallet doesnt exist', async function () {
      const res = await chai
        .request(app)
        .put(pathLiquidityWallets_Put)
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
  });
});
