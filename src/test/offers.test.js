import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionOffers,
  pathOffers_Post,
  mockOffer,
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
 * This function creates a base mockOffer by sending a POST request to a specified path with authorization
 * and expects a 200 status code and certain properties in the response.
 * @param mockOffer - The `mockOffer` parameter is an object that contains the data for creating a new mockOffer.
 * It is being sent as the request body in the POST request to the `pathOffers_Post` endpoint.
 */
async function createBaseOffer(mockOffer) {
  const res = await chai
    .request(app)
    .post(pathOffers_Post)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(mockOffer);
  chai.expect(res).to.have.status(200);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

describe('Offers route', async function () {
  describe('POST new mockOffer', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOffers_Post)
        .send(mockOffer);
      chai.expect(createResponse).to.have.status(403);
    });

    it('Should POST a new mockOffer if all fields are completed and no existing mockOffer', async function () {
      await createBaseOffer(mockOffer);
    });

    it('Should POST multiple new offers with empty offerId', async function () {
      await createBaseOffer({ ...mockOffer, offerId: '' });
      await createBaseOffer({ ...mockOffer, offerId: '' });
    });

    it('Should POST a new mockOffer if all fields are completed and no existing mockOffer (with correct fields)', async function () {
      await createBaseOffer(mockOffer);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .query({ offerId: mockOffer.offerId })
        .set('Authorization', `Bearer ${mockedToken}`);

      // Assertions
      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.be.an('object');

      delete getOffer.body._id;
      delete getOffer.body.userId;
      delete getOffer.body.date;

      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
      });
    });

    it('Should fail if same offerId exists', async function () {
      await createBaseOffer(mockOffer);

      const createDuplicateResponse = await chai
        .request(app)
        .post(pathOffers_Post)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(mockOffer);
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
          ...mockOffer,
          isActive: true,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...mockOffer,
          offerId: 'anotherOfferId',
          isActive: true,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...mockOffer,
          token: 'anotherToken',
          isActive: true,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...mockOffer,
          exchangeToken: 'anotherExchangeToken',
          isActive: true,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...mockOffer,
          exchangeChainId: 'anotherExchangeChainId',
          isActive: true,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...mockOffer,
          isActive: true,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '4',
        },
        {
          ...mockOffer,
          isActive: true,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '10',
        },
        {
          ...mockOffer,
          isActive: true,
          date: new Date(),
          userId: 'anotherUserId',
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...mockOffer,
          isActive: false,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...mockOffer,
          isActive: true,
          offerId: '',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
        },
        {
          ...mockOffer,
          isActive: true,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '',
        },
        {
          ...mockOffer,
          isActive: true,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.PENDING,
          amount: '8',
        },
      ]);

      await collectionLiquidityWallet.insertOne({
        chainId: mockOffer.chainId,
        walletAddress: mockOffer.provider,
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

      res.body.offers.forEach((mockOffer) => {
        chai.expect(mockOffer.amount).that.is.not.empty;
      });
    });

    it('Should return offers with offerId not empty', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((mockOffer) => {
        chai.expect(mockOffer.offerId).that.is.not.empty;
      });
    });

    it('Should return offers with success status', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((mockOffer) => {
        chai.expect(mockOffer.status).to.equal(OFFER_STATUS.SUCCESS);
      });
    });

    it('Should return active offers', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((mockOffer) => {
        chai.expect(mockOffer.isActive).to.be.true;
      });
    });

    it('Should return offers with the proper offerId if specified in query', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: mockOffer.offerId });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((e) => {
        chai.expect(e.offerId).to.equal(mockOffer.offerId);
      });
    });

    it('Should return offers with the proper token if specified in query', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ token: mockOffer.token });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((e) => {
        chai.expect(e.token).to.equal(mockOffer.token);
      });
    });

    it('Should return offers with the proper exchangeToken if specified in query', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ exchangeToken: mockOffer.exchangeToken });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((e) => {
        chai.expect(e.exchangeToken).to.equal(mockOffer.exchangeToken);
      });
    });

    it('Should return offers with the proper exchangeChainId if specified in query', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ exchangeChainId: mockOffer.exchangeChainId });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((e) => {
        chai.expect(e.exchangeChainId).to.equal(mockOffer.exchangeChainId);
      });
    });

    it('Should return offers with the proper minAmount if specified in query', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ amountMin: '5' });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((e) => {
        chai.expect(parseInt(e.amount)).to.be.at.least(5);
      });
    });

    it('Should return offers with the proper maxAmount if specified in query', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ amountMax: '9' });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((e) => {
        chai.expect(parseInt(e.amount)).to.be.at.most(9);
      });
    });

    it('Should return offers with the proper minAmount and maxAmount if both specified in query', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ amountMin: '5', amountMax: '9' });
      chai.expect(res).to.have.status(200);

      res.body.offers.forEach((e) => {
        chai.expect(parseInt(e.amount)).to.be.at.least(5);
        chai.expect(parseInt(e.amount)).to.be.at.most(9);
      });
    });

    it('Should return the correct total count', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_All)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.totalCount).to.be.equal(8);
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
      chai.expect(res.body.offers.length).to.be.equal(7);
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
  });

  describe('GET all active offers with filters', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...mockOffer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
          shouldBeInResult: true,
        },
        {
          ...mockOffer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
          shouldBeInResult: true,
        },
        {
          ...mockOffer,
          exchangeChainId: 'anotherExchangeChainId',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...mockOffer,
          exchangeToken: 'anotherExchangeToken',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...mockOffer,
          chainId: 'anotherChainId',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...mockOffer,
          token: 'anotherToken',
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.SUCCESS,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...mockOffer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.PENDING,
          amount: '8',
          isActive: true,
          exchangeRate: '2',
        },
        {
          ...mockOffer,
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
        chainId: mockOffer.chainId,
        walletAddress: mockOffer.provider,
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
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(Array.isArray(res.body.offers)).to.be.true;
      chai.expect(res.body.offers).to.not.be.empty;

      for (const mockOffer of res.body.offers) {
        chai.expect(mockOffer.isActive).to.be.true;
      }
    });

    it('Should return only offers with proper exchangeChainId', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
          depositAmount: '1',
        });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const mockOffer of res.body.offers) {
        chai
          .expect(mockOffer.exchangeChainId)
          .to.equal(mockOffer.exchangeChainId);
      }
    });

    it('Should return only offers with proper exchangeToken', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const mockOffer of res.body.offers) {
        chai.expect(mockOffer.exchangeToken).to.equal(mockOffer.exchangeToken);
      }
    });

    it('Should return only offers with proper chainId', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const mockOffer of res.body.offers) {
        chai.expect(mockOffer.chainId).to.equal(mockOffer.chainId);
      }
    });

    it('Should return only offers with proper token', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const mockOffer of res.body.offers) {
        chai.expect(mockOffer.token).to.equal(mockOffer.token);
      }
    });

    it('Should return only offers with min less than depositAmount/exchangeRate', async function () {
      const query = {
        exchangeChainId: mockOffer.exchangeChainId,
        exchangeToken: mockOffer.exchangeToken,
        chainId: mockOffer.chainId,
        token: mockOffer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const mockOffer of res.body.offers) {
        const rateAmount = query.depositAmount / mockOffer.exchangeRate;
        chai.expect(Number(mockOffer.min)).to.be.at.most(rateAmount);
      }
    });

    it('Should return only offers with max greater than depositAmount/exchangeRate', async function () {
      const query = {
        exchangeChainId: mockOffer.exchangeChainId,
        exchangeToken: mockOffer.exchangeToken,
        chainId: mockOffer.chainId,
        token: mockOffer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      for (const mockOffer of res.body.offers) {
        const rateAmount = query.depositAmount / mockOffer.exchangeRate;
        chai.expect(Number(mockOffer.max)).to.be.at.least(rateAmount);
      }
    });

    it('Should return offers with proper liquidy wallet information', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.offers).to.not.be.empty;

      const liquidityWalletFromInMemoryDB =
        await collectionLiquidityWallet.findOne({});

      for (const mockOffer of res.body.offers) {
        chai.expect(mockOffer.liquidityWallet).to.deep.equal({
          chainId: mockOffer.chainId,
          walletAddress: mockOffer.provider,
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
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
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
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
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
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
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
          exchangeChainId: mockOffer.exchangeChainId,
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
          depositAmount: '1',
        });
      chai.expect(res).to.have.status(200);
      for (let i = 0; i < res.body.offers.length; i++) {
        chai
          .expect(res.body.offers[i].date)
          .to.equal(offerFromInMemoryDB[i].date.toISOString());
      }
    });

    it('Should return an empty array if no mockOffer match', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_Search)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: '232323232323232323',
          exchangeToken: mockOffer.exchangeToken,
          chainId: mockOffer.chainId,
          token: mockOffer.token,
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
          ...mockOffer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.PENDING,
        },
        {
          ...mockOffer,
          date: new Date(),
          userId: process.env.USER_ID_TEST,
          status: OFFER_STATUS.PENDING,
        },
        {
          ...mockOffer,
          date: new Date(),
          userId: 'anotherUser',
          status: OFFER_STATUS.PENDING,
        },
      ]);

      await collectionLiquidityWallet.insertOne({
        chainId: mockOffer.chainId,
        walletAddress: mockOffer.provider,
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

      for (const mockOffer of res.body.offers) {
        chai.expect(mockOffer.userId).to.equal(process.env.USER_ID_TEST);
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
            ...mockOffer,
            date: new Date(),
            userId: process.env.USER_ID_TEST,
            status: OFFER_STATUS.PENDING,
            _id: offerFromInMemoryDB[0]._id.toString(),
            date: offerFromInMemoryDB[0].date.toISOString(),
            liquidityWallet: {
              chainId: mockOffer.chainId,
              walletAddress: mockOffer.provider,
              _id: liquidityWalletFromInMemoryDB._id.toString(),
            },
          },
          {
            ...mockOffer,
            date: new Date(),
            userId: process.env.USER_ID_TEST,
            status: OFFER_STATUS.PENDING,
            _id: offerFromInMemoryDB[1]._id.toString(),
            date: offerFromInMemoryDB[1].date.toISOString(),
            liquidityWallet: {
              chainId: mockOffer.chainId,
              walletAddress: mockOffer.provider,
              _id: liquidityWalletFromInMemoryDB._id.toString(),
            },
          },
        ],
        totalCount: 2,
      });
    });
  });

  describe('GET mockOffer by offerId', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...mockOffer,
        },
        {
          ...mockOffer,
          offerId: 'anotherOfferId',
        },
      ]);

      await collectionLiquidityWallet.insertOne({
        chainId: mockOffer.chainId,
        walletAddress: mockOffer.provider,
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .query({ offerId: mockOffer.offerId });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the mockOffer with the proper offerId', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: mockOffer.offerId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body.offerId).to.equal(mockOffer.offerId);
    });

    it('Should return the mockOffer with the proper fields', async function () {
      await collectionLiquidityWallet.insertOne({
        chainId: mockOffer.chainId,
        walletAddress: mockOffer.provider,
      });

      const offerFromInMemoryDB = await collectionOffers.findOne({
        offerId: mockOffer.offerId,
      });
      const liquidityWalletFromInMemoryDB =
        await collectionLiquidityWallet.findOne({});

      const res = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: mockOffer.offerId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body).to.deep.equal({
        ...mockOffer,
        _id: offerFromInMemoryDB._id.toString(),
        liquidityWallet: {
          chainId: mockOffer.chainId,
          walletAddress: mockOffer.provider,
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

  describe('GET mockOffer by MongoDB id', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...mockOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          userId: 'anotherUserId',
        },
      ]);

      await collectionLiquidityWallet.insertOne({
        chainId: mockOffer.chainId,
        walletAddress: mockOffer.provider,
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOffers_Get_MongoDBId)
        .query({ id: '643471eaaceeded45b420be6' });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the mockOffer with the proper userId', async function () {
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

    it('Should return the mockOffer with the proper fields', async function () {
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
        ...mockOffer,
        userId: process.env.USER_ID_TEST,
        _id: offerFromInMemoryDB._id.toString(),
        liquidityWallet: {
          chainId: mockOffer.chainId,
          walletAddress: mockOffer.provider,
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

  describe('DELETE mockOffer by offerId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .delete(pathOffers_Delete_MongoDBId + 'myOfferId');
      chai.expect(res).to.have.status(403);
    });

    it('Should delete one mockOffer', async function () {
      await createBaseOffer(mockOffer);

      const deleteResponse = await chai
        .request(app)
        .delete(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`);

      chai.expect(deleteResponse).to.have.status(200);
      chai.expect(deleteResponse.body.acknowledged).to.be.true;
      chai.expect(deleteResponse.body.deletedCount).to.equal(1);
    });

    it('Should delete the appropriate mockOffer', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOffers_Post)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(mockOffer);
      chai.expect(createResponse).to.have.status(200);

      chai.expect(
        await collectionOffers.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.not.be.empty;

      const deleteResponse = await chai
        .request(app)
        .delete(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`);

      chai.expect(deleteResponse).to.have.status(200);

      chai.expect(
        await collectionOffers.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.be.null;
    });

    it('Should return 404 with message if no mockOffer found', async function () {
      const res = await chai
        .request(app)
        .delete(pathOffers_Delete_MongoDBId + 'myOfferId')
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No offer found' });
    });
  });

  describe('PUT mockOffer by offerId', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...mockOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          offerId: 'anotherOfferId',
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
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

    it('Should return 404 if no mockOffer found', async function () {
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

    it('Should update mockOffer only for current userId and proper offerId', async function () {
      const res = await chai
        .request(app)
        .put(pathOffers_Put_Activation)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          offerId: mockOffer.offerId,
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
          offerId: mockOffer.offerId,
          activating: true,
          hash: 'myHashForActivation',
        });
      chai.expect(res).to.have.status(200);

      const modifOffer = await collectionOffers.findOne({
        offerId: mockOffer.offerId,
      });
      chai.expect(modifOffer.activationHash).to.equal('myHashForActivation');
    });

    it('Should set status activating if activating is true', async function () {
      const res = await chai
        .request(app)
        .put(pathOffers_Put_Activation)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          offerId: mockOffer.offerId,
          activating: true,
          hash: 'myHashForActivation',
        });
      chai.expect(res).to.have.status(200);

      const modifOffer = await collectionOffers.findOne({
        offerId: mockOffer.offerId,
      });
      chai.expect(modifOffer.status).to.equal(OFFER_STATUS.ACTIVATION);
    });

    it('Should set status deactivating if activating is false', async function () {
      const res = await chai
        .request(app)
        .put(pathOffers_Put_Activation)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          offerId: mockOffer.offerId,
          activating: false,
          hash: 'myHashForActivation',
        });
      chai.expect(res).to.have.status(200);

      const modifOffer = await collectionOffers.findOne({
        offerId: mockOffer.offerId,
      });
      chai.expect(modifOffer.status).to.equal(OFFER_STATUS.DEACTIVATION);
    });
  });

  describe('PUT mockOffer by offerId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .send({ chainId: '232323' });
      chai.expect(modifyOffer).to.have.status(403);
    });

    it('Should return 404 if mockOffer doesnt exist', async function () {
      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Delete_MongoDBId + 'myOfferId')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ chainId: '232323' });
      chai.expect(modifyOffer).to.have.status(404);
      chai.expect(modifyOffer.body).to.deep.equal({ msg: 'No offer found' });
    });

    it('Should modify only one mockOffer', async function () {
      await createBaseOffer(mockOffer);

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
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

    it('Should modify all mockOffer fields', async function () {
      await createBaseOffer(mockOffer);

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);
      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...modifiedOffer,
        isActive: true,
        hash: mockOffer.hash,
        offerId: mockOffer.offerId,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
      });
    });

    it('Should modify only the chainId field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        chainId: '76',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        ...modifiedOffer,
      });
    });

    it('Should modify only min field of an mockOffer', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        min: '10',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        min: modifiedOffer.min,
      });
    });

    it('Should modify only max field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        max: '500',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        max: modifiedOffer.max,
      });
    });

    it('Should modify only tokenId field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        tokenId: 'new-token-id',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        tokenId: modifiedOffer.tokenId,
      });
    });

    it('Should modify only the token field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        token: 'modified-token',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        token: modifiedOffer.token,
      });
    });

    it('Should modify only tokenAddress field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        tokenAddress: '0x1234567890123456789012345678901234567890',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        tokenAddress: modifiedOffer.tokenAddress,
      });
    });

    it('Should modify the exchangeRate field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        exchangeRate: '3',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        exchangeRate: modifiedOffer.exchangeRate,
      });
    });

    it('Should modify the exchangeToken field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        exchangeToken: 'modified-exchange-token',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        exchangeToken: modifiedOffer.exchangeToken,
      });
    });

    it('Should modify the exchangeChainId field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        exchangeChainId: 'modified-exchange-chain-id',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        exchangeChainId: modifiedOffer.exchangeChainId,
      });
    });

    it('Should modify only estimatedTime field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        estimatedTime: 'modified-estimated-time',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        estimatedTime: modifiedOffer.estimatedTime,
      });
    });

    it('Should modify only provider field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        provider: 'new-provider',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        provider: modifiedOffer.provider,
      });
    });

    it('Should modify the title field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        title: 'Modified Offer Title',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        title: modifiedOffer.title,
      });
    });

    it('Should modify only the image field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        image: 'modified-image',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        image: modifiedOffer.image,
      });
    });

    it('Should modify the amount field', async function () {
      await createBaseOffer(mockOffer);

      const modifiedOffer = {
        amount: '2',
      };

      const modifyOffer = await chai
        .request(app)
        .put(pathOffers_Put + mockOffer.offerId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(modifiedOffer);

      chai.expect(modifyOffer).to.have.status(200);

      const getOffer = await chai
        .request(app)
        .get(pathOffers_Get_OfferId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ offerId: mockOffer.offerId });

      delete getOffer.body._id;
      delete getOffer.body.date;
      delete getOffer.body.userId;

      chai.expect(getOffer).to.have.status(200);
      chai.expect(getOffer.body).to.deep.equal({
        ...mockOffer,
        isActive: true,
        status: OFFER_STATUS.PENDING,
        liquidityWallet: null,
        amount: modifiedOffer.amount,
      });
    });
  });
});
