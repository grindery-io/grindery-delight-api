import express from 'express';
import isRequired from '../utils/auth-utils.js';
import { createUserInfoValidator } from '../validators/g-sheets.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import { google } from 'googleapis';

const router = express.Router();

/* Creating a new entry to save email, wallet addres and offer id from user. */
router.post('/', createUserInfoValidator, isRequired, async (req, res) => {
  const validator = validateResult(req, res);
  if (validator.length) {
    return res.status(400).send(validator);
  }
  const auth = await getAuthToken();
  const spreadSheet = await getSpreadSheet(auth);
  const spreadsheetTitle = spreadSheet.data.sheets[0].properties.title;
  await appendData(auth, spreadsheetTitle, req);
  res.status(201).send(null);
});

const getAuthToken = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      private_key: process.env.GOOGLE_CLIENT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    },
    scopes: [process.env.GOOGLE_CLIENT_SCOPE],
  });
  return await auth.getClient();
};

const getSpreadSheet = async (auth) => {
  const sheets = google.sheets('v4');
  return await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    auth,
  });
};

const appendData = async (auth, spreadsheetTitle, req) => {
  const googleSheetsInstance = google.sheets({
    version: 'v4',
    auth,
  });
  googleSheetsInstance.spreadsheets.values.append({
    auth,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: spreadsheetTitle,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[req.body.email, req.body.walletAddress, req.body.orderId]],
    },
  });
};

export default router;
