import { Router } from 'express';
import offers from './routes/offers.js';
import orders from './routes/orders.js';
import staking from './routes/staking.js';
import liquidity_wallets from './routes/liquidity-wallets.js';
import coinmarketcap from './routes/coinmarketcap.js';
import blockchains from './routes/blockchains.js';
import tokens from './routes/tokens.js';
import admins from './routes/admins.js';
import view_blockchains from './routes/view-blockchains.js';
import webhooks from './routes/webhooks.js';
import g_sheets from './routes/g-sheets.js';

const router = Router();

router.use('/offers', offers);
router.use('/staking', staking);
router.use('/liquidity-wallets', liquidity_wallets);
router.use('/orders', orders);
router.use('/coinmarketcap', coinmarketcap);
router.use('/blockchains', blockchains);
router.use('/tokens', tokens);
router.use('/admins', admins);
router.use('/view-blockchains', view_blockchains);
router.use('/webhooks', webhooks);
router.use('/gsheets', g_sheets);

export default router;
