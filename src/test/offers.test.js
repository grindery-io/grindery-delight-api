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
  pathLiquidityWallets_Post_NewLiquidityWallet,
  collectionLiquidityWallet,
  pathOffers_Put_Activation,
} from './utils/variables.js';
import { OFFER_STATUS } from '../utils/offers-utils.js';

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

      chai.expect(getOffer.body).to.deep.equal({
        ...offer,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
      });
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
      await collectionOffers.insertMany([
        {
          ...offer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...offer,
          date: new Date(),
          userId: 'anotherUserId',
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...offer,
          isActive: false,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...offer,
          offerId: '',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...offer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '',
        },
        {
          ...offer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.PENDING,
          amount: '8',
        },
      ]);

      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });
    });

    it('Should not fail if no token is provided', async function () {
      const res = await chai.request(app).get(pathOffers_Get_All);
      chai.expect(res).to.have.status(200);
    });

    it('Should return offers with amount not empty', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((offer) => {
        chai.expect(offer.amount).that.is.not.empty;
      });
    });

    it('Should return offers with offerId not empty', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((offer) => {
        chai.expect(offer.offerId).that.is.not.empty;
      });
    });

    it('Should return offers with success status', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((offer) => {
        chai.expect(offer.status).to.equal(OFFER_STATUS.SUCCESS);
      });
    });

    it('Should return active offers', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((offer) => {
        chai.expect(offer.isActive).to.be.true;
      });
    });

    it('Should return the correct total count', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.totalCount).to.be.equal(2);
    });

    it('Should set a proper limit', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ limit: 1 });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers.length).to.be.equal(1);
    });

    it('Should set a proper offset', async function () {
      const offerFromInMemoryDB = await collectionOffers
        .find({
          isActive: true,
          amount: { $exists: true, $ne: '' },
          status: OFFER_STATUS.SUCCESS,
          offerId: { $exists: true, $ne: '' },
        })
        .sort({ date: -1 })
        .toArray();

      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offset: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers.length).to.be.equal(1);
      chai
        .expect(res.body.offers[0]._id)
        .to.equal(offerFromInMemoryDB[1]._id.toString());
    });

    it('Should sort by date', async function () {
      const offerFromInMemoryDB = await collectionOffers
        .find({
          isActive: true,
          amount: { $exists: true, $ne: '' },
          status: OFFER_STATUS.SUCCESS,
          offerId: { $exists: true, $ne: '' },
        })
        .sort({ date: -1 })
        .toArray();

      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offset: 1 });
      chai.expect(res).to.have.status(200);

      for (let i = 0; i < res.body.offers.length; i++) {
        chai
          .expect(res.body.offers[i].date)
          .to.equal(offerFromInMemoryDB[i].date.toISOString());
      }
    });

    it('Should return an array with the correct MongoDB elements', async function () {
      const offerFromInMemoryDB = await collectionOffers
        .find({
          isActive: true,
          amount: { $exists: true, $ne: '' },
          status: OFFER_STATUS.SUCCESS,
          offerId: { $exists: true, $ne: '' },
        })
        .sort({ date: -1 })
        .toArray();
      const liquidityWalletFromInMemoryDB =
        await collectionLiquidityWallet.findOne({});

      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        offers: [
          {
            ...offer,
            userId: process.env.USER_ID_TEST,
            status: OFFER_STATUS.SUCCESS,
            amount: '8',
            _id: offerFromInMemoryDB[0]._id.toString(),
            date: offerFromInMemoryDB[0].date.toISOString(),
            liquidityWallet: {
              chainId: offer.chainId,
              walletAddress: offer.provider,
              _id: liquidityWalletFromInMemoryDB._id.toString(),
            },
          },
          {
            ...offer,
            userId: 'anotherUserId',
            status: OFFER_STATUS.SUCCESS,
            amount: '8',
            _id: offerFromInMemoryDB[1]._id.toString(),
            date: offerFromInMemoryDB[1].date.toISOString(),
            liquidityWallet: {
              chainId: offer.chainId,
              walletAddress: offer.provider,
              _id: liquidityWalletFromInMemoryDB._id.toString(),
            },
          },
        ],
        totalCount: 2,
      });
    });
  });

  describe('GET all active offers with filters', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...offer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
          shouldBeInResult: true,
        },
        {
          ...offer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
          shouldBeInResult: true,
        },
        {
          ...offer,
          exchangeChainId: 'anotherExchangeChainId',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...offer,
          exchangeToken: 'anotherExchangeToken',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...offer,
          chainId: 'anotherChainId',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...offer,
          token: 'anotherToken',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...offer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.PENDING,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...offer,
          offerId: '',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
      ]);

      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });
    });

    it('Should not fail if no token is provided', async function () {
      const res = await chai.request(app).get(pathOffers_Get_Search).query({
        exchangeChainId: 'myExchangeChainId',
        exchangeToken: 'myExchangeToken',
        chainId: 'myChainId',
        token: 'myToken',
        depositAmount: '1',
      });
      chai.expect(res).to.have.status(200);
    });

    it('Should return an array of active offers', async function () {
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

      const liquidityWalletFromInMemoryDB =
        await collectionLiquidityWallet.findOne({});

      for (const offer of res.body.offers) {
        chai.expect(offer.liquidityWallet).to.deep.equal({
          chainId: offer.chainId,
          walletAddress: offer.provider,
          _id: liquidityWalletFromInMemoryDB._id.toString(),
        });
      }
    });

    it('Should set a proper totalCount', async function () {
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
          limit: 1,
        });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.totalCount).to.be.equal(2);
    });

    it('Should set a proper limit', async function () {
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
          limit: 1,
        });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.totalCount).to.be.equal(2);
      chai.expect(res.body.offers.length).to.be.equal(1);
    });

    it('Should set a proper offset', async function () {
      const offerFromInMemoryDB = await collectionOffers
        .find({
          shouldBeInResult: true,
        })
        .sort({ date: -1 })
        .toArray();

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
          offset: 1,
        });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.totalCount).to.be.equal(2);
      chai
        .expect(res.body.offers[0]._id)
        .to.equal(offerFromInMemoryDB[1]._id.toString());
    });

    it('Should sort by date', async function () {
      const offerFromInMemoryDB = await collectionOffers
        .find({
          shouldBeInResult: true,
        })
        .sort({ date: -1 })
        .toArray();

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
      for (let i = 0; i < res.body.offers.length; i++) {
        chai
          .expect(res.body.offers[i].date)
          .to.equal(offerFromInMemoryDB[i].date.toISOString());
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
      await collectionOffers.insertMany([
        {
          ...offer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.PENDING,
        },
        {
          ...offer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.PENDING,
        },
        {
          ...offer,
          date: new Date(),
          userId: 'anotherUser',
          status: OFFER_STATUS.PENDING,
        },
      ]);

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
      const res = await chai
        .request(app)
        .get(pathOffers_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      for (const offer of res.body.offers) {
        chai.expect(offer.userId).to.equal(process.env.USER_ID_TEST);
      }
    });

    it('Should set a proper limit', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ limit: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers.length).to.equal(1);
    });

    it('Should set a proper offset', async function () {
      const offerFromInMemoryDB = await collectionOffers
        .find({
          userId: process.env.USER_ID_TEST,
        })
        .sort({ date: -1 })
        .toArray();

      const res = await chai
        .request(app)
        .get(pathOffers_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offset: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers.length).to.equal(1);
      chai
        .expect(res.body.offers[0]._id)
        .to.equal(offerFromInMemoryDB[1]._id.toString());
    });

    it('Should set a totalCount', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ limit: 1 });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.totalCount).to.equal(2);
    });

    it('Should sort by date', async function () {
      const offerFromInMemoryDB = await collectionOffers
        .find({
          userId: process.env.USER_ID_TEST,
        })
        .sort({ date: -1 })
        .toArray();

      const res = await chai
        .request(app)
        .get(pathOffers_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);
      for (let i = 0; i < res.body.offers.length; i++) {
        chai
          .expect(res.body.offers[i].date)
          .to.equal(offerFromInMemoryDB[i].date.toISOString());
      }
    });

    it('Should offers with the proper information', async function () {
      const offerFromInMemoryDB = await collectionOffers
        .find({})
        .sort({ date: -1 })
        .toArray();
      const liquidityWalletFromInMemoryDB =
        await collectionLiquidityWallet.findOne({});

      const res = await chai
        .request(app)
        .get(pathOffers_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      chai.expect(res.body).to.deep.equal({
        offers: [
          {
            ...offer,
            date: new Date(),
            userId: process.env.USER_ID_TEST,
            status: OFFER_STATUS.PENDING,
            _id: offerFromInMemoryDB[0]._id.toString(),
            date: offerFromInMemoryDB[0].date.toISOString(),
            liquidityWallet: {
              chainId: offer.chainId,
              walletAddress: offer.provider,
              _id: liquidityWalletFromInMemoryDB._id.toString(),
            },
          },
          {
            ...offer,
            date: new Date(),
            userId: process.env.USER_ID_TEST,
            status: OFFER_STATUS.PENDING,
            _id: offerFromInMemoryDB[1]._id.toString(),
            date: offerFromInMemoryDB[1].date.toISOString(),
            liquidityWallet: {
              chainId: offer.chainId,
              walletAddress: offer.provider,
              _id: liquidityWalletFromInMemoryDB._id.toString(),
            },
          },
        ],
        totalCount: 2,
      });
    });
  });

  describe('GET offer by offerId', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...offer,
        },
        {
          ...offer,
          offerId: 'anotherOfferId',
        },
      ]);

      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .query({ offerId: offer.offerId });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the offer with the proper offerId', async function () {
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
      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });

      const offerFromInMemoryDB = await collectionOffers.findOne({
        offerId: offer.offerId,
      });
      const liquidityWalletFromInMemoryDB =
        await collectionLiquidityWallet.findOne({});

      const res = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: offer.offerId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body).to.deep.equal({
        ...offer,
        _id: offerFromInMemoryDB._id.toString(),
        liquidityWallet: {
          chainId: offer.chainId,
          walletAddress: offer.provider,
          _id: liquidityWalletFromInMemoryDB._id.toString(),
        },
      });
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
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...offer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          userId: 'anotherUserId',
        },
      ]);

      await collectionLiquidityWallet.insertOne({
        chainId: offer.chainId,
        walletAddress: offer.provider,
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_MongoDBId)
        .query({ id: '643471eaaceeded45b420be6' });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the offer with the proper userId', async function () {
      const offerFromInMemoryDB = await collectionOffers.findOne({
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOffers_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: offerFromInMemoryDB._id.toString() });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.userId).to.equal(process.env.USER_ID_TEST);
    });

    it('Should return the offer with the proper fields', async function () {
      const offerFromInMemoryDB = await collectionOffers.findOne({
        userId: process.env.USER_ID_TEST,
      });
      const liquidityWalletFromInMemoryDB =
        await collectionLiquidityWallet.findOne({});

      const res = await chai
        .request(app)
        .get(pathOffers_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: offerFromInMemoryDB._id.toString() });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        ...offer,
        userId: process.env.USER_ID_TEST,
        _id: offerFromInMemoryDB._id.toString(),
        liquidityWallet: {
          chainId: offer.chainId,
          walletAddress: offer.provider,
          _id: liquidityWalletFromInMemoryDB._id.toString(),
        },
      });
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
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...offer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          offerId: 'anotherOfferId',
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          userId: 'anotherUserId',
        },
      ]);
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .put(pathOffers_Put_Activation)
        .send({ chainId: '232323' });
      chai.expect(res).to.have.status(403);
    });

    it('Should return 404 if no offer found', async function () {
      const res = await chai
        .request(app)
        .put(pathOffers_Put_Activation)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          offerId: 'notAnOfferId',
          activating: true,
          hash: 'myHashForActivation',
        });
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No offer found' });
    });

    it('Should update offer only for current userId and proper offerId', async function () {
      const res = await chai
        .request(app)
        .put(pathOffers_Put_Activation)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          offerId: offer.offerId,
          activating: true,
          hash: 'myHashForActivation',
        });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.matchedCount).to.equal(1);
    });

    it('Should push activation hash', async function () {
      const res = await chai
        .request(app)
        .put(pathOffers_Put_Activation)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          offerId: offer.offerId,
          activating: true,
          hash: 'myHashForActivation',
        });
      chai.expect(res).to.have.status(200);

      const modifOffer = await collectionOffers.findOne({
        offerId: offer.offerId,
      });
      chai.expect(modifOffer.activationHash).to.equal('myHashForActivation');
    });

    it('Should set status activating if activating is true', async function () {
      const res = await chai
        .request(app)
        .put(pathOffers_Put_Activation)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          offerId: offer.offerId,
          activating: true,
          hash: 'myHashForActivation',
        });
      chai.expect(res).to.have.status(200);

      const modifOffer = await collectionOffers.findOne({
        offerId: offer.offerId,
      });
      chai.expect(modifOffer.status).to.equal(OFFER_STATUS.ACTIVATION);
    });

    it('Should set status deactivating if activating is false', async function () {
      const res = await chai
        .request(app)
        .put(pathOffers_Put_Activation)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          offerId: offer.offerId,
          activating: false,
          hash: 'myHashForActivation',
        });
      chai.expect(res).to.have.status(200);

      const modifOffer = await collectionOffers.findOne({
        offerId: offer.offerId,
      });
      chai.expect(modifOffer.status).to.equal(OFFER_STATUS.DEACTIVATION);
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
        isActive: true,
        hash: offer.hash,
        offerId: offer.offerId,
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        tokenAddress: modifiedOffer.tokenAddress,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
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
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        amount: modifiedOffer.amount,
      });
    });
  });
});
