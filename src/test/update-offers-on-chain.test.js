import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import sinon from 'sinon';
import {
  mockBlockchainGoerli,
  collectionBlockchains,
  collectionOffers,
  mockOffer,
  pathBlockchain_Put_OffersActivationUser,
  pathBlockchain_Put_OffersActivationAll,
  pathBlockchain_Put_OffersAll,
  pathBlockchain_Put_OffersUser,
} from './utils/variables.js';
import { utils_offers } from '../utils/view-blockchains-utils.js';
import { mockedToken } from './utils/utils.js';
import { OFFER_STATUS } from '../utils/offers-utils.js';

/* eslint-disable no-unused-expressions */

chai.use(chaiHttp);

let blockchainDBGoerli, getOfferIdFromHashStub, isSetStatusFromHashStub;

// Offer creation
const mockTxHashNewOffer = 'mockTxHashNewOffer';
const mockTxHashFailed = 'mockTxHashFailed';
const mockTxHashSetStatusActivation = 'mockTxHashSetStatusActivation';
const mockTxHashSetStatusDeactivation = 'mockTxHashSetStatusDeactivation';
const mockOfferId = 'mockOfferId';

beforeEach(async function () {
  blockchainDBGoerli = await collectionBlockchains.findOne({
    chainId: mockBlockchainGoerli.chainId,
  });

  // Mocking
  getOfferIdFromHashStub = sinon
    .stub(utils_offers, 'getOfferIdFromHash')
    .callsFake(async function (_rpc, _hash) {
      return _hash === mockTxHashNewOffer ? mockOfferId : '';
    });

  isSetStatusFromHashStub = sinon
    .stub(utils_offers, 'isSetStatusFromHash')
    .callsFake(async function (_rpc, _hash) {
      return _hash === mockTxHashSetStatusActivation ||
        _hash === mockTxHashSetStatusDeactivation
        ? {
            isSetStatus: true,
            isActive: _hash === mockTxHashSetStatusActivation,
          }
        : {
            isSetStatus: false,
            isActive: undefined,
          };
    });
});

afterEach(async function () {
  getOfferIdFromHashStub.restore();
  isSetStatusFromHashStub.restore();
});

describe('Update offers via on-chain', async function () {
  describe('Get mockOfferId', async function () {
    it('getOfferIdFromHash should return the proper mockOfferId', async function () {
      chai
        .expect(
          await utils_offers.getOfferIdFromHash(
            blockchainDBGoerli.rpc[0],
            mockTxHashNewOffer
          )
        )
        .to.equal(mockOfferId);
    });

    it('getOfferIdFromHash should return empty string if transaction failed', async function () {
      chai
        .expect(
          await utils_offers.getOfferIdFromHash(
            blockchainDBGoerli.rpc[0],
            mockTxHashFailed
          )
        )
        .to.equal('');
    });
  });

  describe('Update database - by userId', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...mockOffer,
          status: OFFER_STATUS.PENDING,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          status: OFFER_STATUS.PENDING,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          status: OFFER_STATUS.SUCCESS,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          status: OFFER_STATUS.PENDING,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          status: OFFER_STATUS.PENDING,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOffer,
          userId: 'anotherUserId',
        },
      ]);
    });

    it('Should not modify offers with non pending status', async function () {
      const unmodifiedOffer = await collectionOffers.findOne({
        status: OFFER_STATUS.SUCCESS,
      });

      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      const unmodifiedOfferAfter = await collectionOffers.findOne({
        _id: unmodifiedOffer._id,
      });
      chai.expect(unmodifiedOfferAfter.offerId).to.not.equal(mockOfferId);
    });

    it('Should only modify offers for the current userId', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOffer) => {
        chai.expect(mockOffer.userId).to.equal(process.env.USER_ID_TEST);
      });
    });

    it('Should modify mockOffer - mockOfferId', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOffer) => {
        if (mockOffer.hash === mockTxHashNewOffer) {
          chai.expect(mockOffer.offerId).to.equal(mockOfferId);
        }
      });
    });

    it('Should modify mockOffer status to succes if new Offer', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOffer) => {
        if (mockOffer.hash === mockTxHashNewOffer) {
          chai.expect(mockOffer.status).to.equal(OFFER_STATUS.SUCCESS);
        }
      });
    });

    it('Should modify mockOffer status to failure if no new Offer', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOffer) => {
        if (mockOffer.hash === mockTxHashFailed) {
          chai.expect(mockOffer.status).to.equal(OFFER_STATUS.FAILURE);
        }
      });
    });
  });

  describe('Update database - All', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...mockOffer,
          status: OFFER_STATUS.PENDING,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          status: OFFER_STATUS.PENDING,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          status: OFFER_STATUS.SUCCESS,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          status: OFFER_STATUS.PENDING,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          status: OFFER_STATUS.PENDING,
          exchangeChainId: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOffer,
          userId: 'anotherUserId',
        },
      ]);
    });

    it('Should not modify offers with non pending status', async function () {
      const unmodifiedOffer = await collectionOffers.findOne({
        status: OFFER_STATUS.SUCCESS,
      });

      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);

      const unmodifiedOfferAfter = await collectionOffers.findOne({
        _id: unmodifiedOffer._id,
      });
      chai.expect(unmodifiedOfferAfter.offerId).to.not.equal(mockOfferId);
    });

    it('Should only modify all offers', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      chai.expect(
        res.body.some(
          (mockOffer) => mockOffer.userId === process.env.USER_ID_TEST
        )
      ).to.be.true;
      chai.expect(
        res.body.some((mockOffer) => mockOffer.userId === 'anotherUserId')
      ).to.be.true;
    });

    it('Should modify mockOffer - mockOfferId', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOffer) => {
        if (mockOffer.hash === mockTxHashNewOffer) {
          chai.expect(mockOffer.offerId).to.equal(mockOfferId);
        }
      });
    });

    it('Should modify mockOffer status to succes if new Offer', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOffer) => {
        if (mockOffer.hash === mockTxHashNewOffer) {
          chai.expect(mockOffer.status).to.equal(OFFER_STATUS.SUCCESS);
        }
      });
    });

    it('Should modify mockOffer status to failure if no new Offer', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOffer) => {
        if (mockOffer.hash === mockTxHashFailed) {
          chai.expect(mockOffer.status).to.equal(OFFER_STATUS.FAILURE);
        }
      });
    });
  });

  describe('Update offers activation', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...mockOffer,
          chainId: blockchainDBGoerli.chainId,
          status: OFFER_STATUS.ACTIVATION,
          isActive: false,
          activationHash: mockTxHashSetStatusActivation,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          chainId: blockchainDBGoerli.chainId,
          status: OFFER_STATUS.DEACTIVATION,
          isActive: true,
          activationHash: mockTxHashSetStatusDeactivation,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          chainId: blockchainDBGoerli.chainId,
          status: OFFER_STATUS.ACTIVATION,
          isActive: false,
          activationHash: mockTxHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          chainId: blockchainDBGoerli.chainId,
          status: OFFER_STATUS.DEACTIVATION,
          isActive: true,
          activationHash: mockTxHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          chainId: blockchainDBGoerli.chainId,
          status: OFFER_STATUS.ACTIVATION,
          isActive: false,
          activationHash: mockTxHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          chainId: blockchainDBGoerli.chainId,
          status: OFFER_STATUS.ACTIVATION,
          isActive: true,
          activationHash: mockTxHashSetStatusActivation,
          userId: process.env.USER_ID_TEST,
          notToBeModified: 'notToBeModified',
        },
        {
          ...mockOffer,
          chainId: blockchainDBGoerli.chainId,
          status: OFFER_STATUS.DEACTIVATION,
          isActive: false,
          activationHash: mockTxHashSetStatusActivation,
          userId: process.env.USER_ID_TEST,
          notToBeModified: 'notToBeModified',
        },
        {
          ...mockOffer,
          chainId: blockchainDBGoerli.chainId,
          status: OFFER_STATUS.ACTIVATION,
          isActive: false,
          offerId: '',
          activationHash: mockTxHashSetStatusActivation,
          userId: process.env.USER_ID_TEST,
          notToBeModified: 'notToBeModified',
        },
        {
          ...mockOffer,
          chainId: blockchainDBGoerli.chainId,
          status: OFFER_STATUS.ACTIVATION,
          isActive: false,
          activationHash: mockTxHashFailed,
          userId: 'anotherUserId',
          notToBeModified: 'notToBeModified',
        },
      ]);
    });

    describe('Capture LogSetStatusOffer event', async function () {
      it('Should return {isSetStatus: true, isActive: true} for a transaction with LogSetStatusOffer', async function () {
        chai
          .expect(
            await utils_offers.isSetStatusFromHash(
              blockchainDBGoerli.rpc[0],
              mockTxHashSetStatusActivation
            )
          )
          .to.deep.equal({ isSetStatus: true, isActive: true });
      });

      it('Should return {isSetStatus: true, isActive: false} for a transaction with LogSetStatusOffer', async function () {
        chai
          .expect(
            await utils_offers.isSetStatusFromHash(
              blockchainDBGoerli.rpc[0],
              mockTxHashSetStatusDeactivation
            )
          )
          .to.deep.equal({ isSetStatus: true, isActive: false });
      });

      it('Should return {isSetStatus: false, isActive: undefined} for a transaction without LogSetStatusOffer', async function () {
        chai
          .expect(
            await utils_offers.isSetStatusFromHash(
              blockchainDBGoerli.rpc[0],
              mockTxHashNewOffer
            )
          )
          .to.deep.equal({ isSetStatus: false, isActive: undefined });
      });

      it('Should return {isSetStatus: false, isActive: undefined} for a transaction that failed', async function () {
        chai
          .expect(
            await utils_offers.isSetStatusFromHash(
              blockchainDBGoerli.rpc[0],
              mockTxHashFailed
            )
          )
          .to.deep.equal({ isSetStatus: false, isActive: undefined });
      });
    });

    describe('Update activation in database - user', async function () {
      it('Should update orders for the current userId', async function () {
        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          chai.expect(mockOffer.userId).to.equal(process.env.USER_ID_TEST);
        });
      });

      it('Should not modified non appropriate offers', async function () {
        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          chai.expect(mockOffer).to.not.have.property('notToBeModified');
        });
      });

      it('Should update isActive to true if status = activation & isActive = false & activationHash contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashSetStatusActivation,
            isActive: false,
            status: OFFER_STATUS.ACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.isActive).to.be.true;
          }
        });
      });

      it('Should update status to success if status = activation & isActive = false & activationHash contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashSetStatusActivation,
            isActive: false,
            status: OFFER_STATUS.ACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.status).to.equal(OFFER_STATUS.SUCCESS);
          }
        });
      });

      it('Should not update isActive if status = activation & isActive = false & activationHash doesnt contain LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashFailed,
            isActive: false,
            status: OFFER_STATUS.ACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.isActive).to.be.false;
          }
        });
      });

      it('Should update status to activationFailure if status = activation & isActive = false & activationHash doesnt contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashFailed,
            isActive: false,
            status: OFFER_STATUS.ACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai
              .expect(mockOffer.status)
              .to.equal(OFFER_STATUS.ACTIVATION_FAILURE);
          }
        });
      });

      it('Should update isActive to false if status = deactivation & isActive = true & activationHash contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashSetStatusDeactivation,
            isActive: true,
            status: OFFER_STATUS.DEACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.isActive).to.be.false;
          }
        });
      });

      it('Should update status to success if status = deactivation & isActive = true & activationHash contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashSetStatusDeactivation,
            isActive: true,
            status: OFFER_STATUS.DEACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.status).to.equal(OFFER_STATUS.SUCCESS);
          }
        });
      });

      it('Should not update isActive if status = deactivation & isActive = true & activationHash doesnt contain LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashFailed,
            isActive: true,
            status: OFFER_STATUS.DEACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.isActive).to.be.true;
          }
        });
      });

      it('Should update status to deactivationFailure if status = deactivation & isActive = true & activationHash doesnt contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashFailed,
            isActive: true,
            status: OFFER_STATUS.DEACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai
              .expect(mockOffer.status)
              .to.equal(OFFER_STATUS.DEACTIVATION_FAILURE);
          }
        });
      });
    });

    describe('Update activation in database - all', async function () {
      it('Should update orders for the all userId', async function () {
        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        chai.expect(
          res.body.some(
            (mockOffer) => mockOffer.userId === process.env.USER_ID_TEST
          )
        ).to.be.true;
        chai.expect(
          res.body.some((mockOffer) => mockOffer.userId === 'anotherUserId')
        ).to.be.true;
      });

      it('Should not modified non appropriate offers', async function () {
        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (mockOffer.userId !== 'anotherUserId') {
            chai.expect(mockOffer).to.not.have.property('notToBeModified');
          }
        });
      });

      it('Should update isActive to true if status = activation & isActive = false & activationHash contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashSetStatusActivation,
            isActive: false,
            status: OFFER_STATUS.ACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.isActive).to.be.true;
          }
        });
      });

      it('Should update status to success if status = activation & isActive = false & activationHash contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashSetStatusActivation,
            isActive: false,
            status: OFFER_STATUS.ACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.status).to.equal(OFFER_STATUS.SUCCESS);
          }
        });
      });

      it('Should not update isActive if status = activation & isActive = false & activationHash doesnt contain LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashFailed,
            isActive: false,
            status: OFFER_STATUS.ACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.isActive).to.be.false;
          }
        });
      });

      it('Should update status to activationFailure if status = activation & isActive = false & activationHash doesnt contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashFailed,
            isActive: false,
            status: OFFER_STATUS.ACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai
              .expect(mockOffer.status)
              .to.equal(OFFER_STATUS.ACTIVATION_FAILURE);
          }
        });
      });

      it('Should update isActive to false if status = deactivation & isActive = true & activationHash contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashSetStatusDeactivation,
            isActive: true,
            status: OFFER_STATUS.DEACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.isActive).to.be.false;
          }
        });
      });

      it('Should update status to success if status = deactivation & isActive = true & activationHash contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashSetStatusDeactivation,
            isActive: true,
            status: OFFER_STATUS.DEACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.status).to.equal(OFFER_STATUS.SUCCESS);
          }
        });
      });

      it('Should not update isActive if status = deactivation & isActive = true & activationHash doesnt contain LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashFailed,
            isActive: true,
            status: OFFER_STATUS.DEACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai.expect(mockOffer.isActive).to.be.true;
          }
        });
      });

      it('Should update status to deactivationFailure if status = deactivation & isActive = true & activationHash doesnt contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            activationHash: mockTxHashFailed,
            isActive: true,
            status: OFFER_STATUS.DEACTIVATION,
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);

        res.body.forEach((mockOffer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === mockOffer._id
            )
          ) {
            chai
              .expect(mockOffer.status)
              .to.equal(OFFER_STATUS.DEACTIVATION_FAILURE);
          }
        });
      });
    });
  });
});
