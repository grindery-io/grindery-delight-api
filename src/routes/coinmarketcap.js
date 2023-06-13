import express from 'express';
import { isRequired } from '../utils/auth-utils.js';
import { coinMarketCapGetQuoteValidator } from '../validators/coinmarketcap.validator.js';
import { validateResult } from '../utils/validators-utils.js';
import axios from 'axios';

const router = express.Router();

router.get(
  '/',
  coinMarketCapGetQuoteValidator,
  isRequired,
  async (req, res) => {
    const validator = validateResult(req, res);
    if (validator.length) {
      return res.status(400).send(validator);
    }

    try {
      const response = await axios.get(
        'https://sandbox-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest',
        {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
          },
          params: {
            symbol: req.query.token,
          },
        }
      );
      res.status(200).send(response.data.data[req.query.token][0].quote.USD);
    } catch (e) {
      res.status(404).send({
        msg: e,
      });
    }
  }
);

export default router;
