import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import db from '../db/conn.js';
import jwt from 'jsonwebtoken';
import { mockedToken } from './utils.js';

chai.use(chaiHttp);
const expect = chai.expect;

describe('Admins route', () => {
  it('Should return 403 if no token is provided', async function () {
    chai
      .request(app)
      .get('/admins')
      .end(function (err, res) {
        chai.expect(res).to.have.status(403);
        chai.expect(res.body.message).to.be.equal('No credentials sent');
      });
  });

  it('Should return 200 with valid token corresponding to an admin user', async function () {
    chai
      .request(app)
      .get('/admins')
      .set('Authorization', `Bearer ${mockedToken}`)
      .end(function (err, res) {
        chai.expect(res).to.have.status(200);
        // chai.expect(res.body).to.be.true;
      });
  });
});
