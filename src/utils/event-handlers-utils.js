import events from 'events';
import { liquidityWalletCreatedHandler } from '../handlers/liquidity-wallets-handler.js';

export const eventEmitter = new events.EventEmitter();

export const eventHandlers = {
  LIQUIDITY_WALLET_CREATED: 'LiquidityWalletCreated',
};

eventEmitter.on(
  eventHandlers.LIQUIDITY_WALLET_CREATED,
  liquidityWalletCreatedHandler
);
