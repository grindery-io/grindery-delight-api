import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { pathAdmin_Get_IsAdmin } from './utils/variables.js';

chai.use(chaiHttp);

describe('Admins route', async function () {
  it('Should return 403 if no token is provided', async function () {
    const res = await chai.request(app).get(pathAdmin_Get_IsAdmin);
    chai.expect(res).to.have.status(403);
    chai.expect(res.body.message).to.be.equal('No credentials sent');
  });

  it('Should return 200 with valid token corresponding to an admin user', async function () {
    const res = await chai
      .request(app)
      .get(pathAdmin_Get_IsAdmin)
      .set('Authorization', `Bearer ${mockedToken}`);

    chai.expect(res).to.have.status(200);
  });
});
