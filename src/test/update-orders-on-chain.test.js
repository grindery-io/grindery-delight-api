import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import sinon from 'sinon';
import {
  GrtPoolAddressGoerli,
  blockchainBscTestnet,
  blockchainGoerli,
  collectionBlockchains,
  collectionOffers,
  collectionOrders,
  offer,
  orderInformationOnChain,
  pathViewBlockchain_Put_OrdersAll,
  pathViewBlockchain_Put_OrdersCompleteAll,
  pathViewBlockchain_Put_OrdersCompleteSeller,
  pathViewBlockchain_Put_OrdersCompleteUser,
  pathViewBlockchain_Put_OrdersUser,
} from './utils/variables.js';
import {
  getAbis,
  getProviderFromRpc,
  utils_orders,
} from '../utils/view-blockchains-utils.js';
import { ethers } from 'ethers';
import { order } from './utils/variables.js';
import { mockedToken } from './utils/utils.js';
import { ORDER_STATUS } from '../utils/orders-utils.js';

chai.use(chaiHttp);

let blockchainDBGoerli,
  blockchainDBBscTesnet,
  GrtPoolContract,
  onChainOrderInfo,
  getOrderIdFromHashStub,
  getOrderInformationStub,
  isPaidOrderFromHashStub;

// Order creation
const txHashNewOrder =
  '0xfb386e3118f30aeabef6bdd379d4c16fada7acc4fd2579413721768231b90d6c';
const txHashFailed =
  '0x2290b921525f7e42dfc318e5c69527eae1ac1baa435222e3c773be84101b610d';
const orderId =
  '0x7eed0db68dde2d383b9450597aa4a76fa97360cb705f21e5166d8f034c1f42ec';
const offerId =
  '0x7eed0db68dde2d383b9450597aa4a76fa97360cb705f21e5166d8f034c1f42ec';
const abis = await getAbis();

// Order payment
const txHashOrderPaid =
  '0xa1415d8bd24714ef91d7dd6d8290e6d1f822b8b20897f7642858a10dbc056ffc';
const txHashNotOrderPaid =
  '0xea914a21c9949f9185afa79865ddb651186223bffc552719e0ddb14ad24207ab';
const txHashFailedOnBSC =
  '0xf2da1f454e228f1a95398d0b1d38131cc79893a5f49b2dc94825df2cd8011bf2';

beforeEach(async function () {
  await collectionBlockchains.insertOne({
    ...blockchainGoerli,
    usefulAddresses: { grtPoolAddress: GrtPoolAddressGoerli },
  });
  blockchainDBGoerli = await collectionBlockchains.findOne({
    chainId: blockchainGoerli.chainId,
  });

  await collectionBlockchains.insertOne(blockchainBscTestnet);
  blockchainDBBscTesnet = await collectionBlockchains.findOne({
    chainId: blockchainBscTestnet.chainId,
  });

  GrtPoolContract = new ethers.Contract(
    GrtPoolAddressGoerli,
    abis.poolAbi,
    getProviderFromRpc(blockchainDBGoerli.rpc[0])
  );

  // Mocking
  getOrderIdFromHashStub = sinon
    .stub(utils_orders, 'getOrderIdFromHash')
    .callsFake(async function (_rpc, _hash) {
      const expectedOrderId = {
        [txHashNewOrder]: orderId,
        [txHashFailed]: '',
      };
      return expectedOrderId[_hash];
    });

  getOrderInformationStub = sinon
    .stub(utils_orders, 'getOrderInformation')
    .callsFake(async function (_contract, _orderId) {
      const expectedOrderInfo = {
        [orderId]: orderInformationOnChain,
      };
      return expectedOrderInfo[_orderId];
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
  getOrderInformationStub.restore();
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

  describe('Order informations', async function () {
    it('Should return the proper deposited amount', async function () {
      chai
        .expect(
          (await utils_orders.getOrderInformation(GrtPoolContract, orderId))
            .amountTokenDeposit
        )
        .to.equal('0.001');
    });
    it('Should return the proper deposited token', async function () {
      chai
        .expect(
          (await utils_orders.getOrderInformation(GrtPoolContract, orderId))
            .addressTokenDeposit
        )
        .to.equal('0x0000000000000000000000000000000000000000');
    });
    it('Should return the proper deposit chainId', async function () {
      chai
        .expect(
          (await utils_orders.getOrderInformation(GrtPoolContract, orderId))
            .chainIdTokenDeposit
        )
        .to.equal('5');
    });
    it('Should return the proper destination address', async function () {
      chai
        .expect(
          (await utils_orders.getOrderInformation(GrtPoolContract, orderId))
            .destAddr
        )
        .to.equal('0x0cBB9CCA778De38d48F1795E6B8C7E8C8FFAe59B');
    });
    it('Should return the proper offerId', async function () {
      chai
        .expect(
          (await utils_orders.getOrderInformation(GrtPoolContract, orderId))
            .offerId
        )
        .to.equal(offerId);
    });
    it('Should return the offer amount', async function () {
      chai
        .expect(
          (await utils_orders.getOrderInformation(GrtPoolContract, orderId))
            .amountTokenOffer
        )
        .to.equal('1.0');
    });
  });

  describe('Update database - by userId', async function () {
    beforeEach(async function () {
      await collectionOrders.insertMany([
        {
          ...order,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.SUCCESS,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          hash: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          orderId: orderId,
          userId: 'anotherUserId',
        },
      ]);
      onChainOrderInfo = await utils_orders.getOrderInformation(
        GrtPoolContract,
        orderId
      );
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
      res.body.forEach((order) => {
        chai.expect(order.userId).to.equal(process.env.USER_ID_TEST);
      });
    });
    it('Should modify order - orderId', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai
            .expect(order.orderId)
            .to.equal(
              '0x7eed0db68dde2d383b9450597aa4a76fa97360cb705f21e5166d8f034c1f42ec'
            );
        }
      });
    });
    it('Should modify order - amountTokenDeposit', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai
            .expect(order.amountTokenDeposit)
            .to.equal(onChainOrderInfo.amountTokenDeposit);
        }
      });
    });
    it('Should modify order - addressTokenDeposit', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai
            .expect(order.addressTokenDeposit)
            .to.equal(onChainOrderInfo.addressTokenDeposit);
        }
      });
    });
    it('Should modify order - chainIdTokenDeposit', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai
            .expect(order.chainIdTokenDeposit)
            .to.equal(onChainOrderInfo.chainIdTokenDeposit);
        }
      });
    });
    it('Should modify order - destAddr', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai.expect(order.destAddr).to.equal(onChainOrderInfo.destAddr);
        }
      });
    });
    it('Should modify order - offerId', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai.expect(order.offerId).to.equal(onChainOrderInfo.offerId);
        }
      });
    });
    it('Should modify order - amountTokenOffer', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai
            .expect(order.amountTokenOffer)
            .to.equal(onChainOrderInfo.amountTokenOffer);
        }
      });
    });
    it('Should modify order - status', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai.expect(order.status).to.equal(ORDER_STATUS.SUCCESS);
        }
      });
    });
    it('Should only modify status if order creation failed', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashFailed) {
          chai.expect(order).to.deep.equal({
            ...order,
            chainIdTokenDeposit: blockchainGoerli.chainId,
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
          ...order,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.SUCCESS,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          hash: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.PENDING,
          chainIdTokenDeposit: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          orderId: orderId,
          userId: 'anotherUserId',
        },
      ]);
      onChainOrderInfo = await utils_orders.getOrderInformation(
        GrtPoolContract,
        orderId
      );
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
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        chai.expect(
          unmodifiedOrder.every(
            (unModifOrder) => unModifOrder._id.toString() !== order._id
          )
        ).to.be.true;
      });
    });
    it('Should modify all orders', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.length).to.equal(4);
    });
    it('Should modify order - amountTokenDeposit', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai
            .expect(order.amountTokenDeposit)
            .to.equal(onChainOrderInfo.amountTokenDeposit);
        }
      });
    });
    it('Should modify order - addressTokenDeposit', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai
            .expect(order.addressTokenDeposit)
            .to.equal(onChainOrderInfo.addressTokenDeposit);
        }
      });
    });
    it('Should modify order - chainIdTokenDeposit', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai
            .expect(order.chainIdTokenDeposit)
            .to.equal(onChainOrderInfo.chainIdTokenDeposit);
        }
      });
    });
    it('Should modify order - destAddr', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai.expect(order.destAddr).to.equal(onChainOrderInfo.destAddr);
        }
      });
    });
    it('Should modify order - offerId', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai.expect(order.offerId).to.equal(onChainOrderInfo.offerId);
        }
      });
    });
    it('Should modify order - amountTokenOffer', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai
            .expect(order.amountTokenOffer)
            .to.equal(onChainOrderInfo.amountTokenOffer);
        }
      });
    });
    it('Should modify order - status', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashNewOrder) {
          chai.expect(order.status).to.equal(ORDER_STATUS.SUCCESS);
        }
      });
    });
    it('Should only modify status if order creation failed', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hash == txHashFailed) {
          chai.expect(order).to.deep.equal({
            ...order,
            chainIdTokenDeposit: blockchainGoerli.chainId,
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
        ...offer,
        chainId: blockchainBscTestnet.chainId,
      });
      await collectionOrders.insertMany([
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.SUCCESS,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashNotOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: true,
          shouldNotAppear: 'shouldNotAppear',
          hashCompletion: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
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
        res.body.forEach((order) => {
          chai.expect(order.shouldNotAppear).to.be.undefined;
        });
      });
      it('Should update orders for the current userId', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          chai.expect(order.userId).to.equal(process.env.USER_ID_TEST);
        });
      });
      it('Should update isComplete to true for successfull transaction hash', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          if (order.hashCompletion !== txHashNotOrderPaid) {
            chai.expect(order.isComplete).to.be.true;
          }
        });
      });
      it('Should update status to complete for successfull transaction hash', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          if (order.hashCompletion !== txHashNotOrderPaid) {
            chai.expect(order.status).to.equal(ORDER_STATUS.COMPLETE);
          }
        });
      });
      it('Should update status to paymentFailure if LogOfferPaid doesnt appear', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          if (order.hashCompletion === txHashNotOrderPaid) {
            chai.expect(order.status).to.equal(ORDER_STATUS.COMPLETION_FAILURE);
          }
        });
      });
      it('Should not update isComplete if LogOfferPaid doesnt appear', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          if (order.hashCompletion === txHashNotOrderPaid) {
            chai.expect(order.isComplete).to.be.false;
          }
        });
      });
    });
    describe('Update completion in database - all', async function () {
      it('Should update only orders with completion status', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
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
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          chai.expect(order.shouldNotAppear).to.be.undefined;
        });
      });
      it('Should update orders all userId', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        chai.expect(
          res.body.some((order) => order.userId === process.env.USER_ID_TEST)
        ).to.be.true;
        chai.expect(res.body.some((order) => order.userId === 'anotherUserId'))
          .to.be.true;
      });
      it('Should update isComplete to true for successfull transaction hash if LogOfferPaid appears', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          if (order.hashCompletion !== txHashNotOrderPaid) {
            chai.expect(order.isComplete).to.be.true;
          }
        });
      });
      it('Should update status to complete for successfull transaction hash if LogOfferPaid appears', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          if (order.hashCompletion !== txHashNotOrderPaid) {
            chai.expect(order.status).to.equal(ORDER_STATUS.COMPLETE);
          }
        });
      });
      it('Should update status to paymentFailure if LogOfferPaid doesnt appear', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          if (order.hashCompletion === txHashNotOrderPaid) {
            chai.expect(order.status).to.equal(ORDER_STATUS.COMPLETION_FAILURE);
          }
        });
      });
      it('Should not update isComplete if LogOfferPaid doesnt appear', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteAll)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);
        res.body.forEach((order) => {
          if (order.hashCompletion === txHashNotOrderPaid) {
            chai.expect(order.isComplete).to.be.false;
          }
        });
      });
    });
  });
  describe('Update orders completion via on-chain for seller', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...offer,
          chainId: blockchainBscTestnet.chainId,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          offerId: 'anotherOfferId',
          chainId: blockchainBscTestnet.chainId,
          userId: 'anotherUserId',
          shouldNotAppear: 'shouldNotAppear',
        },
        {
          ...offer,
          chainId: blockchainBscTestnet.chainId,
          userId: 'anotherUserId',
          shouldNotAppear: 'shouldNotAppear',
        },
      ]);
      await collectionOrders.insertMany([
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
        },
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: 'anotherOfferId',
          isComplete: false,
          hashCompletion: txHashOrderPaid,
        },
        {
          ...order,
          status: ORDER_STATUS.SUCCESS,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
        },
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
        },
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashNotOrderPaid,
        },
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: true,
          hashCompletion: txHashOrderPaid,
        },
        {
          ...order,
          status: ORDER_STATUS.COMPLETION,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
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
      res.body.forEach((order) => {
        chai.expect(
          unmodifiedOrder.every(
            (unModifOrder) => unModifOrder._id.toString() !== order._id
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
      res.body.forEach((order) => {
        chai.expect(
          unmodifiedOrder.every(
            (unModifOrder) => unModifOrder._id.toString() !== order._id
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
        res.body.map(async (order) => {
          const offer = await collectionOffers.findOne({
            offerId: order.offerId,
          });
          chai.expect(offer.userId).to.equal(process.env.USER_ID_TEST);
        })
      );
    });
    it('Should update isComplete to true for successfull transaction hash', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hashCompletion !== txHashNotOrderPaid) {
          chai.expect(order.isComplete).to.be.true;
        }
      });
    });
    it('Should update status to complete for successfull transaction hash', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hashCompletion !== txHashNotOrderPaid) {
          chai.expect(order.status).to.equal(ORDER_STATUS.COMPLETE);
        }
      });
    });
    it('Should update status to paymentFailure if LogOfferPaid doesnt appear', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hashCompletion === txHashNotOrderPaid) {
          chai.expect(order.status).to.equal(ORDER_STATUS.COMPLETION_FAILURE);
        }
      });
    });
    it('Should not update isComplete if LogOfferPaid doesnt appear', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersCompleteSeller)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((order) => {
        if (order.hashCompletion === txHashNotOrderPaid) {
          chai.expect(order.isComplete).to.be.false;
        }
      });
    });
  });
});
