const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'dealers',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const getDealerFeedProfileByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetDealerFeedProfileById', inputVars);
}
getDealerFeedProfileByIdRef.operationName = 'GetDealerFeedProfileById';
exports.getDealerFeedProfileByIdRef = getDealerFeedProfileByIdRef;

exports.getDealerFeedProfileById = function getDealerFeedProfileById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getDealerFeedProfileByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listDealerFeedProfilesBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDealerFeedProfilesBySeller', inputVars);
}
listDealerFeedProfilesBySellerRef.operationName = 'ListDealerFeedProfilesBySeller';
exports.listDealerFeedProfilesBySellerRef = listDealerFeedProfilesBySellerRef;

exports.listDealerFeedProfilesBySeller = function listDealerFeedProfilesBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listDealerFeedProfilesBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listDealerFeedProfilesByStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDealerFeedProfilesByStatus', inputVars);
}
listDealerFeedProfilesByStatusRef.operationName = 'ListDealerFeedProfilesByStatus';
exports.listDealerFeedProfilesByStatusRef = listDealerFeedProfilesByStatusRef;

exports.listDealerFeedProfilesByStatus = function listDealerFeedProfilesByStatus(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listDealerFeedProfilesByStatusRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listDealerListingsByFeedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDealerListingsByFeed', inputVars);
}
listDealerListingsByFeedRef.operationName = 'ListDealerListingsByFeed';
exports.listDealerListingsByFeedRef = listDealerListingsByFeedRef;

exports.listDealerListingsByFeed = function listDealerListingsByFeed(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listDealerListingsByFeedRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listDealerListingsBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDealerListingsBySeller', inputVars);
}
listDealerListingsBySellerRef.operationName = 'ListDealerListingsBySeller';
exports.listDealerListingsBySellerRef = listDealerListingsBySellerRef;

exports.listDealerListingsBySeller = function listDealerListingsBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listDealerListingsBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getDealerListingByHashRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetDealerListingByHash', inputVars);
}
getDealerListingByHashRef.operationName = 'GetDealerListingByHash';
exports.getDealerListingByHashRef = getDealerListingByHashRef;

exports.getDealerListingByHash = function getDealerListingByHash(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getDealerListingByHashRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listIngestLogsByFeedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListIngestLogsByFeed', inputVars);
}
listIngestLogsByFeedRef.operationName = 'ListIngestLogsByFeed';
exports.listIngestLogsByFeedRef = listIngestLogsByFeedRef;

exports.listIngestLogsByFeed = function listIngestLogsByFeed(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listIngestLogsByFeedRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listIngestLogsBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListIngestLogsBySeller', inputVars);
}
listIngestLogsBySellerRef.operationName = 'ListIngestLogsBySeller';
exports.listIngestLogsBySellerRef = listIngestLogsBySellerRef;

exports.listIngestLogsBySeller = function listIngestLogsBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listIngestLogsBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listAuditLogsByFeedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAuditLogsByFeed', inputVars);
}
listAuditLogsByFeedRef.operationName = 'ListAuditLogsByFeed';
exports.listAuditLogsByFeedRef = listAuditLogsByFeedRef;

exports.listAuditLogsByFeed = function listAuditLogsByFeed(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listAuditLogsByFeedRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listWebhooksByDealerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListWebhooksByDealer', inputVars);
}
listWebhooksByDealerRef.operationName = 'ListWebhooksByDealer';
exports.listWebhooksByDealerRef = listWebhooksByDealerRef;

exports.listWebhooksByDealer = function listWebhooksByDealer(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listWebhooksByDealerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getWidgetConfigRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetWidgetConfig', inputVars);
}
getWidgetConfigRef.operationName = 'GetWidgetConfig';
exports.getWidgetConfigRef = getWidgetConfigRef;

exports.getWidgetConfig = function getWidgetConfig(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getWidgetConfigRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const upsertDealerFeedProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDealerFeedProfile', inputVars);
}
upsertDealerFeedProfileRef.operationName = 'UpsertDealerFeedProfile';
exports.upsertDealerFeedProfileRef = upsertDealerFeedProfileRef;

exports.upsertDealerFeedProfile = function upsertDealerFeedProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDealerFeedProfileRef(dcInstance, inputVars));
}
;

const updateDealerFeedProfileSyncStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateDealerFeedProfileSyncStats', inputVars);
}
updateDealerFeedProfileSyncStatsRef.operationName = 'UpdateDealerFeedProfileSyncStats';
exports.updateDealerFeedProfileSyncStatsRef = updateDealerFeedProfileSyncStatsRef;

exports.updateDealerFeedProfileSyncStats = function updateDealerFeedProfileSyncStats(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateDealerFeedProfileSyncStatsRef(dcInstance, inputVars));
}
;

const upsertDealerListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDealerListing', inputVars);
}
upsertDealerListingRef.operationName = 'UpsertDealerListing';
exports.upsertDealerListingRef = upsertDealerListingRef;

exports.upsertDealerListing = function upsertDealerListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDealerListingRef(dcInstance, inputVars));
}
;

const insertDealerFeedIngestLogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertDealerFeedIngestLog', inputVars);
}
insertDealerFeedIngestLogRef.operationName = 'InsertDealerFeedIngestLog';
exports.insertDealerFeedIngestLogRef = insertDealerFeedIngestLogRef;

exports.insertDealerFeedIngestLog = function insertDealerFeedIngestLog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertDealerFeedIngestLogRef(dcInstance, inputVars));
}
;

const insertDealerAuditLogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertDealerAuditLog', inputVars);
}
insertDealerAuditLogRef.operationName = 'InsertDealerAuditLog';
exports.insertDealerAuditLogRef = insertDealerAuditLogRef;

exports.insertDealerAuditLog = function insertDealerAuditLog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertDealerAuditLogRef(dcInstance, inputVars));
}
;

const upsertDealerWebhookSubscriptionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDealerWebhookSubscription', inputVars);
}
upsertDealerWebhookSubscriptionRef.operationName = 'UpsertDealerWebhookSubscription';
exports.upsertDealerWebhookSubscriptionRef = upsertDealerWebhookSubscriptionRef;

exports.upsertDealerWebhookSubscription = function upsertDealerWebhookSubscription(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDealerWebhookSubscriptionRef(dcInstance, inputVars));
}
;

const upsertDealerWidgetConfigRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDealerWidgetConfig', inputVars);
}
upsertDealerWidgetConfigRef.operationName = 'UpsertDealerWidgetConfig';
exports.upsertDealerWidgetConfigRef = upsertDealerWidgetConfigRef;

exports.upsertDealerWidgetConfig = function upsertDealerWidgetConfig(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDealerWidgetConfigRef(dcInstance, inputVars));
}
;
