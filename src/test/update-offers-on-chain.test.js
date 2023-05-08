import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  GrtPoolAddressGoerli,
  blockchainGoerli,
  collectionBlockchains,
  collectionOffers,
  offer,
  pathBlockchain_Put_OffersActivationUser,
  pathBlockchain_Put_OffersActivationAll,
  pathBlockchain_Put_OffersAll,
  pathBlockchain_Put_OffersUser,
  updateOfferBody,
} from './utils/variables.js';
import {
  getAbis,
  getOfferIdFromHash,
  getProviderFromRpc,
  isSetStatusFromHash,
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
const txHashSetStatusActivation =
  '0x45af22dcc2eac8ef2097c5a983ee30cb9ef1aae49321d3f4e291e195280921ee';
const txHashSetStatusDeactivation =
  '0x5e01b250b748c6db3344d70d9f3b20aa1f88f6e1d33ed0ff60360d6dfe2fef89';
const offerId =
  '0x92db381c118cbbc9b30b39d3bf5c234a49ad01eec17b327250d0812f08d307f9';
const abis = await getAbis();

beforeEach(async function () {
  await collectionBlockchains.insertOne({ ...blockchainGoerli });
  blockchainDBGoerli = await collectionBlockchains.findOne({
    chainId: blockchainGoerli.chainId,
  });

  GrtPoolContract = new ethers.Contract(
    GrtPoolAddressGoerli,
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
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
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
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
      chai.expect(res).to.have.status(200);
      res.body.forEach((offer) => {
        chai.expect(offer.userId).to.equal(process.env.USER_ID_TEST);
      });
    });

    it('Should modify offer - offerId', async function () {
      const res = await chai
        .request(app)
        .put(pathBlockchain_Put_OffersUser)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
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
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
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
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
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
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
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
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
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
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
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
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
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
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(updateOfferBody);
      chai.expect(res).to.have.status(200);
      res.body.forEach((offer) => {
        if (offer.hash == txHashFailed) {
          chai.expect(offer.status).to.equal('failure');
        }
      });
    });
  });

  describe('Update offers activation', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        {
          ...offer,
          chainId: blockchainDBGoerli.chainId,
          status: 'activation',
          isActive: false,
          hashActivation: txHashSetStatusActivation,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          chainId: blockchainDBGoerli.chainId,
          status: 'deactivation',
          isActive: true,
          hashActivation: txHashSetStatusDeactivation,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          chainId: blockchainDBGoerli.chainId,
          status: 'activation',
          isActive: false,
          hashActivation: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          chainId: blockchainDBGoerli.chainId,
          status: 'deactivation',
          isActive: true,
          hashActivation: txHashFailed,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          chainId: blockchainDBGoerli.chainId,
          status: 'activation',
          isActive: false,
          hashActivation: txHashNewOffer,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...offer,
          chainId: blockchainDBGoerli.chainId,
          status: 'activation',
          isActive: true,
          hashActivation: txHashSetStatusActivation,
          userId: process.env.USER_ID_TEST,
          notToBeModified: 'notToBeModified',
        },
        {
          ...offer,
          chainId: blockchainDBGoerli.chainId,
          status: 'deactivation',
          isActive: false,
          hashActivation: txHashSetStatusActivation,
          userId: process.env.USER_ID_TEST,
          notToBeModified: 'notToBeModified',
        },
        {
          ...offer,
          chainId: blockchainDBGoerli.chainId,
          status: 'activation',
          isActive: false,
          offerId: '',
          hashActivation: txHashSetStatusActivation,
          userId: process.env.USER_ID_TEST,
          notToBeModified: 'notToBeModified',
        },
        {
          ...offer,
          chainId: blockchainDBGoerli.chainId,
          status: 'activation',
          isActive: false,
          hashActivation: txHashFailed,
          userId: 'anotherUserId',
          notToBeModified: 'notToBeModified',
        },
      ]);
    });

    describe('Capture LogSetStatusOffer event', async function () {
      it('Should return true for a transaction with LogSetStatusOffer', async function () {
        chai
          .expect(
            await isSetStatusFromHash(
              blockchainDBGoerli.rpc[0],
              txHashSetStatusActivation
            )
          )
          .to.deep.equal({ isSetStatus: true, isActive: true });
      });

      it('Should return false for a transaction without LogSetStatusOffer', async function () {
        await isSetStatusFromHash(blockchainDBGoerli.rpc[0], txHashNewOffer);
        chai
          .expect(
            await isSetStatusFromHash(blockchainDBGoerli.rpc[0], txHashNewOffer)
          )
          .to.deep.equal({ isSetStatus: false, isActive: undefined });
      });

      it('Should return false for a transaction that failed', async function () {
        chai
          .expect(
            await isSetStatusFromHash(blockchainDBGoerli.rpc[0], txHashFailed)
          )
          .to.deep.equal({ isSetStatus: false, isActive: undefined });
      });
    });

    describe('Update activation in database - user', async function () {
      it('Should update orders for the current userId', async function () {
        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          chai.expect(offer.userId).to.equal(process.env.USER_ID_TEST);
        });
      });

      it('Should not modified non appropriate offers', async function () {
        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          chai.expect(offer).to.not.have.property('notToBeModified');
        });
      });

      it('Should update isActive to true if status = activation & isActive = false & hashActivation contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashSetStatusActivation,
            isActive: false,
            status: 'activation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.isActive).to.be.true;
          }
        });
      });

      it('Should update status to success if status = activation & isActive = false & hashActivation contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashSetStatusActivation,
            isActive: false,
            status: 'activation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.status).to.equal('success');
          }
        });
      });

      it('Should not update isActive if status = activation & isActive = false & hashActivation doesnt contain LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashFailed,
            isActive: false,
            status: 'activation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.isActive).to.be.false;
          }
        });
      });

      it('Should update status to activationFailure if status = activation & isActive = false & hashActivation doesnt contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashFailed,
            isActive: false,
            status: 'activation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.status).to.equal('activationFailure');
          }
        });
      });

      it('Should update isActive to false if status = deactivation & isActive = true & hashActivation contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashSetStatusDeactivation,
            isActive: true,
            status: 'deactivation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.isActive).to.be.false;
          }
        });
      });

      it('Should update status to success if status = deactivation & isActive = true & hashActivation contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashSetStatusDeactivation,
            isActive: true,
            status: 'deactivation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.status).to.equal('success');
          }
        });
      });

      it('Should not update isActive if status = deactivation & isActive = true & hashActivation doesnt contain LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashFailed,
            isActive: true,
            status: 'deactivation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.isActive).to.be.true;
          }
        });
      });

      it('Should update status to deactivationFailure if status = deactivation & isActive = true & hashActivation doesnt contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashFailed,
            isActive: true,
            status: 'deactivation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationUser)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.status).to.equal('deactivationFailure');
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
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        chai.expect(
          res.body.some((offer) => offer.userId === process.env.USER_ID_TEST)
        ).to.be.true;
        chai.expect(res.body.some((offer) => offer.userId === 'anotherUserId'))
          .to.be.true;
      });

      it('Should not modified non appropriate offers', async function () {
        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (offer.userId !== 'anotherUserId') {
            chai.expect(offer).to.not.have.property('notToBeModified');
          }
        });
      });

      it('Should update isActive to true if status = activation & isActive = false & hashActivation contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashSetStatusActivation,
            isActive: false,
            status: 'activation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.isActive).to.be.true;
          }
        });
      });

      it('Should update status to success if status = activation & isActive = false & hashActivation contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashSetStatusActivation,
            isActive: false,
            status: 'activation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.status).to.equal('success');
          }
        });
      });

      it('Should not update isActive if status = activation & isActive = false & hashActivation doesnt contain LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashFailed,
            isActive: false,
            status: 'activation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.isActive).to.be.false;
          }
        });
      });

      it('Should update status to activationFailure if status = activation & isActive = false & hashActivation doesnt contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashFailed,
            isActive: false,
            status: 'activation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.status).to.equal('activationFailure');
          }
        });
      });

      it('Should update isActive to false if status = deactivation & isActive = true & hashActivation contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashSetStatusDeactivation,
            isActive: true,
            status: 'deactivation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.isActive).to.be.false;
          }
        });
      });

      it('Should update status to success if status = deactivation & isActive = true & hashActivation contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashSetStatusDeactivation,
            isActive: true,
            status: 'deactivation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.status).to.equal('success');
          }
        });
      });

      it('Should not update isActive if status = deactivation & isActive = true & hashActivation doesnt contain LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashFailed,
            isActive: true,
            status: 'deactivation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.isActive).to.be.true;
          }
        });
      });

      it('Should update status to deactivationFailure if status = deactivation & isActive = true & hashActivation doesnt contains LogSetStatusOffer', async function () {
        const modifiedOffers = await collectionOffers
          .find({
            userId: process.env.USER_ID_TEST,
            offerId: { $exists: true, $ne: '' },
            hashActivation: txHashFailed,
            isActive: true,
            status: 'deactivation',
          })
          .toArray();

        const res = await chai
          .request(app)
          .put(pathBlockchain_Put_OffersActivationAll)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(updateOfferBody);
        chai.expect(res).to.have.status(200);

        res.body.forEach((offer) => {
          if (
            modifiedOffers.some(
              (offerModif) => offerModif._id.toString() === offer._id
            )
          ) {
            chai.expect(offer.status).to.equal('deactivationFailure');
          }
        });
      });
    });
  });
});
