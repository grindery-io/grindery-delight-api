import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn.js';
import jwt from 'jsonwebtoken';
import { mockedToken } from './mock.js';
import { ObjectId } from 'mongodb';

chai.use(chaiHttp);
const expect = chai.expect;

const collection = db.collection('offers');

const offerId =
  '0x02689c291c6d392ab9c02fc2a459a08cc46cc816b77cec928c86109d37ed2843';

const offer = {
  chainId: '97',
  min: '0.02',
  max: '1',
  tokenId: '45',
  token: 'BNB',
  tokenAddress: '0x0',
  hash: '0x56ee9a0e1063631dbdb5f2b8c6946aecf9a765a9470f023e3a8afb8fbf86d7a4',
  exchangeRate: '1',
  exchangeToken: 'ETH',
  exchangeChainId: '5',
  estimatedTime: '123',
  provider: '0x795beefD41337BB83903788949c8AC2D559A44a3',
  offerId: offerId,
  isActive: true,
  title: '',
  image: '',
  amount: '',
};

describe('Offers route', () => {
  describe('POST new offer', () => {
    describe('Route core', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .send(offer);
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should POST a new offer if all fields are completed and no existing offer', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/${offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should POST a new offer if all fields are completed and no existing offer (with correct fields)', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .query({ offerId: offerId })
          .set('Authorization', `Bearer ${mockedToken}`);

        // Assertions
        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.be.an('object');
        chai.expect(getOffer.body.chainId).to.equal(offer.chainId);
        chai.expect(getOffer.body.min).to.equal(offer.min);
        chai.expect(getOffer.body.max).to.equal(offer.max);
        chai.expect(getOffer.body.tokenId).to.equal(offer.tokenId);
        chai.expect(getOffer.body.token).to.equal(offer.token);
        chai.expect(getOffer.body.tokenAddress).to.equal(offer.tokenAddress);
        chai.expect(getOffer.body.hash).to.equal(offer.hash);
        chai.expect(getOffer.body.offerId).to.equal(offer.offerId);
        chai.expect(getOffer.body.isActive).to.equal(offer.isActive);
        chai.expect(getOffer.body.estimatedTime).to.equal(offer.estimatedTime);
        chai.expect(getOffer.body.exchangeRate).to.equal(offer.exchangeRate);
        chai.expect(getOffer.body.exchangeToken).to.equal(offer.exchangeToken);
        chai
          .expect(getOffer.body.exchangeChainId)
          .to.equal(offer.exchangeChainId);
        chai.expect(getOffer.body.provider).to.equal(offer.provider);
        chai.expect(getOffer.body.title).to.equal(offer.title);
        chai.expect(getOffer.body.image).to.equal(offer.image);
        chai.expect(getOffer.body.amount).to.equal(offer.amount);

        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/${offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should fail if same offerId exists', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const createDuplicateResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createDuplicateResponse).to.have.status(404);
        chai
          .expect(createDuplicateResponse.body.msg)
          .to.be.equal('This offer already exists.');

        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/${offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });
    });

    describe('Validators', () => {
      it('Should fail validation if min is greater than max', async function () {
        const invalidOffer = {
          chainId: '1',
          min: '30',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set({ Authorization: `Bearer ${mockedToken}` })
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].location).to.equal('body');
        chai.expect(res.body[0].msg).to.equal('min must be less than max');
      });

      it('Should fail validation if chainId is not a string', async function () {
        const invalidOffer = {
          chainId: 123, // should be a string
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set({ Authorization: `Bearer ${mockedToken}` })
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('chainId');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if chainId is an empty string', async function () {
        const invalidOffer = {
          chainId: '', // empty string
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('chainId');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if min is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: 10, // should be a string
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        const headers = { Authorization: `Bearer ${mockedToken}` };
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('min');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if min is an empty string', async function () {
        const offer = {
          chainId: '123',
          min: '',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };
        const res = await chai
          .request(app)
          .post('/offers')
          .set({ Authorization: `Bearer ${mockedToken}` })
          .send(offer);

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('min');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if max is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: 20, // should be a string
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('max');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if max is an empty string', async function () {
        const offer = {
          chainId: '123',
          min: '10',
          max: '',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };
        const res = await chai
          .request(app)
          .post('/offers')
          .set({ Authorization: `Bearer ${mockedToken}` })
          .send(offer);

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('max');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if tokenId is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 123, // should be a string
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        const headers = { Authorization: `Bearer ${mockedToken}` };
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('tokenId');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if tokenId is an empty string', async function () {
        const offer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: '',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };
        const res = await chai
          .request(app)
          .post('/offers')
          .set({ Authorization: `Bearer ${mockedToken}` })
          .send(offer);

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('tokenId');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if token is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 123, // should be a string
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        const headers = { Authorization: `Bearer ${mockedToken}` };

        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('token');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if token is an empty string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: '', // should not be empty
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        const headers = { Authorization: `Bearer ${mockedToken}` };

        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('token');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if tokenAddress is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 123, // should be a string
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('tokenAddress');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if tokenAddress is an empty string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: '', // should not be empty
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('tokenAddress');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if hash is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 123, // should be a string
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('hash');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if hash is an empty string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: '', // should not be empty
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('hash');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if offerId is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 123, // should be a string
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('offerId');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if offerId is an empty string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: '', // should not be empty
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('offerId');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if isActive is not a boolean', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: 'invalid', // should be a boolean
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('isActive');
        chai.expect(res.body[0].msg).to.equal('must be boolean value');
      });

      it('Should fail validation if isActive is an empty value', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: '', // should not be empty
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(2);
        chai.expect(res.body[0].param).to.equal('isActive');
        chai.expect(res.body[0].msg).to.equal('must be boolean value');
        chai.expect(res.body[1].param).to.equal('isActive');
        chai.expect(res.body[1].msg).to.equal('must not be empty');
      });

      it('Should fail validation if estimatedTime is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: 123, // should be a string
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('estimatedTime');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if estimatedTime is an empty string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '', // should not be empty
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('estimatedTime');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if exchangeRate is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: 5, // should be a string
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('exchangeRate');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if exchangeRate is an empty string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '', // should not be empty
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('exchangeRate');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if exchangeToken is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 123, // should be a string
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('exchangeToken');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if exchangeToken is an empty string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: '', // should not be empty
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('exchangeToken');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if exchangeChainId is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: 123, // should be a string
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('exchangeChainId');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if exchangeChainId is an empty string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '', // should not be empty
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('exchangeChainId');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      // provider validation tests
      it('Should fail validation if provider is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 123, // should be a string
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('provider');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if provider is an empty string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: '', // should not be empty
          title: 'title',
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('provider');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should fail validation if title is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 123, // should be a string, can be empty
          image: 'image',
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('title');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if image is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 123, // should be a string
          amount: 'amount',
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('image');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if amount is not a string', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 123, // should be a string
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('amount');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should fail validation if request body contains an unauthorized field', async function () {
        const invalidOffer = {
          chainId: '123',
          min: '10',
          max: '20',
          tokenId: 'tokenId',
          token: 'token',
          tokenAddress: 'tokenAddress',
          hash: 'hash',
          offerId: 'offerId',
          isActive: true,
          estimatedTime: '3 days',
          exchangeRate: '5',
          exchangeToken: 'ETH',
          exchangeChainId: '1',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: 'amount',
          unauthorizedField: 'unauthorizedField', // should not be present
        };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request to create the offer with invalid data
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(invalidOffer);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai
          .expect(res.body[0].msg)
          .to.equal(
            'The following fields are not allowed in body: unauthorizedField'
          );
      });

      it('Should fail validation if there is an unknown field in req.query', async function () {
        const invalidQuery = { unknownField: 'someValue' };

        // Set mocked token in headers
        const headers = { Authorization: `Bearer ${mockedToken}` };

        // Make a request with invalid query params
        const res = await chai
          .request(app)
          .post('/offers')
          .set(headers)
          .send(offer)
          .query(invalidQuery);

        // Assertions
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai
          .expect(res.body[0].msg)
          .to.equal(
            'The following fields are not allowed in query: unknownField'
          );
      });
    });
  });

  describe('GET all offers', () => {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get('/offers');
      chai.expect(res).to.have.status(403);
    });

    it('Should return an array with the correct MongoDB elements', async function () {
      // Transform each item in mongoData
      const formattedData = (await collection.find({}).toArray()).map(
        (item) => {
          // Return a new object with the formatted fields
          return {
            ...item,
            _id: item._id.toString(),
            date: item.date.toISOString(),
          };
        }
      );

      const res = await chai
        .request(app)
        .get('/offers')
        .set({ Authorization: `Bearer ${mockedToken}` });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal(formattedData);
    });
  });

  describe('GET all active offers with filters', () => {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get('/offers/search').query({
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      });
      chai.expect(res).to.have.status(403);
    });

    it('Should return an array of active offers', async function () {
      this.timeout(50000);
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 0;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);
        chai.expect(createResponse).to.have.status(200);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);
      chai.expect(Array.isArray(res.body)).to.be.true;

      for (const offer of res.body) {
        chai.expect(offer.isActive).to.be.true;
      }

      for (let i = 0; i < nbrOffers; i++) {
        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/offerId-number${i}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      }
    });

    it('Should return only offers with proper exchangeChainId', async function () {
      this.timeout(50000);
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 0;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);
        chai.expect(createResponse).to.have.status(200);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.exchangeChainId).to.equal(offer.exchangeChainId);
      }

      for (let i = 0; i < nbrOffers; i++) {
        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/offerId-number${i}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      }
    });

    it('Should return only offers with proper exchangeToken', async function () {
      this.timeout(50000);
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 0;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);
        chai.expect(createResponse).to.have.status(200);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.exchangeToken).to.equal(offer.exchangeToken);
      }

      for (let i = 0; i < nbrOffers; i++) {
        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/offerId-number${i}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      }
    });

    it('Should return only offers with proper chainId', async function () {
      this.timeout(50000);
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 0;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);
        chai.expect(createResponse).to.have.status(200);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.chainId).to.equal(offer.chainId);
      }

      for (let i = 0; i < nbrOffers; i++) {
        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/offerId-number${i}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      }
    });

    it('Should return only offers with proper token', async function () {
      this.timeout(50000);
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 0;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);
        chai.expect(createResponse).to.have.status(200);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.token).to.equal(offer.token);
      }

      for (let i = 0; i < nbrOffers; i++) {
        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/offerId-number${i}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      }
    });

    it('Should return only offers with min less than depositAmount/exchangeRate', async function () {
      this.timeout(50000);
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 0;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);
        chai.expect(createResponse).to.have.status(200);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        const rateAmount = query.depositAmount / offer.exchangeRate;
        chai.expect(Number(offer.min)).to.be.at.most(rateAmount);
      }

      for (let i = 0; i < nbrOffers; i++) {
        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/offerId-number${i}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      }
    });

    it('Should return only offers with max greater than depositAmount/exchangeRate', async function () {
      this.timeout(50000);
      const customOffer = { ...offer, isActive: true, exchangeRate: '2' };
      const nbrOffers = 0;
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;
        // isActive est true pour les i pairs, false pour les i impairs
        customOffer.isActive = i % 2 === 0;

        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);
        chai.expect(createResponse).to.have.status(200);
      }

      const query = {
        exchangeChainId: offer.exchangeChainId,
        exchangeToken: offer.exchangeToken,
        chainId: offer.chainId,
        token: offer.token,
        depositAmount: '1',
      };

      const res = await chai
        .request(app)
        .get('/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query(query);

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        const rateAmount = query.depositAmount / offer.exchangeRate;
        chai.expect(Number(offer.max)).to.be.at.least(rateAmount);
      }

      for (let i = 0; i < nbrOffers; i++) {
        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/offerId-number${i}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      }
    });

    it('Should return an empty array if no offer match', async function () {
      const res = await chai
        .request(app)
        .get('/offers/search')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({
          exchangeChainId: '232323232323232323',
          exchangeToken: offer.exchangeToken,
          chainId: offer.chainId,
          token: offer.token,
          depositAmount: '1',
        });

      chai.expect(res).to.have.status(200);
      expect(res.body).to.be.an('array').that.is.empty;
    });
  });

  describe('GET all offers for a user', () => {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get('/offers/user');
      chai.expect(res).to.have.status(403);
    });

    it('Should return only offers for the given user', async function () {
      this.timeout(50000);
      const customOffer = { ...offer };
      const nbrOffers = 1;
      let userId = '';
      for (let i = 0; i < nbrOffers; i++) {
        customOffer.offerId = `offerId-number${i}`;

        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(customOffer);

        chai.expect(createResponse).to.have.status(200);

        if (i === 0) {
          userId = (
            await collection.findOne({
              _id: new ObjectId(createResponse.body.insertedId),
            })
          ).userId;
        }
      }

      const res = await chai
        .request(app)
        .get('/offers/user')
        .set({ Authorization: `Bearer ${mockedToken}` });

      chai.expect(res).to.have.status(200);

      for (const offer of res.body) {
        chai.expect(offer.userId).to.equal(userId);
      }

      for (let i = 0; i < nbrOffers; i++) {
        const deleteResponse = await chai
          .request(app)
          .delete(`/offers/offerId-number${i}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      }
    });
  });

  describe('GET offer by offerId', () => {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get('/offers/offerId')
        .query({ offerId: offer.offerId });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the offer with the proper offerId', async function () {
      const createResponse = await chai
        .request(app)
        .post('/offers')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      chai.expect(createResponse).to.have.status(200);

      const res = await chai
        .request(app)
        .get('/offers/offerId')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: offer.offerId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body.offerId).to.equal(offer.offerId);

      const deleteResponse = await chai
        .request(app)
        .delete(`/offers/${offer.offerId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
    });

    it('Should return an empty object if offerId doesnt exist', async function () {
      const res = await chai
        .request(app)
        .get('/offers/offerId')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ offerId: '111111111111111111111111' });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('GET offer by MongoDB id', () => {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get('/offers/id')
        .query({ id: '643471eaaceeded45b420be6' });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the offer with the proper MongoDB id', async function () {
      const createResponse = await chai
        .request(app)
        .post('/offers')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      chai.expect(createResponse).to.have.status(200);

      const res = await chai
        .request(app)
        .get('/offers/id')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: createResponse.body.insertedId });

      delete res.body._id;
      delete res.body.date;
      delete res.body.userId;

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body).to.deep.equal(offer);

      const deleteResponse = await chai
        .request(app)
        .delete(`/offers/${offerId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
    });

    it('Should return the offer with the proper userId', async function () {
      const createResponse = await chai
        .request(app)
        .post('/offers')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      chai.expect(createResponse).to.have.status(200);

      const userId = (
        await collection.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).userId;

      const res = await chai
        .request(app)
        .get('/offers/id')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: createResponse.body.insertedId });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body.userId).to.equal(userId);

      const deleteResponse = await chai
        .request(app)
        .delete(`/offers/${offerId}`)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
    });

    it('Should return an empty object if MongoDB id doesnt exist', async function () {
      const res = await chai
        .request(app)
        .get('/offers/id')
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: '111111111111111111111111' });

      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('DELETE offer by offerId', () => {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).delete('/offers/myOfferId');
      chai.expect(res).to.have.status(403);
    });

    it('Should delete one offer', async function () {
      const createResponse = await chai
        .request(app)
        .post('/offers')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      chai.expect(createResponse).to.have.status(200);

      const deleteResponse = await chai
        .request(app)
        .delete(`/offers/${offer.offerId}`)
        .set('Authorization', `Bearer ${mockedToken}`);

      chai.expect(deleteResponse).to.have.status(200);
      chai.expect(deleteResponse.body.acknowledged).to.be.true;
      chai.expect(deleteResponse.body.deletedCount).to.equal(1);
    });

    it('Should delete the appropriate offer', async function () {
      const createResponse = await chai
        .request(app)
        .post('/offers')
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(offer);
      chai.expect(createResponse).to.have.status(200);

      chai.expect(
        await collection.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.not.be.empty;

      const deleteResponse = await chai
        .request(app)
        .delete(`/offers/${offer.offerId}`)
        .set('Authorization', `Bearer ${mockedToken}`);

      chai.expect(deleteResponse).to.have.status(200);

      chai.expect(
        await collection.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.be.null;
    });

    it('Should return 404 with message if no offer found', async function () {
      const res = await chai
        .request(app)
        .delete('/offers/myOfferId')
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No offer found' });
    });
  });

  describe('PUT offer by offerId', () => {
    describe('Modify an offer', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .send({ chainId: '232323' });

        chai.expect(modifyOffer).to.have.status(403);

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should return 404 if offer doesnt exist', async function () {
        const modifyOffer = await chai
          .request(app)
          .put('/offers/myFalseOfferId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ chainId: '232323' });

        chai.expect(modifyOffer).to.have.status(404);
        chai.expect(modifyOffer.body).to.deep.equal({ msg: 'No offer found' });
      });

      it('Should modify only one offer', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ chainId: '232323' });

        chai.expect(createResponse).to.have.status(200);
        chai.expect(modifyOffer.body).to.deep.equal({
          acknowledged: true,
          modifiedCount: 1,
          upsertedId: null,
          upsertedCount: 0,
          matchedCount: 1,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify all offer fields', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          chainId: '76',
          min: '10',
          max: '100',
          tokenId: 'token-id',
          token: 'token',
          tokenAddress: 'token-address',
          isActive: false,
          exchangeRate: '2',
          exchangeToken: 'exchange-token',
          exchangeChainId: 'exchange-chain-id',
          estimatedTime: '1 day',
          provider: 'provider',
          title: 'title',
          image: 'image',
          amount: '50',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...modifiedOffer,
          hash: offer.hash,
          offerId: offer.offerId,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify only the chainId field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          chainId: '76',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          ...modifiedOffer,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify only min field of an offer', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          min: '10',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          min: modifiedOffer.min,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify only max field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          max: '500',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          max: modifiedOffer.max,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify only tokenId field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          tokenId: 'new-token-id',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          tokenId: modifiedOffer.tokenId,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify only the token field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          token: 'modified-token',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          token: modifiedOffer.token,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify only tokenAddress field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          tokenAddress: '0x1234567890123456789012345678901234567890',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          tokenAddress: modifiedOffer.tokenAddress,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify isActive field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          isActive: false,
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({ isActive: modifiedOffer.isActive });

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          isActive: modifiedOffer.isActive,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify the exchangeRate field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          exchangeRate: '3',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          exchangeRate: modifiedOffer.exchangeRate,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify the exchangeToken field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          exchangeToken: 'modified-exchange-token',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          exchangeToken: modifiedOffer.exchangeToken,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify the exchangeChainId field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          exchangeChainId: 'modified-exchange-chain-id',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          exchangeChainId: modifiedOffer.exchangeChainId,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify only estimatedTime field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          estimatedTime: 'modified-estimated-time',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          estimatedTime: modifiedOffer.estimatedTime,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify only provider field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          provider: 'new-provider',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          provider: modifiedOffer.provider,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify the title field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          title: 'Modified Offer Title',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          title: modifiedOffer.title,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify only the image field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          image: 'modified-image',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          image: modifiedOffer.image,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });

      it('Should modify the amount field', async function () {
        const createResponse = await chai
          .request(app)
          .post('/offers')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(offer);
        chai.expect(createResponse).to.have.status(200);

        const modifiedOffer = {
          amount: '2',
        };

        const modifyOffer = await chai
          .request(app)
          .put(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(modifiedOffer);

        chai.expect(modifyOffer).to.have.status(200);

        const getOffer = await chai
          .request(app)
          .get('/offers/offerId')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({ offerId: offer.offerId });

        delete getOffer.body._id;
        delete getOffer.body.date;
        delete getOffer.body.userId;

        chai.expect(getOffer).to.have.status(200);
        chai.expect(getOffer.body).to.deep.equal({
          ...offer,
          amount: modifiedOffer.amount,
        });

        await chai
          .request(app)
          .delete(`/offers/${offer.offerId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
      });
    });
  });
});
