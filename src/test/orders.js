import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn.js';
import jwt from 'jsonwebtoken';
import { mockedToken } from './mock.js';
import { ObjectId } from 'mongodb';

chai.use(chaiHttp);
const expect = chai.expect;

const collection = db.collection('orders');

const orderId = 'myOrderId';

const order = {
  amountTokenDeposit: '0.34',
  addressTokenDeposit: '0x0',
  chainIdTokenDeposit: '13434',
  destAddr: 'mydestAddr',
  offerId: 'myOfferId',
  orderId: orderId,
  amountTokenOffer: '5433',
  hash: 'myhash',
};

describe('Orders route', () => {
  describe('POST new order', () => {
    describe('Route core', () => {
      it('Should return 403 if no token is provided', async function () {
        const createResponse = await chai
          .request(app)
          .post('/orders')
          .send(order);
        chai.expect(createResponse).to.have.status(403);
      });

      it('Should POST a new order', async function () {
        const createResponse = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(order);

        chai.expect(createResponse).to.have.status(200);
        chai.expect(createResponse.body).to.have.property('acknowledged').that
          .is.true;
        chai.expect(createResponse.body).to.have.property('insertedId').that.is
          .not.empty;

        const deleteResponse = await chai
          .request(app)
          .delete(`/orders/${orderId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should POST a new order with relevant fields', async function () {
        const createResponse = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(order);
        chai.expect(createResponse).to.have.status(200);

        const getOrder = await chai
          .request(app)
          .get('/orders/orderId')
          .query({ orderId: orderId })
          .set('Authorization', `Bearer ${mockedToken}`);

        // Assertions
        chai.expect(getOrder).to.have.status(200);
        chai.expect(getOrder.body).to.be.an('object');
        chai
          .expect(getOrder.body.amountTokenDeposit)
          .to.equal(order.amountTokenDeposit);
        chai
          .expect(getOrder.body.addressTokenDeposit)
          .to.equal(order.addressTokenDeposit);
        chai
          .expect(getOrder.body.chainIdTokenDeposit)
          .to.equal(order.chainIdTokenDeposit);
        chai.expect(getOrder.body.destAddr).to.equal(order.destAddr);
        chai.expect(getOrder.body.offerId).to.equal(order.offerId);
        chai.expect(getOrder.body.orderId).to.equal(order.orderId);
        chai
          .expect(getOrder.body.amountTokenOffer)
          .to.equal(order.amountTokenOffer);
        chai.expect(getOrder.body.hash).to.equal(order.hash);

        const deleteResponse = await chai
          .request(app)
          .delete(`/orders/${orderId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });

      it('Should fail if same orderId exists', async function () {
        const createResponse = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(order);
        chai.expect(createResponse).to.have.status(200);

        const createDuplicateResponse = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send(order);
        chai.expect(createDuplicateResponse).to.have.status(404);
        chai
          .expect(createDuplicateResponse.body.msg)
          .to.be.equal('This order already exists.');

        const deleteResponse = await chai
          .request(app)
          .delete(`/orders/${orderId}`)
          .set('Authorization', `Bearer ${mockedToken}`);
        chai.expect(deleteResponse).to.have.status(200);
      });
    });

    describe('Validators', () => {
      it('Should return a 400 if orderId is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: 1234,
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('orderId');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should return a 400 if orderId is an empty string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('orderId');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should return a 400 if amountTokenDeposit is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: 10,
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('amountTokenDeposit');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should return a 400 if amountTokenDeposit is an empty string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('amountTokenDeposit');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should return a 400 if addressTokenDeposit is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: 1234,
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('addressTokenDeposit');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should return a 400 if addressTokenDeposit is an empty string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('addressTokenDeposit');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should return a 400 if chainIdTokenDeposit is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: 1,
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('chainIdTokenDeposit');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should return a 400 if chainIdTokenDeposit is an empty string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('chainIdTokenDeposit');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should return a 400 if destAddr is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: 1234,
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('destAddr');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should return a 400 if destAddr is an empty string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('destAddr');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should return a 400 if amountTokenOffer is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: 20,
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('amountTokenOffer');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should return a 400 if amountTokenOffer is an empty string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '',
            offerId: '5678',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('amountTokenOffer');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should return a 400 if offerId is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: 5678,
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('offerId');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should return a 400 if offerId is an empty string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '',
            hash: '0x789...',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('offerId');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should return a 400 if hash is not a string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: 1234,
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('hash');
        chai.expect(res.body[0].msg).to.equal('must be string value');
      });

      it('Should return a 400 if hash is an empty string', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai.expect(res.body[0].param).to.equal('hash');
        chai.expect(res.body[0].msg).to.equal('must not be empty');
      });

      it('Should return a 400 if adding an unexpected field', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .send({
            orderId: '1234',
            amountTokenDeposit: '10',
            addressTokenDeposit: '0x123...',
            chainIdTokenDeposit: '1',
            destAddr: '0x456...',
            amountTokenOffer: '20',
            offerId: '5678',
            hash: '0x789...',
            unexpectedField: 'unexpected value',
          });
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai
          .expect(res.body[0].msg)
          .to.equal(
            'The following fields are not allowed in body: unexpectedField'
          );
      });

      it('Should return a 400 if an unexpected field is present in query', async function () {
        const res = await chai
          .request(app)
          .post('/orders')
          .set('Authorization', `Bearer ${mockedToken}`)
          .query({
            unexpectedField: 'unexpectedValue',
          })
          .send(order);
        chai.expect(res).to.have.status(400);
        chai.expect(res.body).to.be.an('array');
        chai.expect(res.body.length).to.equal(1);
        chai
          .expect(res.body[0].msg)
          .to.equal(
            'The following fields are not allowed in query: unexpectedField'
          );
      });
    });
  });
});
