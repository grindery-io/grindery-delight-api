import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import sinon from 'sinon';
import {
  mockBlockchainBscTestnet,
  mockBlockchainGoerli,
  collectionBlockchains,
  collectionOffers,
  collectionOrders,
  mockOffer,
  pathViewBlockchain_Put_OrdersAll,
  pathViewBlockchain_Put_OrdersCompleteAll,
  pathViewBlockchain_Put_OrdersCompleteSeller,
  pathViewBlockchain_Put_OrdersCompleteUser,
  pathViewBlockchain_Put_OrdersUser,
  mockOrder,
} from './utils/variables.js';
import { utils_orders } from '../utils/view-blockchains-utils.js';
import { mockedToken } from './utils/utils.js';
import { ORDER_STATUS } from '../utils/orders-utils.js';

/* eslint-disable no-unused-expressions */

chai.use(chaiHttp);

let blockchainDBGoerli,
  blockchainDBBscTesnet,
  getOrderIdFromHashStub,
  isPaidOrderFromHashStub;

// Order creation
const txHashNewOrder =
  '0xfb386e3118f30aeabef6bdd379d4c16fada7acc4fd2579413721768231b90d6c';
const txHashFailed =
  '0x2290b921525f7e42dfc318e5c69527eae1ac1baa435222e3c773be84101b610d';
const orderId =
  '0x7eed0db68dde2d383b9450597aa4a76fa97360cb705f21e5166d8f034c1f42ec';

// Order payment
const txHashOrderPaid =
  '0xa1415d8bd24714ef91d7dd6d8290e6d1f822b8b20897f7642858a10dbc056ffc';
const txHashNotOrderPaid =
  '0xea914a21c9949f9185afa79865ddb651186223bffc552719e0ddb14ad24207ab';
const txHashFailedOnBSC =
  '0xf2da1f454e228f1a95398d0b1d38131cc79893a5f49b2dc94825df2cd8011bf2';

beforeEach(async function () {
  blockchainDBGoerli = await collectionBlockchains.findOne({
    chainId: mockBlockchainGoerli.chainId,
  });

  blockchainDBBscTesnet = await collectionBlockchains.findOne({
    chainId: mockBlockchainBscTestnet.chainId,
  });

  // Mocking
  getOrderIdFromHashStub = sinon
    .stub(utils_orders, 'getOrderIdFromHash')
    .callsFake(async function (_rpc, _hash) {
      return _hash === txHashNewOrder ? orderId : '';
    });

  isPaidOrderFromHashStub = sinon
    .stub(utils_orders, 'isPaidOrderFromHash')
    .callsFake(async function (_rpc, _hash) {
      const expectedIsPaidOrder = {
        [txHashOrderPaid]: true,
        [txHashNotOrderPaid]: false,
        [txHashFailedOnBSC]: false,
      };
      return expectedIsPaidOrder[_hash];
    });
});

afterEach(async function () {
  getOrderIdFromHashStub.restore();
  isPaidOrderFromHashStub.restore();
});

describe('Update orders via on-chain', async function () {
  describe('Get orderId', async function () {
    it('getOrderIdFromHash should return the proper orderId', async function () {
      chai
        .expect(
          await utils_orders.getOrderIdFromHash(
            blockchainDBGoerli.rpc[0],
            txHashNewOrder
          )
        )
        .to.equal(orderId);
    });
    it('getOrderIdFromHash should return empty string if transaction failed', async function () {
      chai
        .expect(
          await utils_orders.getOrderIdFromHash(
            blockchainDBGoerli.rpc[0],
            txHashFailed
          )
        )
        .to.equal('');
    });
  });

  describe('Update database - by userId', async function () {
    beforeEach(async function () {
      await collectionOrders.insertMany([
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.SUCCESS,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          orderId,
          userId: 'anotherUserId',
        },
      ]);
    });
    it('Should not modify orders with non pending status', async function () {
      const unmodifiedOrder = await collectionOrders.findOne({
        status: ORDER_STATUS.SUCCESS,
      });
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      const unmodifiedOrderAfter = await collectionOrders.findOne({
        _id: unmodifiedOrder._id,
      });
      chai.expect(unmodifiedOrderAfter.orderId).to.not.equal(orderId);
    });
    it('Should only modify orders for the current userId', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        chai.expect(mockOrder.userId).to.equal(process.env.USER_ID_TEST);
      });
    });
    it('Should modify mockOrder - orderId', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.hash === txHashNewOrder) {
          chai
            .expect(mockOrder.orderId)
            .to.equal(
              '0x7eed0db68dde2d383b9450597aa4a76fa97360cb705f21e5166d8f034c1f42ec'
            );
        }
      });
    });

    it('Should modify mockOrder - status', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.hash === txHashNewOrder) {
          chai.expect(mockOrder.status).to.equal(ORDER_STATUS.SUCCESS);
        }
      });
    });
    it('Should only modify status if mockOrder creation failed', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.hash === txHashFailed) {
          chai.expect(mockOrder).to.deep.equal({
            ...mockOrder,
            chainIdTokenDeposit: mockBlockchainGoerli.chainId,
            hash: txHashFailed,
            userId: process.env.USER_ID_TEST,
            status: ORDER_STATUS.FAILURE,
          });
        }
      });
    });
  });

  describe('Update database - all orders', async function () {
    beforeEach(async function () {
      await collectionOrders.insertMany([
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.SUCCESS,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: txHashNewOrder,
          orderId,
          userId: 'anotherUserId',
        },
      ]);
    });
    it('Should not modify orders with non pending status', async function () {
      const unmodifiedOrder = await collectionOrders
        .find({
          status: { $exists: true, $ne: ORDER_STATUS.PENDING },
        })
        .toArray();
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        chai.expect(
          unmodifiedOrder.every(
            (unModifOrder) => unModifOrder._id.toString() !== mockOrder._id
          )
        ).to.be.true;
      });
    });
    it('Should modify all orders', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.length).to.equal(4);
    });

    it('Should modify mockOrder - orderId', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.hash === txHashNewOrder) {
          chai
            .expect(mockOrder.orderId)
            .to.equal(
              '0x7eed0db68dde2d383b9450597aa4a76fa97360cb705f21e5166d8f034c1f42ec'
            );
        }
      });
    });

    it('Should modify mockOrder - status', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.hash === txHashNewOrder) {
          chai.expect(mockOrder.status).to.equal(ORDER_STATUS.SUCCESS);
        }
      });
    });
    it('Should only modify status if mockOrder creation failed', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.hash === txHashFailed) {
          chai.expect(mockOrder).to.deep.equal({
            ...mockOrder,
            chainIdTokenDeposit: mockBlockchainGoerli.chainId,
            hash: txHashFailed,
            userId: process.env.USER_ID_TEST,
            status: ORDER_STATUS.FAILURE,
          });
        }
      });
    });
  });

  describe('Update orders completion via on-chain', async function () {
    beforeEach(async function () {
      await collectionOffers.insertOne({
        ...mockOffer,
        chainId: mockBlockchainBscTestnet.chainId,
      });
      await collectionOrders.insertMany([
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.SUCCESS,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashNotOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: true,
          shouldNotAppear: 'shouldNotAppear',
          completionHash: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashOrderPaid,
          userId: 'anotherUserId',
        },
      ]);
    });
    describe('Capture LogOfferPaid event', async function () {
      it('Should return true for a transaction with LogOfferPaid', async function () {
        chai.expect(
          await utils_orders.isPaidOrderFromHash(
            blockchainDBBscTesnet.rpc[0],
            txHashOrderPaid
          )
        ).to.be.true;
      });
      it('Should return false for a transaction without LogOfferPaid', async function () {
        chai.expect(
          await utils_orders.isPaidOrderFromHash(
            blockchainDBBscTesnet.rpc[0],
            txHashNotOrderPaid
          )
        ).to.be.false;
      });
      it('Should return false for a transaction that failed', async function () {
        chai.expect(
          await utils_orders.isPaidOrderFromHash(
            blockchainDBBscTesnet.rpc[0],
            txHashFailedOnBSC
          )
        ).to.be.false;
      });
    });
    describe('Update completion in database - user', async function () {
      it('Should update only orders with completion status', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        const unmodifiedOrder = await collectionOrders.findOne({
          status: ORDER_STATUS.SUCCESS,
        });
        chai.expect(unmodifiedOrder.isComplete).to.be.false;
      });
      it('Should not update orders already completed', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          chai.expect(mockOrder.shouldNotAppear).to.be.undefined;
        });
      });
      it('Should update orders for the current userId', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          chai.expect(mockOrder.userId).to.equal(process.env.USER_ID_TEST);
        });
      });
      it('Should update isComplete to true for successfull transaction hash', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          if (mockOrder.completionHash !== txHashNotOrderPaid) {
            chai.expect(mockOrder.isComplete).to.be.true;
          }
        });
      });
      it('Should update status to complete for successfull transaction hash', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          if (mockOrder.completionHash !== txHashNotOrderPaid) {
            chai.expect(mockOrder.status).to.equal(ORDER_STATUS.COMPLETE);
          }
        });
      });
      it('Should update status to paymentFailure if LogOfferPaid doesnt appear', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          if (mockOrder.completionHash === txHashNotOrderPaid) {
            chai
              .expect(mockOrder.status)
              .to.equal(ORDER_STATUS.COMPLETION_FAILURE);
          }
        });
      });
      it('Should not update isComplete if LogOfferPaid doesnt appear', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          if (mockOrder.completionHash === txHashNotOrderPaid) {
            chai.expect(mockOrder.isComplete).to.be.false;
          }
        });
      });
    });
    describe('Update completion in database - all', async function () {
      it('Should not update orders already completed', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          chai.expect(mockOrder.shouldNotAppear).to.be.undefined;
        });
      });

      it('Should update only orders with completion status', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);
        const unmodifiedOrder = await collectionOrders.findOne({
          status: ORDER_STATUS.SUCCESS,
        });
        chai.expect(unmodifiedOrder.isComplete).to.be.false;
      });
      it('Should not update orders already completed', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          chai.expect(mockOrder.shouldNotAppear).to.be.undefined;
        });
      });
      it('Should update orders all userId', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);
        chai.expect(
          res.body.some(
            (mockOrder) => mockOrder.userId === process.env.USER_ID_TEST
          )
        ).to.be.true;
        chai.expect(
          res.body.some((mockOrder) => mockOrder.userId === 'anotherUserId')
        ).to.be.true;
      });
      it('Should update isComplete to true for successfull transaction hash if LogOfferPaid appears', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          if (mockOrder.completionHash !== txHashNotOrderPaid) {
            chai.expect(mockOrder.isComplete).to.be.true;
          }
        });
      });
      it('Should update status to complete for successfull transaction hash if LogOfferPaid appears', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          if (mockOrder.completionHash !== txHashNotOrderPaid) {
            chai.expect(mockOrder.status).to.equal(ORDER_STATUS.COMPLETE);
          }
        });
      });
      it('Should update status to paymentFailure if LogOfferPaid doesnt appear', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          if (mockOrder.completionHash === txHashNotOrderPaid) {
            chai
              .expect(mockOrder.status)
              .to.equal(ORDER_STATUS.COMPLETION_FAILURE);
          }
        });
      });
      it('Should not update isComplete if LogOfferPaid doesnt appear', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ apiKey: process.env.API_KEY });
        chai.expect(res).to.have.status(200);
        res.body.forEach((mockOrder) => {
          if (mockOrder.completionHash === txHashNotOrderPaid) {
            chai.expect(mockOrder.isComplete).to.be.false;
          }
        });
      });
    });
  });

  describe('Update orders completion via on-chain for seller', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...mockOffer,
          chainId: mockBlockchainBscTestnet.chainId,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOffer,
          offerId: 'anotherOfferId',
          chainId: mockBlockchainBscTestnet.chainId,
          userId: 'anotherUserId',
          shouldNotAppear: 'shouldNotAppear',
        },
        {
          ...mockOffer,
          chainId: mockBlockchainBscTestnet.chainId,
          userId: 'anotherUserId',
          shouldNotAppear: 'shouldNotAppear',
        },
      ]);
      await collectionOrders.insertMany([
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: 'anotherOfferId',
          isComplete: false,
          completionHash: txHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.SUCCESS,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashNotOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: true,
          completionHash: txHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: txHashOrderPaid,
        },
      ]);
    });
    it('Should not modify orders with non completion status', async function () {
      const unmodifiedOrder = await collectionOrders
        .find({
          status: { $exists: true, $ne: ORDER_STATUS.COMPLETION },
        })
        .toArray();
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        chai.expect(
          unmodifiedOrder.every(
            (unModifOrder) => unModifOrder._id.toString() !== mockOrder._id
          )
        ).to.be.true;
      });
    });
    it('Should not modify completed orders', async function () {
      const unmodifiedOrder = await collectionOrders
        .find({
          isComplete: true,
        })
        .toArray();
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        chai.expect(
          unmodifiedOrder.every(
            (unModifOrder) => unModifOrder._id.toString() !== mockOrder._id
          )
        ).to.be.true;
      });
    });
    it('Should only modify orders corresponding to the current liquidity provider', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      await Promise.all(
        res.body.map(async (mockOrder) => {
          const mockOffer = await collectionOffers.findOne({
            offerId: mockOrder.offerId,
          });
          chai.expect(mockOffer.userId).to.equal(process.env.USER_ID_TEST);
        })
      );
    });
    it('Should update isComplete to true for successfull transaction hash', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.completionHash !== txHashNotOrderPaid) {
          chai.expect(mockOrder.isComplete).to.be.true;
        }
      });
    });
    it('Should update status to complete for successfull transaction hash', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.completionHash !== txHashNotOrderPaid) {
          chai.expect(mockOrder.status).to.equal(ORDER_STATUS.COMPLETE);
        }
      });
    });
    it('Should update status to paymentFailure if LogOfferPaid doesnt appear', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.completionHash === txHashNotOrderPaid) {
          chai
            .expect(mockOrder.status)
            .to.equal(ORDER_STATUS.COMPLETION_FAILURE);
        }
      });
    });
    it('Should not update isComplete if LogOfferPaid doesnt appear', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.completionHash === txHashNotOrderPaid) {
          chai.expect(mockOrder.isComplete).to.be.false;
        }
      });
    });
  });
});
