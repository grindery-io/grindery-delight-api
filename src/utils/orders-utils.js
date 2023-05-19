export const ORDER_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success', // the order has been created
  FAILURE: 'failure', // the order creation failed
  COMPLETION: 'completion',
  COMPLETE: 'complete', // it means that the order is fully completed and paid for (this is confirmed by the blockchain)
  COMPLETION_FAILURE: 'completionFailure', // it means that Gordon tried to pay for the order but it failed
};
