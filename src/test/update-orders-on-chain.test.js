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
const mockTxHashNewOrder = 'successNewOrderHash';
const mockTxHashFailed = 'failureNewOrderHash';
const mockOrderId = 'onChainOrderId';

// Order payment
const mockTxHashOrderPaid = 'successOrderPaid';
const mockTxHashNotOrderPayment = 'nonOrderPaymentTransaction';
const mockTxHashPaymentFailure = 'failureOrderPaid';

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
      return _hash === mockTxHashNewOrder ? mockOrderId : '';
    });

  isPaidOrderFromHashStub = sinon
    .stub(utils_orders, 'isPaidOrderFromHash')
    .callsFake(async function (_rpc, _hash) {
      const expectedIsPaidOrder = {
        [mockTxHashOrderPaid]: true,
        [mockTxHashNotOrderPayment]: false,
        [mockTxHashPaymentFailure]: false,
      };
      return expectedIsPaidOrder[_hash];
    });
});

afterEach(async function () {
  getOrderIdFromHashStub.restore();
  isPaidOrderFromHashStub.restore();
});

describe('Update orders via on-chain', async function () {
  describe('Get mockOrderId', async function () {
    it('getOrderIdFromHash should return the proper mockOrderId', async function () {
      chai
        .expect(
          await utils_orders.getOrderIdFromHash(
            blockchainDBGoerli.rpc[0],
            mockTxHashNewOrder
          )
        )
        .to.equal(mockOrderId);
    });
    it('getOrderIdFromHash should return empty string if transaction failed', async function () {
      chai
        .expect(
          await utils_orders.getOrderIdFromHash(
            blockchainDBGoerli.rpc[0],
            mockTxHashFailed
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
          hash: mockTxHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.SUCCESS,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: mockTxHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          mockOrderId,
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
      chai.expect(unmodifiedOrderAfter.orderId).to.not.equal(mockOrderId);
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
    it('Should modify mockOrder - mockOrderId', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.hash === mockTxHashNewOrder) {
          chai.expect(mockOrder.orderId).to.equal(mockOrderId);
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
        if (mockOrder.hash === mockTxHashNewOrder) {
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
        if (mockOrder.hash === mockTxHashFailed) {
          chai.expect(mockOrder).to.deep.equal({
            ...mockOrder,
            chainIdTokenDeposit: mockBlockchainGoerli.chainId,
            hash: mockTxHashFailed,
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
          hash: mockTxHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.SUCCESS,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: mockTxHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: mockBlockchainGoerli.chainId,
          hash: mockTxHashNewOrder,
          mockOrderId,
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

    it('Should modify mockOrder - mockOrderId', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({ apiKey: process.env.API_KEY });
      chai.expect(res).to.have.status(200);
      res.body.forEach((mockOrder) => {
        if (mockOrder.hash === mockTxHashNewOrder) {
          chai.expect(mockOrder.orderId).to.equal(mockOrderId);
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
        if (mockOrder.hash === mockTxHashNewOrder) {
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
        if (mockOrder.hash === mockTxHashFailed) {
          chai.expect(mockOrder).to.deep.equal({
            ...mockOrder,
            chainIdTokenDeposit: mockBlockchainGoerli.chainId,
            hash: mockTxHashFailed,
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
          completionHash: mockTxHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.SUCCESS,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: mockTxHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: mockTxHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: mockTxHashNotOrderPayment,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: true,
          shouldNotAppear: 'shouldNotAppear',
          completionHash: mockTxHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: mockTxHashOrderPaid,
          userId: 'anotherUserId',
        },
      ]);
    });
    describe('Capture LogOfferPaid event', async function () {
      it('Should return true for a transaction with LogOfferPaid', async function () {
        chai.expect(
          await utils_orders.isPaidOrderFromHash(
            blockchainDBBscTesnet.rpc[0],
            mockTxHashOrderPaid
          )
        ).to.be.true;
      });
      it('Should return false for a transaction without LogOfferPaid', async function () {
        chai.expect(
          await utils_orders.isPaidOrderFromHash(
            blockchainDBBscTesnet.rpc[0],
            mockTxHashNotOrderPayment
          )
        ).to.be.false;
      });
      it('Should return false for a transaction that failed', async function () {
        chai.expect(
          await utils_orders.isPaidOrderFromHash(
            blockchainDBBscTesnet.rpc[0],
            mockTxHashPaymentFailure
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
          if (mockOrder.completionHash !== mockTxHashNotOrderPayment) {
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
          if (mockOrder.completionHash !== mockTxHashNotOrderPayment) {
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
          if (mockOrder.completionHash === mockTxHashNotOrderPayment) {
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
          if (mockOrder.completionHash === mockTxHashNotOrderPayment) {
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
          if (mockOrder.completionHash !== mockTxHashNotOrderPayment) {
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
          if (mockOrder.completionHash !== mockTxHashNotOrderPayment) {
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
          if (mockOrder.completionHash === mockTxHashNotOrderPayment) {
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
          if (mockOrder.completionHash === mockTxHashNotOrderPayment) {
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
          completionHash: mockTxHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: 'anotherOfferId',
          isComplete: false,
          completionHash: mockTxHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.SUCCESS,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: mockTxHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: mockTxHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: mockTxHashNotOrderPayment,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: true,
          completionHash: mockTxHashOrderPaid,
        },
        {
          ...mockOrder,
          status: ORDER_STATUS.COMPLETION,
          offerId: mockOffer.offerId,
          isComplete: false,
          completionHash: mockTxHashOrderPaid,
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
        if (mockOrder.completionHash !== mockTxHashNotOrderPayment) {
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
        if (mockOrder.completionHash !== mockTxHashNotOrderPayment) {
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
        if (mockOrder.completionHash === mockTxHashNotOrderPayment) {
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
        if (mockOrder.completionHash === mockTxHashNotOrderPayment) {
          chai.expect(mockOrder.isComplete).to.be.false;
        }
      });
    });
  });
});
