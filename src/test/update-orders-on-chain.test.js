import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  blockchainBscTestnet,
  blockchainGoerli,
  collectionBlockchains,
  collectionOffers,
  collectionOrders,
  offer,
  pathViewBlockchain_Put_OrdersAll,
  pathViewBlockchain_Put_OrdersCompleteUser,
  pathViewBlockchain_Put_OrdersUser,
} from './utils/variables.js';
import {
  getAbis,
  getOrderIdFromHash,
  getOrderInformation,
  isPaidOrderFromHash,
  getProviderFromRpc,
} from '../utils/view-blockchains-utils.js';
import { ethers } from 'ethers';
import { order } from './utils/variables.js';
import { mockedToken } from './utils/utils.js';

chai.use(chaiHttp);

let blockchainDBGoerli = '';
let blockchainDBBscTesnet = '';
let GrtPoolContract = '';
let onChainOrderInfo = '';

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
const GrtPoolAddress = '0x29e2b23FF53E6702FDFd8C8EBC0d9E1cE44d241A';

// Order payment
const txHashOrderPaid =
  '0xa1415d8bd24714ef91d7dd6d8290e6d1f822b8b20897f7642858a10dbc056ffc';
const txHashNotOrderPaid =
  '0xea914a21c9949f9185afa79865ddb651186223bffc552719e0ddb14ad24207ab';
const GrtLiquidityWallet = '0x4ffd49c7832870be704143a10049970670ff8d01';

beforeEach(async function () {
  await collectionBlockchains.insertOne(blockchainGoerli);
  blockchainDBGoerli = await collectionBlockchains.findOne({
    chainId: blockchainGoerli.chainId,
  });

  await collectionBlockchains.insertOne(blockchainBscTestnet);
  blockchainDBBscTesnet = await collectionBlockchains.findOne({
    chainId: blockchainBscTestnet.chainId,
  });

  GrtPoolContract = new ethers.Contract(
    GrtPoolAddress,
    abis.poolAbi,
    getProviderFromRpc(blockchainDBGoerli.rpc[0])
  );
});

describe('Update orders via on-chain', async function () {
  describe('Get orderId', async function () {
    it('getOrderIdFromHash should return the proper orderId', async function () {
      chai
        .expect(
          await getOrderIdFromHash(blockchainDBGoerli.rpc[0], txHashNewOrder)
        )
        .to.equal(orderId);
    });
    it('getOrderIdFromHash should return empty string if transaction failed', async function () {
      chai
        .expect(
          await getOrderIdFromHash(blockchainDBGoerli.rpc[0], txHashFailed)
        )
        .to.equal('');
    });
  });
  describe('Order informations', async function () {
    it('Should return the proper deposited amount', async function () {
      chai
        .expect(
          (await getOrderInformation(GrtPoolContract, orderId)).depositAmount
        )
        .to.equal('0.001');
    });
    it('Should return the proper deposited token', async function () {
      chai
        .expect(
          (await getOrderInformation(GrtPoolContract, orderId)).depositToken
        )
        .to.equal('0x0000000000000000000000000000000000000000');
    });
    it('Should return the proper deposit chainId', async function () {
      chai
        .expect(
          (await getOrderInformation(GrtPoolContract, orderId)).depositChainId
        )
        .to.equal('5');
    });
    it('Should return the proper destination address', async function () {
      chai
        .expect((await getOrderInformation(GrtPoolContract, orderId)).destAddr)
        .to.equal('0x0cBB9CCA778De38d48F1795E6B8C7E8C8FFAe59B');
    });
    it('Should return the proper offerId', async function () {
      chai
        .expect((await getOrderInformation(GrtPoolContract, orderId)).offerId)
        .to.equal(offerId);
    });
    it('Should return the offer amount', async function () {
      chai
        .expect(
          (await getOrderInformation(GrtPoolContract, orderId)).amountTokenOffer
        )
        .to.equal('1.0');
    });
  });
  describe('Update database - by userId', async function () {
    beforeEach(async function () {
      await collectionOrders.insertMany([
        {
          ...order,
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          chainId: blockchainGoerli.chainId,
          hash: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          chainId: blockchainGoerli.chainId,
          orderId: orderId,
          userId: 'anotherUserId',
        },
      ]);
      onChainOrderInfo = await getOrderInformation(GrtPoolContract, orderId);
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
            .to.equal(onChainOrderInfo.depositAmount);
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
            .to.equal(onChainOrderInfo.depositToken);
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
            .to.equal(onChainOrderInfo.depositChainId);
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
          chai.expect(order.status).to.equal('success');
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
            chainId: blockchainGoerli.chainId,
            hash: txHashFailed,
            userId: process.env.USER_ID_TEST,
            status: 'failure',
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
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          chainId: blockchainGoerli.chainId,
          hash: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOrder,
          orderId: orderId,
          userId: 'anotherUserId',
        },
      ]);
      onChainOrderInfo = await getOrderInformation(GrtPoolContract, orderId);
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
            .to.equal(onChainOrderInfo.depositAmount);
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
            .to.equal(onChainOrderInfo.depositToken);
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
            .to.equal(onChainOrderInfo.depositChainId);
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
          chai.expect(order.status).to.equal('success');
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
            chainId: blockchainGoerli.chainId,
            hash: txHashFailed,
            userId: process.env.USER_ID_TEST,
            status: 'failure',
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
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          offerId: offer.offerId,
          isComplete: false,
          hashCompletion: txHashNotOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          offerId: offer.offerId,
          isComplete: true,
          shouldNotAppear: 'shouldNotAppear',
          hashCompletion: txHashOrderPaid,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
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
          await isPaidOrderFromHash(
            blockchainDBBscTesnet.rpc[0],
            txHashOrderPaid
          )
        ).to.be.true;
      });

      it('Should return false for a transaction without LogOfferPaid', async function () {
        chai.expect(
          await isPaidOrderFromHash(
            blockchainDBBscTesnet.rpc[0],
            txHashNotOrderPaid
          )
        ).to.be.false;
      });
    });

    describe('Update completion in database', async function () {
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
          if (order.hashCompletion !== txHashNotOrderPaid) {
            chai.expect(order.userId).to.equal(process.env.USER_ID_TEST);
          }
        });
      });

      it('Should update isComplete to true', async function () {
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

      it('Should update status to complete', async function () {
        const res = await chai
          .request(app)
          .put(pathViewBlockchain_Put_OrdersCompleteUser)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(res).to.have.status(200);

        res.body.forEach((order) => {
          if (order.hashCompletion !== txHashNotOrderPaid) {
            chai.expect(order.status).to.equal('complete');
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
            chai.expect(order.status).to.equal('paymentFailure');
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

      // it('Should update status to complete', async function () {
      //   const res = await chai
      //     .request(app)
      //     .put(pathViewBlockchain_Put_OrdersCompleteUser)
      //     .set('Authorization', `Bearer ${mockedToken}`);
      //   chai.expect(res).to.have.status(200);

      //   res.body.forEach((order) => {
      //     chai.expect(order.status).to.equal('complete');
      //   });
      // });
    });
  });
});
