import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  blockchainGoerli,
  collectionBlockchains,
  collectionOrders,
  pathViewBlockchain_Put_OrdersUser,
} from './utils/variables.js';
import {
  getAbis,
  getOrderIdFromHash,
  getOrderInformation,
  getProviderFromRpc,
} from '../utils/view-blockchains-utils.js';
import { ethers } from 'ethers';
import { order } from './utils/variables.js';
import { mockedToken } from './utils/utils.js';

chai.use(chaiHttp);

let blockchainDB = '';
let GrtPoolContract = '';

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

beforeEach(async function () {
  await collectionBlockchains.insertOne(blockchainGoerli);
  blockchainDB = await collectionBlockchains.findOne({});

  GrtPoolContract = new ethers.Contract(
    GrtPoolAddress,
    abis.poolAbi,
    getProviderFromRpc(blockchainDB.rpc[0])
  );
});

describe('Update orders via on-chain', async function () {
  describe('Get orderId', async function () {
    it('getOrderIdFromHash should return the proper orderId', async function () {
      chai
        .expect(await getOrderIdFromHash(blockchainDB.rpc[0], txHashNewOrder))
        .to.equal(orderId);
    });

    it('getOrderIdFromHash should return empty string if transaction failed', async function () {
      chai
        .expect(await getOrderIdFromHash(blockchainDB.rpc[0], txHashFailed))
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
    });

    it('Should only modify orders for the current userId', async function () {
      const res = await chai
        .request(app)
        .put(pathViewBlockchain_Put_OrdersUser)
        .set('Authorization', `Bearer ${mockedToken}`);

      res.body.forEach((order) => {
        chai.expect(order.userId).to.equal(process.env.USER_ID_TEST);
      });
    });
  });
});
