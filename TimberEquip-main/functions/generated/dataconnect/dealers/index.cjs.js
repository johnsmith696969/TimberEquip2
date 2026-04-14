const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'dealers',
  serviceId: 'timberequip-marketplace',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

function getDealerFeedProfileById(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetDealerFeedProfileById', inputVars, inputOpts);
}
exports.getDealerFeedProfileById = getDealerFeedProfileById;

function listDealerFeedProfilesBySeller(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListDealerFeedProfilesBySeller', inputVars, inputOpts);
}
exports.listDealerFeedProfilesBySeller = listDealerFeedProfilesBySeller;

function listDealerFeedProfilesByStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListDealerFeedProfilesByStatus', inputVars, inputOpts);
}
exports.listDealerFeedProfilesByStatus = listDealerFeedProfilesByStatus;

function listDealerListingsByFeed(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListDealerListingsByFeed', inputVars, inputOpts);
}
exports.listDealerListingsByFeed = listDealerListingsByFeed;

function listDealerListingsBySeller(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListDealerListingsBySeller', inputVars, inputOpts);
}
exports.listDealerListingsBySeller = listDealerListingsBySeller;

function getDealerListingByHash(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetDealerListingByHash', inputVars, inputOpts);
}
exports.getDealerListingByHash = getDealerListingByHash;

function listIngestLogsByFeed(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListIngestLogsByFeed', inputVars, inputOpts);
}
exports.listIngestLogsByFeed = listIngestLogsByFeed;

function listIngestLogsBySeller(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListIngestLogsBySeller', inputVars, inputOpts);
}
exports.listIngestLogsBySeller = listIngestLogsBySeller;

function listAuditLogsByFeed(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListAuditLogsByFeed', inputVars, inputOpts);
}
exports.listAuditLogsByFeed = listAuditLogsByFeed;

function listWebhooksByDealer(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListWebhooksByDealer', inputVars, inputOpts);
}
exports.listWebhooksByDealer = listWebhooksByDealer;

function getWidgetConfig(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetWidgetConfig', inputVars, inputOpts);
}
exports.getWidgetConfig = getWidgetConfig;

function upsertDealerFeedProfile(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertDealerFeedProfile', inputVars, inputOpts);
}
exports.upsertDealerFeedProfile = upsertDealerFeedProfile;

function updateDealerFeedProfileSyncStats(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateDealerFeedProfileSyncStats', inputVars, inputOpts);
}
exports.updateDealerFeedProfileSyncStats = updateDealerFeedProfileSyncStats;

function upsertDealerListing(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertDealerListing', inputVars, inputOpts);
}
exports.upsertDealerListing = upsertDealerListing;

function insertDealerFeedIngestLog(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('InsertDealerFeedIngestLog', inputVars, inputOpts);
}
exports.insertDealerFeedIngestLog = insertDealerFeedIngestLog;

function insertDealerAuditLog(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('InsertDealerAuditLog', inputVars, inputOpts);
}
exports.insertDealerAuditLog = insertDealerAuditLog;

function upsertDealerWebhookSubscription(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertDealerWebhookSubscription', inputVars, inputOpts);
}
exports.upsertDealerWebhookSubscription = upsertDealerWebhookSubscription;

function upsertDealerWidgetConfig(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertDealerWidgetConfig', inputVars, inputOpts);
}
exports.upsertDealerWidgetConfig = upsertDealerWidgetConfig;

