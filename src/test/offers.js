import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn.js';
import jwt from 'jsonwebtoken';
import { mockedToken } from './mock.js';

chai.use(chaiHttp);
const expect = chai.expect;

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
});
