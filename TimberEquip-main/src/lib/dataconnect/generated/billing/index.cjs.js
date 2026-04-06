const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'billing',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const getSubscriptionsByUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSubscriptionsByUser', inputVars);
}
getSubscriptionsByUserRef.operationName = 'GetSubscriptionsByUser';
exports.getSubscriptionsByUserRef = getSubscriptionsByUserRef;

exports.getSubscriptionsByUser = function getSubscriptionsByUser(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getSubscriptionsByUserRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getActiveSubscriptionForListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetActiveSubscriptionForListing', inputVars);
}
getActiveSubscriptionForListingRef.operationName = 'GetActiveSubscriptionForListing';
exports.getActiveSubscriptionForListingRef = getActiveSubscriptionForListingRef;

exports.getActiveSubscriptionForListing = function getActiveSubscriptionForListing(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getActiveSubscriptionForListingRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getSubscriptionByStripeIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSubscriptionByStripeId', inputVars);
}
getSubscriptionByStripeIdRef.operationName = 'GetSubscriptionByStripeId';
exports.getSubscriptionByStripeIdRef = getSubscriptionByStripeIdRef;

exports.getSubscriptionByStripeId = function getSubscriptionByStripeId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getSubscriptionByStripeIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getInvoicesByUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetInvoicesByUser', inputVars);
}
getInvoicesByUserRef.operationName = 'GetInvoicesByUser';
exports.getInvoicesByUserRef = getInvoicesByUserRef;

exports.getInvoicesByUser = function getInvoicesByUser(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getInvoicesByUserRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getSellerApplicationsByUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSellerApplicationsByUser', inputVars);
}
getSellerApplicationsByUserRef.operationName = 'GetSellerApplicationsByUser';
exports.getSellerApplicationsByUserRef = getSellerApplicationsByUserRef;

exports.getSellerApplicationsByUser = function getSellerApplicationsByUser(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getSellerApplicationsByUserRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const upsertSubscriptionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertSubscription', inputVars);
}
upsertSubscriptionRef.operationName = 'UpsertSubscription';
exports.upsertSubscriptionRef = upsertSubscriptionRef;

exports.upsertSubscription = function upsertSubscription(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertSubscriptionRef(dcInstance, inputVars));
}
;

const upsertInvoiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertInvoice', inputVars);
}
upsertInvoiceRef.operationName = 'UpsertInvoice';
exports.upsertInvoiceRef = upsertInvoiceRef;

exports.upsertInvoice = function upsertInvoice(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertInvoiceRef(dcInstance, inputVars));
}
;

const upsertSellerApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertSellerApplication', inputVars);
}
upsertSellerApplicationRef.operationName = 'UpsertSellerApplication';
exports.upsertSellerApplicationRef = upsertSellerApplicationRef;

exports.upsertSellerApplication = function upsertSellerApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertSellerApplicationRef(dcInstance, inputVars));
}
;

const updateSubscriptionStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateSubscriptionStatus', inputVars);
}
updateSubscriptionStatusRef.operationName = 'UpdateSubscriptionStatus';
exports.updateSubscriptionStatusRef = updateSubscriptionStatusRef;

exports.updateSubscriptionStatus = function updateSubscriptionStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateSubscriptionStatusRef(dcInstance, inputVars));
}
;

const updateInvoiceStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInvoiceStatus', inputVars);
}
updateInvoiceStatusRef.operationName = 'UpdateInvoiceStatus';
exports.updateInvoiceStatusRef = updateInvoiceStatusRef;

exports.updateInvoiceStatus = function updateInvoiceStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateInvoiceStatusRef(dcInstance, inputVars));
}
;
