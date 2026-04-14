import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'billing',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
export const getSubscriptionsByUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSubscriptionsByUser', inputVars);
}
getSubscriptionsByUserRef.operationName = 'GetSubscriptionsByUser';

export function getSubscriptionsByUser(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getSubscriptionsByUserRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getActiveSubscriptionForListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetActiveSubscriptionForListing', inputVars);
}
getActiveSubscriptionForListingRef.operationName = 'GetActiveSubscriptionForListing';

export function getActiveSubscriptionForListing(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getActiveSubscriptionForListingRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getSubscriptionByStripeIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSubscriptionByStripeId', inputVars);
}
getSubscriptionByStripeIdRef.operationName = 'GetSubscriptionByStripeId';

export function getSubscriptionByStripeId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getSubscriptionByStripeIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getInvoicesByUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetInvoicesByUser', inputVars);
}
getInvoicesByUserRef.operationName = 'GetInvoicesByUser';

export function getInvoicesByUser(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getInvoicesByUserRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getSellerApplicationsByUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSellerApplicationsByUser', inputVars);
}
getSellerApplicationsByUserRef.operationName = 'GetSellerApplicationsByUser';

export function getSellerApplicationsByUser(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getSellerApplicationsByUserRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const upsertSubscriptionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertSubscription', inputVars);
}
upsertSubscriptionRef.operationName = 'UpsertSubscription';

export function upsertSubscription(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertSubscriptionRef(dcInstance, inputVars));
}

export const upsertInvoiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertInvoice', inputVars);
}
upsertInvoiceRef.operationName = 'UpsertInvoice';

export function upsertInvoice(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertInvoiceRef(dcInstance, inputVars));
}

export const upsertSellerApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertSellerApplication', inputVars);
}
upsertSellerApplicationRef.operationName = 'UpsertSellerApplication';

export function upsertSellerApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertSellerApplicationRef(dcInstance, inputVars));
}

export const updateSubscriptionStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateSubscriptionStatus', inputVars);
}
updateSubscriptionStatusRef.operationName = 'UpdateSubscriptionStatus';

export function updateSubscriptionStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateSubscriptionStatusRef(dcInstance, inputVars));
}

export const updateInvoiceStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInvoiceStatus', inputVars);
}
updateInvoiceStatusRef.operationName = 'UpdateInvoiceStatus';

export function updateInvoiceStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateInvoiceStatusRef(dcInstance, inputVars));
}

