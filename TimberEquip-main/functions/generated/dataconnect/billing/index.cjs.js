const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'billing',
  serviceId: 'timberequip-marketplace',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

function getSubscriptionsByUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetSubscriptionsByUser', inputVars, inputOpts);
}
exports.getSubscriptionsByUser = getSubscriptionsByUser;

function getActiveSubscriptionForListing(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetActiveSubscriptionForListing', inputVars, inputOpts);
}
exports.getActiveSubscriptionForListing = getActiveSubscriptionForListing;

function getSubscriptionByStripeId(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetSubscriptionByStripeId', inputVars, inputOpts);
}
exports.getSubscriptionByStripeId = getSubscriptionByStripeId;

function getInvoicesByUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetInvoicesByUser', inputVars, inputOpts);
}
exports.getInvoicesByUser = getInvoicesByUser;

function getSellerApplicationsByUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetSellerApplicationsByUser', inputVars, inputOpts);
}
exports.getSellerApplicationsByUser = getSellerApplicationsByUser;

function upsertSubscription(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertSubscription', inputVars, inputOpts);
}
exports.upsertSubscription = upsertSubscription;

function upsertInvoice(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertInvoice', inputVars, inputOpts);
}
exports.upsertInvoice = upsertInvoice;

function upsertSellerApplication(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertSellerApplication', inputVars, inputOpts);
}
exports.upsertSellerApplication = upsertSellerApplication;

function updateSubscriptionStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateSubscriptionStatus', inputVars, inputOpts);
}
exports.updateSubscriptionStatus = updateSubscriptionStatus;

function updateInvoiceStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateInvoiceStatus', inputVars, inputOpts);
}
exports.updateInvoiceStatus = updateInvoiceStatus;

