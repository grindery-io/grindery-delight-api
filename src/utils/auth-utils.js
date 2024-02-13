import axios from 'axios';
import jwt_decode from 'jwt-decode';

export const checkToken = async (token, workspaceKey) => {
  try {
    await axios.post(
      'https://orchestrator.grindery.com',
      {
        jsonrpc: '2.0',
        method: 'or_listWorkflows',
        id: new Date(),
        params: {
          ...(typeof workspaceKey !== 'undefined' && { workspaceKey }),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (err) {
    throw new Error(
      (err && err.response && err.response.data && err.response.data.message) ||
        err.message ||
        'Invalid token'
    );
  }
};

export const isRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({ message: 'No credentials sent' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'Wrong authentication method' });
  }

  const token = authHeader.substring(7, authHeader.length);
  try {
    await checkToken(token);
  } catch (err) {
    return res.status(401).json({
      message:
        (err &&
          err.response &&
          err.response.data &&
          err.response.data.message) ||
        err.message,
    });
  }
  const user = jwt_decode(token);
  res.locals.userId = user.sub;
  res.locals.workspaceId = user.workspace;

  next();
};

export const authenticateApiKey = (req, res, next) => {
  const apiKey = req.body.apiKey;
  if (!apiKey) {
    return res.status(401).send({
      msg: 'Missing API key',
    });
  }
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).send({
      msg: 'Invalid API key',
    });
  }
  next();
};

export const isAdmin = async (db, userId) => {
  return await db.collection('admins').findOne({
    userId: { $regex: userId, $options: 'i' },
  });
};
