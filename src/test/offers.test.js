import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionOffers,
  pathOffers_Post,
  offer,
  modifiedOffer,
  pathOffers_Get_OfferId,
  pathOffers_Get_Search,
  pathOffers_Get_User,
  pathOffers_Get_MongoDBId,
  pathOffers_Delete_MongoDBId,
  pathOffers_Put,
  pathOffers_Get_All,
  collectionLiquidityWallet,
} from './utils/variables.js';

chai.use(chaiHttp);

/**
 * This function creates a base offer by sending a POST request to a specified path with authorization
 * and expects a 200 status code and certain properties in the response.
 * @param offer - The `offer` parameter is an object that contains the data for creating a new offer.
 * It is being sent as the request body in the POST request to the `pathOffers_Post` endpoint.
 */
async function createBaseOffer(offer) {
  const res = await chai
    .request(app)
    .post(pathOffers_Post)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(offer);
  chai.expect(res).to.have.status(200);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

describe('Offers route', async function () {
  describe('POST new offer', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOffers_Post)
        .send(offer);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should POST a new offer if all fields are completed and no existing offer', async function () {
      await createBaseOffer(offer);
    });

    it('Should POST multiple new offers with empty offerId', async function () {
      await createBaseOffer({ ...offer, offerId: '' });
      await createBaseOffer({ ...offer, offerId: '' });
    });

    it('Should POST a new offer if all fields are completed and no existing offer (with correct fields)', async function () {
      await createBaseOffer(offer);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .query({ offerId: offer.offerId })
        .set('Authorization', `Bearer ${mockedToken}`);

      // Assertions
      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.be.an('object');

      delete getOffer.body._id;
      delete getOffer.body.userId;
      delete getOffer.body.date;

      chai
        .expect(getOffer.body)
        .to.deep.equal({ ...offer, status: 'pending', liquidityWallet: null });
    });

    it('Should fail if same offerId exists', async function () {
      await createBaseOffer(offer);

      const createDuplicateResponse = await chai
        .request(app)
        .post(pathOffers_Post)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      chai.expect(createDuplicateResponse).to.have.status(404);
      chai
        .expect(createDuplicateResponse.body.msg)
        .to.be.equal('This offer already exists.');
    });
  });

  describe('GET all offers', async function () {
    beforeEach(async function () {
      await collectionOffers.insertOne({
        ...offer,
        date: new Date(),
        userId: process.env.USER_ID_TEST,
        status: 'success',
        amount: '8',
      });

      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });
    });

    it('Should not fail if no token is provided', async function () {
      const res = await chai.request(app).get(pathOffers_Get_All);
      chai.expect(res).to.have.status(200);
    });

    it('Should return an array with the correct MongoDB elements', async function () {
      const offerTmp = await collectionOffers.findOne({});
      const liquidityWalletTmp = await collectionLiquidityWallet.findOne({});

      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        offers: [
          {
            ...offerTmp,
            _id: offerTmp._id.toString(),
            date: offerTmp.date.toISOString(),
            liquidityWallet: {
              ...liquidityWalletTmp,
              _id: liquidityWalletTmp._id.toString(),
            },
          },
        ],
        totalCount: 1,
      });
    });
  });

  describe('GET all active offers with filters', async function () {
    beforeEach(async function () {
      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });
    });

    it('Should not fail if no token is provided', async function () {
      const query = {
        exchangeChainId: 'myExchangeChainId',
        exchangeToken: 'myExchangeToken',
        chainId: 'myChainId',
        token: 'myToken',
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .query(query);
      chai.expect(res).to.have.status(200);
    });

    it('Should return an array of active offers', async function () {
      await collectionOffers.insertOne({
        ...offer,
        date: new Date(),
        userId: process.env.USER_ID_TEST,
        status: 'success',
        amount: '8',
        isActive: true,
        exchangeRate: '2',
      });

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: offer.exchangeChainId,
          exchangeToken: offer.exchangeToken,
          chainId: offer.chainId,
          token: offer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(Array.isArray(res.body.offers)).to.be.true;
      chai.expect(res.body.offers).to.not.be.empty;

      for (const offer of res.body.offers) {
        chai.expect(offer.isActive).to.be.true;
      }
    });

    it('Should return only offers with proper exchangeChainId', async function () {
      await collectionOffers.insertOne({
        ...offer,
        date: new Date(),
        userId: process.env.USER_ID_TEST,
        status: 'success',
        amount: '8',
        isActive: true,
        exchangeRate: '2',
      });

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: offer.exchangeChainId,
          exchangeToken: offer.exchangeToken,
          chainId: offer.chainId,
          token: offer.token,
          depositAmount: '1',
        });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const offer of res.body.offers) {
        chai.expect(offer.exchangeChainId).to.equal(offer.exchangeChainId);
      }
    });

    it('Should return only offers with proper exchangeToken', async function () {
      await collectionOffers.insertOne({
        ...offer,
        date: new Date(),
        userId: process.env.USER_ID_TEST,
        status: 'success',
        amount: '8',
        isActive: true,
        exchangeRate: '2',
      });

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: offer.exchangeChainId,
          exchangeToken: offer.exchangeToken,
          chainId: offer.chainId,
          token: offer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const offer of res.body.offers) {
        chai.expect(offer.exchangeToken).to.equal(offer.exchangeToken);
      }
    });

    it('Should return only offers with proper chainId', async function () {
      await collectionOffers.insertOne({
        ...offer,
        date: new Date(),
        userId: process.env.USER_ID_TEST,
        status: 'success',
        amount: '8',
        isActive: true,
        exchangeRate: '2',
      });

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: offer.exchangeChainId,
          exchangeToken: offer.exchangeToken,
          chainId: offer.chainId,
          token: offer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const offer of res.body.offers) {
        chai.expect(offer.chainId).to.equal(offer.chainId);
      }
    });

    it('Should return only offers with proper token', async function () {
      await collectionOffers.insertOne({
        ...offer,
        date: new Date(),
        userId: process.env.USER_ID_TEST,
        status: 'success',
        amount: '8',
        isActive: true,
        exchangeRate: '2',
      });

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: offer.exchangeChainId,
          exchangeToken: offer.exchangeToken,
          chainId: offer.chainId,
          token: offer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const offer of res.body.offers) {
        chai.expect(offer.token).to.equal(offer.token);
      }
    });

    it('Should return only offers with min less than depositAmount/exchangeRate', async function () {
      await collectionOffers.insertOne({
        ...offer,
        date: new Date(),
        userId: process.env.USER_ID_TEST,
        status: 'success',
        amount: '8',
        isActive: true,
        exchangeRate: '2',
      });

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const offer of res.body.offers) {
        const rateAmount = query.depositAmount / offer.exchangeRate;
        chai.expect(Number(offer.min)).to.be.at.most(rateAmount);
      }
    });

    it('Should return only offers with max greater than depositAmount/exchangeRate', async function () {
      await collectionOffers.insertOne({
        ...offer,
        date: new Date(),
        userId: process.env.USER_ID_TEST,
        status: 'success',
        amount: '8',
        isActive: true,
        exchangeRate: '2',
      });

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const offer of res.body.offers) {
        const rateAmount = query.depositAmount / offer.exchangeRate;
        chai.expect(Number(offer.max)).to.be.at.least(rateAmount);
      }
    });

    it('Should return offers with proper liquidy wallet information', async function () {
      await collectionOffers.insertOne({
        ...offer,
        date: new Date(),
        userId: process.env.USER_ID_TEST,
        status: 'success',
        amount: '8',
        isActive: true,
        exchangeRate: '2',
      });

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: offer.exchangeChainId,
          exchangeToken: offer.exchangeToken,
          chainId: offer.chainId,
          token: offer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      const liquidityWallet = await collectionLiquidityWallet.findOne({});

      for (const offer of res.body.offers) {
        chai.expect(offer.liquidityWallet).to.deep.equal({
          ...liquidityWallet,
          _id: liquidityWallet._id.toString(),
        });
      }
    });

    it('Should return an empty array if no offer match', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: '232323232323232323',
          exchangeToken: offer.exchangeToken,
          chainId: offer.chainId,
          token: offer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.be.an('array').that.is.empty;
    });
  });

  describe('GET all offers for a user', async function () {
    beforeEach(async function () {
      await createBaseOffer(offer);
      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get(pathOffers_Get_User);
      chai.expect(res).to.have.status(403);
    });

    it('Should return only offers for the given user', async function () {
      const customOffer = { ...offer };
      const nbrOffers = 1;
      let userId = '';
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;

        const createResponse = await chai
          .request(app)
          .post(pathOffers_Post)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);
        chai.expect(createResponse).to.have.status(200);

        if (i === 0) {
          userId = (
            await collectionOffers.findOne({
              _id: new ObjectId(createResponse.body.insertedId),
            })
          ).userId;
        }
      }

      const res = await chai
        .request(app)
        .get(pathOffers_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` });

      chai.expect(res).to.have.status(200);

      for (const offer of res.body.offers) {
        chai.expect(offer.userId).to.equal(userId);
      }
    });

    it('Should offers with the proper information', async function () {
      const offerTmp = await collectionOffers.findOne({});
      const liquidityWalletTmp = await collectionLiquidityWallet.findOne({});

      const res = await chai
        .request(app)
        .get(pathOffers_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      chai.expect(res.body).to.deep.equal({
        offers: [
          {
            ...offerTmp,
            _id: offerTmp._id.toString(),
            date: offerTmp.date.toISOString(),
            liquidityWallet: {
              ...liquidityWalletTmp,
              _id: liquidityWalletTmp._id.toString(),
            },
          },
        ],
        totalCount: 1,
      });
    });
  });

  describe('GET offer by offerId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .query({ offerId: offer.offerId });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the offer with the proper offerId', async function () {
      await createBaseOffer(offer);

      const res = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: offer.offerId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body.offerId).to.equal(offer.offerId);
    });

    it('Should return the offer with the proper fields', async function () {
      await createBaseOffer(offer);
      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });

      const offerTmp = await collectionOffers.findOne({});
      const liquidityWalletTmp = await collectionLiquidityWallet.findOne({});

      const formattedData = {
        ...offerTmp,
        _id: offerTmp._id.toString(),
        date: offerTmp.date.toISOString(),
        liquidityWallet: {
          ...liquidityWalletTmp,
          _id: liquidityWalletTmp._id.toString(),
        },
      };

      const res = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: offer.offerId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body).to.deep.equal(formattedData);
    });

    it('Should return an empty object if offerId doesnt exist', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: '111111111111111111111111' });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('GET offer by MongoDB id', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_MongoDBId)
        .query({ id: '643471eaaceeded45b420be6' });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the offer with the proper userId', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOffers_Post)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      chai.expect(createResponse).to.have.status(200);

      const userId = (
        await collectionOffers.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).userId;

      const res = await chai
        .request(app)
        .get(pathOffers_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: createResponse.body.insertedId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.userId).to.equal(userId);
    });

    it('Should return the offer with the proper fields', async function () {
      await createBaseOffer(offer);
      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });

      const offerTmp = await collectionOffers.findOne({});
      const liquidityWalletTmp = await collectionLiquidityWallet.findOne({});

      const formattedData = {
        ...offerTmp,
        _id: offerTmp._id.toString(),
        date: offerTmp.date.toISOString(),
        liquidityWallet: {
          ...liquidityWalletTmp,
          _id: liquidityWalletTmp._id.toString(),
        },
      };

      const res = await chai
        .request(app)
        .get(pathOffers_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: offerTmp._id.toString() });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal(formattedData);
    });

    it('Should return an empty object if MongoDB id doesnt exist', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: '111111111111111111111111' });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('DELETE offer by offerId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .delete(pathOffers_Delete_MongoDBId + 'myOfferId');
      chai.expect(res).to.have.status(403);
    });

    it('Should delete one offer', async function () {
      await createBaseOffer(offer);

      const deleteResponse = await chai
        .request(app)
        .delete(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`);

      chai.expect(deleteResponse).to.have.status(200);
      chai.expect(deleteResponse.body.acknowledged).to.be.true;
      chai.expect(deleteResponse.body.deletedCount).to.equal(1);
    });

    it('Should delete the appropriate offer', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOffers_Post)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      chai.expect(createResponse).to.have.status(200);

      chai.expect(
        await collectionOffers.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.not.be.empty;

      const deleteResponse = await chai
        .request(app)
        .delete(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`);

      chai.expect(deleteResponse).to.have.status(200);

      chai.expect(
        await collectionOffers.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.be.null;
    });

    it('Should return 404 with message if no offer found', async function () {
      const res = await chai
        .request(app)
        .delete(pathOffers_Delete_MongoDBId + 'myOfferId')
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No offer found' });
    });
  });

  describe('PUT offer by offerId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .send({ chainId: '232323' });
      chai.expect(modifyOffer).to.have.status(403);
    });

    it('Should return 404 if offer doesnt exist', async function () {
      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Delete_MongoDBId + 'myOfferId')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ chainId: '232323' });
      chai.expect(modifyOffer).to.have.status(404);
      chai.expect(modifyOffer.body).to.deep.equal({ msg: 'No offer found' });
    });

    it('Should modify only one offer', async function () {
      await createBaseOffer(offer);

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ chainId: '232323' });

      chai.expect(modifyOffer).to.have.status(200);
      chai.expect(modifyOffer.body).to.deep.equal({
        acknowledged: true,
        modifiedCount: 1,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: 1,
      });
    });

    it('Should modify all offer fields', async function () {
      await createBaseOffer(offer);

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);
      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...modifiedOffer,
        hash: offer.hash,
        offerId: offer.offerId,
        status: 'pending',
        liquidityWallet: null,
      });
    });

    it('Should modify only the chainId field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        chainId: '76',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        ...modifiedOffer,
      });
    });

    it('Should modify only min field of an offer', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        min: '10',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        min: modifiedOffer.min,
      });
    });

    it('Should modify only max field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        max: '500',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        max: modifiedOffer.max,
      });
    });

    it('Should modify only tokenId field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        tokenId: 'new-token-id',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        tokenId: modifiedOffer.tokenId,
      });
    });

    it('Should modify only the token field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        token: 'modified-token',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        token: modifiedOffer.token,
      });
    });

    it('Should modify only tokenAddress field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        tokenAddress: '0x1234567890123456789012345678901234567890',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        tokenAddress: modifiedOffer.tokenAddress,
      });
    });

    it('Should modify isActive field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        isActive: false,
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ isActive: modifiedOffer.isActive });

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        isActive: modifiedOffer.isActive,
      });
    });

    it('Should modify the exchangeRate field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        exchangeRate: '3',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        exchangeRate: modifiedOffer.exchangeRate,
      });
    });

    it('Should modify the exchangeToken field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        exchangeToken: 'modified-exchange-token',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        exchangeToken: modifiedOffer.exchangeToken,
      });
    });

    it('Should modify the exchangeChainId field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        exchangeChainId: 'modified-exchange-chain-id',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        exchangeChainId: modifiedOffer.exchangeChainId,
      });
    });

    it('Should modify only estimatedTime field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        estimatedTime: 'modified-estimated-time',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        estimatedTime: modifiedOffer.estimatedTime,
      });
    });

    it('Should modify only provider field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        provider: 'new-provider',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        provider: modifiedOffer.provider,
      });
    });

    it('Should modify the title field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        title: 'Modified Offer Title',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        title: modifiedOffer.title,
      });
    });

    it('Should modify only the image field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        image: 'modified-image',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        image: modifiedOffer.image,
      });
    });

    it('Should modify the amount field', async function () {
      await createBaseOffer(offer);

      const modifiedOffer = {
        amount: '2',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + offer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: offer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: 'pending',
        liquidityWallet: null,
        amount: modifiedOffer.amount,
      });
    });
  });
});
