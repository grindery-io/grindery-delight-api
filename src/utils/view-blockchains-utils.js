import { ethers } from 'ethers';
import axios from 'axios';

export const GrtPoolAddress = '0x29e2b23FF53E6702FDFd8C8EBC0d9E1cE44d241A';

/**
 * This function updates the offer ID and status of an offer in a database based on its chain ID and
 * hash.
 * @param db - The `db` parameter is likely a database object or connection that is used to interact
 * with a database. It is used in this function to query a collection named "blockchains" in the
 * database.
 * @param offer - The `offer` parameter is an object that represents an offer. It likely contains
 * properties such as `chainId`, `hash`, `offerId`, and `status`. The function updates the `offerId`
 * and `status` properties based on the `hash` and `chainId` values.
 * @returns An object with the properties `offerId` and `status`. The `offerId` property contains the
 * offer ID obtained from the hash, and the `status` property indicates whether the offer ID was
 * successfully obtained (`'success'`) or not (`'failure'`).
 */
export async function updateOfferId(db, offer) {
  const chain = await db
    .collection('blockchains')
    .findOne({ chainId: offer.chainId });

  offer.offerId = await getOfferIdFromHash(chain.rpc[0], offer.hash);
  offer.status = offer.offerId !== '' ? 'success' : 'failure';

  return { offerId: offer.offerId, status: offer.status };
}

/**
 * This function updates the completion order status of an offer based on whether or not the payment
 * has been made.
 * @param db - The `db` parameter is likely a database object that is used to interact with a database,
 * possibly a MongoDB database based on the use of `db.collection` in the code.
 * @param order - The `order` parameter is an object that represents an order and contains various
 * properties such as `offerId`, `hashCompletion`, `isComplete`, and `status`. The function updates the
 * `isComplete` and `status` properties of the `order` object based on whether the payment for the
 * @returns an object with two properties: `status` and `isComplete`. The `status` property indicates
 * the status of the order, which can be either `'complete'` or `'paymentFailure'`. The `isComplete`
 * property is a boolean value that indicates whether the order has been paid or not.
 */
export async function updateCompletionOrder(db, order) {
  const { chainId } = await db
    .collection('offers')
    .findOne({ offerId: order.offerId });
  const chain = await db.collection('blockchains').findOne({ chainId });

  order.isComplete = await isPaidOrderFromHash(
    chain.rpc[0],
    order.hashCompletion
  );
  order.status = order.isComplete ? 'complete' : 'paymentFailure';

  return { status: order.status, isComplete: order.isComplete };
}

/**
 * This function updates the activation offer status and checks if the activation event was successful.
 * @param db - The database object used to interact with the database.
 * @param offer - The `offer` parameter is an object that represents an activation offer. It contains
 * properties such as `chainId`, `hashActivation`, `status`, and `isActive`. The function updates the
 * `status` and `isActive` properties of the `offer` object based on the result of a blockchain query
 * @returns an object with two properties: "status" and "isActive". The "status" property contains a
 * string value indicating the status of the offer (either "success", "activationFailure", or
 * "deactivationFailure"). The "isActive" property contains a boolean value indicating whether the
 * offer is currently active or not.
 */
export async function updateActivationOffer(db, offer) {
  const chain = await db
    .collection('blockchains')
    .findOne({ chainId: offer.chainId });

  const isActivationEvent = await isSetStatusFromHash(
    chain.rpc[0],
    offer.hashActivation
  );

  if (!isActivationEvent.isSetStatus) {
    offer.status =
      offer.status === 'activation'
        ? 'activationFailure'
        : 'deactivationFailure';
    return { status: offer.status, isActive: offer.isActive };
  }

  offer.isActive = isActivationEvent.isActive;
  offer.status = 'success';

  return { status: offer.status, isActive: offer.isActive };
}

/**
 * This function updates an order's information from a database based on its chain ID and hash.
 * @param db - The database object used to interact with the database.
 * @param order - The order parameter is an object that contains information about an order, such as
 * the chainId, hash, amountTokenDeposit, addressTokenDeposit, chainIdTokenDeposit, destAddr, offerId,
 * amountTokenOffer, and status.
 */
export async function updateOrderFromDb(db, order) {
  const chain = await db.collection('blockchains').findOne({
    chainId: order.chainId,
  });

  const orderId = await getOrderIdFromHash(chain.rpc[0], order.hash);

  if (orderId === '') {
    order.status = 'failure';
  } else {
    const onChainOrder = await getOrderInformation(
      new ethers.Contract(
        GrtPoolAddress,
        (
          await getAbis()
        ).poolAbi,
        getProviderFromRpc(chain.rpc[0])
      ),
      orderId
    );

    order.amountTokenDeposit = onChainOrder.depositAmount;
    order.addressTokenDeposit = onChainOrder.depositToken;
    order.chainIdTokenDeposit = onChainOrder.depositChainId;
    order.destAddr = onChainOrder.destAddr;
    order.offerId = onChainOrder.offerId;
    order.amountTokenOffer = onChainOrder.amountTokenOffer;
    order.status = 'success';
  }

  return {
    amountTokenDeposit: order.amountTokenDeposit,
    addressTokenDeposit: order.addressTokenDeposit,
    chainIdTokenDeposit: order.chainIdTokenDeposit,
    destAddr: order.destAddr,
    offerId: order.offerId,
    amountTokenOffer: order.amountTokenOffer,
    status: order.status,
  };
}

/**
 * The function retrieves information about a specific order from a smart contract.
 * @param contract - The contract parameter is likely an instance of a smart contract on the Ethereum
 * blockchain. It is used to interact with the functions and data stored on the contract.
 * @param orderId - The `orderId` parameter is an identifier for a specific order in the smart
 * contract. The function `getOrderInformation` takes this parameter and retrieves various pieces of
 * information related to that order from the smart contract.
 * @returns The function `getOrderInformation` is returning an object with the following properties:
 */
export async function getOrderInformation(contract, orderId) {
  return {
    depositAmount: ethers.utils
      .formatEther(await contract.getDepositAmount(orderId))
      .toString(),
    depositToken: await contract.getDepositToken(orderId),
    depositChainId: (await contract.getDepositChainId(orderId)).toString(),
    destAddr: await contract.getRecipient(orderId),
    offerId: await contract.getIdOffer(orderId),
    amountTokenOffer: ethers.utils
      .formatEther(await contract.getAmountOffer(orderId))
      .toString(),
  };
}

/**
 * This function retrieves the order ID from a transaction hash using a specified RPC provider.
 * @param rpc - The rpc parameter is likely a URL or endpoint for a remote procedure call (RPC) server.
 * This server is used to interact with a blockchain network, such as Ethereum, and execute
 * transactions or retrieve data from the network.
 * @param hash - The `hash` parameter is a string representing the transaction hash of a previously
 * sent transaction on the blockchain network. This function retrieves the order ID from the
 * transaction receipt of that transaction.
 * @returns the third topic of the first log in the transaction receipt object if the transaction
 * status is not 0, otherwise it returns an empty string. The third topic is assumed to be the order
 * ID.
 */
export async function getOrderIdFromHash(rpc, hash) {
  const provider = getProviderFromRpc(rpc);
  const txReceipt = await provider.getTransactionReceipt(hash);
  return txReceipt.status === 0 ? '' : txReceipt.logs[0].topics[2];
}

/**
 * This function retrieves an offer ID from a transaction hash using a specified RPC provider.
 * @param rpc - The RPC (Remote Procedure Call) endpoint that the function will use to interact with
 * the blockchain.
 * @param hash - The hash parameter is a string representing the transaction hash of a previously
 * executed Ethereum transaction.
 * @returns the offer ID extracted from the logs of a transaction with the given hash. If the
 * transaction failed (status = 0), an empty string is returned.
 */
export async function getOfferIdFromHash(rpc, hash) {
  const provider = getProviderFromRpc(rpc);
  const txReceipt = await provider.getTransactionReceipt(hash);
  return txReceipt.status === 0 ? '' : txReceipt.logs[0].topics[1];
}

/**
 * This function checks if a transaction hash corresponds to a paid order using Ethereum blockchain and
 * ethers.js library.
 * @param rpc - The RPC (Remote Procedure Call) endpoint is a URL that allows the code to communicate
 * with the Ethereum network. It is used to send and receive data from the blockchain.
 * @param hash - The hash parameter is a string representing the transaction hash of a blockchain
 * transaction.
 * @returns a boolean value. It will return `true` if the transaction with the given hash is a paid
 * order, and `false` if it is not a paid order or if the transaction failed (status is 0).
 */
export async function isPaidOrderFromHash(rpc, hash) {
  const provider = getProviderFromRpc(rpc);
  const txReceipt = await provider.getTransactionReceipt(hash);
  const iface = new ethers.utils.Interface(
    (await getAbis()).liquidityWalletAbi
  );

  if (txReceipt.status === 0) {
    return false;
  }

  return (
    txReceipt.logs.find(
      (log) => iface.parseLog(log).name === 'LogOfferPaid'
    ) !== undefined
  );
}

/**
 * This function checks if a transaction has successfully set a status and returns whether it is active
 * or not.
 * @param rpc - The RPC (Remote Procedure Call) endpoint used to communicate with the Ethereum network.
 * It is used to retrieve the transaction receipt for a given hash.
 * @param hash - The `hash` parameter is a string representing the transaction hash of a transaction on
 * the Ethereum blockchain.
 * @returns An object with two properties: "isSetStatus" and "isActive". The "isSetStatus" property is
 * a boolean indicating whether the transaction with the given hash resulted in a successful status
 * change. The "isActive" property is a boolean indicating whether the status change resulted in the
 * offer being active or inactive.
 */
export async function isSetStatusFromHash(rpc, hash) {
  const provider = getProviderFromRpc(rpc);
  const txReceipt = await provider.getTransactionReceipt(hash);
  const iface = new ethers.utils.Interface((await getAbis()).poolAbi);

  let isActive = undefined;

  const isSetStatus =
    txReceipt.status !== 0 &&
    txReceipt.logs.find((log) => {
      const parsedLog = iface.parseLog(log);
      if (parsedLog.name === 'LogSetStatusOffer') {
        isActive = parsedLog.args[1];
        return true;
      }
      return false;
    }) !== undefined;

  return {
    isSetStatus: isSetStatus,
    isActive: isActive,
  };
}

/**
 * This function returns a new instance of the JsonRpcProvider class from the ethers.providers module
 * using the provided rpc parameter.
 * @param rpc - The `rpc` parameter is a string representing the URL of an Ethereum JSON-RPC endpoint.
 * This function creates a new instance of the `JsonRpcProvider` class from the `ethers.providers`
 * module using the provided `rpc` URL. This provider can be used to interact with the Ethereum network
 * @returns A function that takes an RPC endpoint as an argument and returns a new instance of the
 * `JsonRpcProvider` class from the `ethers.providers` library, which can be used to interact with an
 * Ethereum node over JSON-RPC.
 */
export function getProviderFromRpc(rpc) {
  return new ethers.providers.JsonRpcProvider(rpc);
}

/**
 * The function retrieves ABIs (Application Binary Interfaces) for various contracts from specified
 * URLs and returns them as an object.
 * @returns The `getAbis` function returns an object with four properties: `poolAbi`, `tokenAbi`,
 * `liquidityWalletAbi`, and `satelliteAbi`. The first three properties contain the ABI (Application
 * Binary Interface) data for three different smart contracts, while the `satelliteAbi` property is set
 * to `null`. The ABI data is obtained by making HTTP
 */
export const getAbis = async () => {
  const promises = [
    'https://raw.githubusercontent.com/grindery-io/Depay-Reality/main/abis/GrtPool.json',
    'https://raw.githubusercontent.com/grindery-io/Depay-Reality/main/abis/ERC20Sample.json',
    'https://raw.githubusercontent.com/grindery-io/Depay-Reality/main/abis/GrtLiquidityWallet.json',
  ].map(async (url) => {
    const result = await axios.get(url).catch(() => {
      return null;
    });
    return result?.data || null;
  });

  const results = await Promise.all(promises);

  return {
    poolAbi: results[0],
    tokenAbi: results[1],
    liquidityWalletAbi: results[2],
    satelliteAbi: null,
  };
};
