import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  blockchainGoerli,
  collectionBlockchains,
  collectionOffers,
  offer,
  pathBlockchain_Put_OffersAll,
  pathBlockchain_Put_OffersUser,
} from './utils/variables.js';
import {
  getAbis,
  getOfferIdFromHash,
  getProviderFromRpc,
} from '../utils/view-blockchains-utils.js';
import { ethers } from 'ethers';
import { mockedToken } from './utils/utils.js';

chai.use(chaiHttp);

let blockchainDBGoerli = '';
let GrtPoolContract = '';

// Offer creation
const txHashNewOffer =
  '0xfe1f2afc7884bd16bf2acd2c9d3daa4c2e8b2e9911c68efd7d6a365074cb69fa';
const txHashFailed =
  '0x2290b921525f7e42dfc318e5c69527eae1ac1baa435222e3c773be84101b610d';
const offerId =
  '0x92db381c118cbbc9b30b39d3bf5c234a49ad01eec17b327250d0812f08d307f9';
const abis = await getAbis();
const GrtPoolAddress = '0x29e2b23FF53E6702FDFd8C8EBC0d9E1cE44d241A';

beforeEach(async function () {
  await collectionBlockchains.insertOne(blockchainGoerli);
  blockchainDBGoerli = await collectionBlockchains.findOne({
    chainId: blockchainGoerli.chainId,
  });

  GrtPoolContract = new ethers.Contract(
    GrtPoolAddress,
    abis.poolAbi,
    getProviderFromRpc(blockchainDBGoerli.rpc[0])
  );
});

describe('Update offers via on-chain', async function () {
  describe('Get offerId', async function () {
    it('getOfferIdFromHash should return the proper offerId', async function () {
      chai
        .expect(
          await getOfferIdFromHash(blockchainDBGoerli.rpc[0], txHashNewOffer)
        )
        .to.equal(offerId);
    });

    it('getOfferIdFromHash should return empty string if transaction failed', async function () {
      chai
        .expect(
          await getOfferIdFromHash(blockchainDBGoerli.rpc[0], txHashFailed)
        )
        .to.equal('');
    });
  });

  describe('Update database - by userId', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...offer,
          status: 'pending',
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          status: 'pending',
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          status: 'success',
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          status: 'pending',
          chainId: blockchainGoerli.chainId,
          hash: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          status: 'pending',
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOffer,
          userId: 'anotherUserId',
        },
      ]);
    });

    it('Should not modify offers with non pending status', async function () {
      const unmodifiedOffer = await collectionOffers.findOne({
        status: 'success',
      });

      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      const unmodifiedOfferAfter = await collectionOffers.findOne({
        _id: unmodifiedOffer._id,
      });
      chai.expect(unmodifiedOfferAfter.offerId).to.not.equal(offerId);
    });

    it('Should only modify offers for the current userId', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((offer) => {
        chai.expect(offer.userId).to.equal(process.env.USER_ID_TEST);
      });
    });

    it('Should modify offer - offerId', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((offer) => {
        if (offer.hash == txHashNewOffer) {
          chai.expect(offer.offerId).to.equal(offerId);
        }
      });
    });

    it('Should modify offer status to succes if new Offer', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((offer) => {
        if (offer.hash == txHashNewOffer) {
          chai.expect(offer.status).to.equal('success');
        }
      });
    });

    it('Should modify offer status to failure if no new Offer', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((offer) => {
        if (offer.hash == txHashFailed) {
          chai.expect(offer.status).to.equal('failure');
        }
      });
    });
  });

  describe('Update database - All', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...offer,
          status: 'pending',
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          status: 'pending',
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          status: 'success',
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          status: 'pending',
          chainId: blockchainGoerli.chainId,
          hash: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          status: 'pending',
          chainId: blockchainGoerli.chainId,
          hash: txHashNewOffer,
          userId: 'anotherUserId',
        },
      ]);
    });

    it('Should not modify offers with non pending status', async function () {
      const unmodifiedOffer = await collectionOffers.findOne({
        status: 'success',
      });

      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      const unmodifiedOfferAfter = await collectionOffers.findOne({
        _id: unmodifiedOffer._id,
      });
      chai.expect(unmodifiedOfferAfter.offerId).to.not.equal(offerId);
    });

    it('Should only modify all offers', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      chai.expect(
        res.body.some((offer) => offer.userId === process.env.USER_ID_TEST)
      ).to.be.true;
      chai.expect(res.body.some((offer) => offer.userId === 'anotherUserId')).to
        .be.true;
    });

    it('Should modify offer - offerId', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((offer) => {
        if (offer.hash == txHashNewOffer) {
          chai.expect(offer.offerId).to.equal(offerId);
        }
      });
    });

    it('Should modify offer status to succes if new Offer', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((offer) => {
        if (offer.hash == txHashNewOffer) {
          chai.expect(offer.status).to.equal('success');
        }
      });
    });

    it('Should modify offer status to failure if no new Offer', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersAll)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);
      res.body.forEach((offer) => {
        if (offer.hash == txHashFailed) {
          chai.expect(offer.status).to.equal('failure');
        }
      });
    });
  });
});
