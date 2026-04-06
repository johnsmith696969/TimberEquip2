import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'dealers',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
export const getDealerFeedProfileByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetDealerFeedProfileById', inputVars);
}
getDealerFeedProfileByIdRef.operationName = 'GetDealerFeedProfileById';

export function getDealerFeedProfileById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getDealerFeedProfileByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listDealerFeedProfilesBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDealerFeedProfilesBySeller', inputVars);
}
listDealerFeedProfilesBySellerRef.operationName = 'ListDealerFeedProfilesBySeller';

export function listDealerFeedProfilesBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listDealerFeedProfilesBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listDealerFeedProfilesByStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDealerFeedProfilesByStatus', inputVars);
}
listDealerFeedProfilesByStatusRef.operationName = 'ListDealerFeedProfilesByStatus';

export function listDealerFeedProfilesByStatus(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listDealerFeedProfilesByStatusRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listDealerListingsByFeedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDealerListingsByFeed', inputVars);
}
listDealerListingsByFeedRef.operationName = 'ListDealerListingsByFeed';

export function listDealerListingsByFeed(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listDealerListingsByFeedRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listDealerListingsBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDealerListingsBySeller', inputVars);
}
listDealerListingsBySellerRef.operationName = 'ListDealerListingsBySeller';

export function listDealerListingsBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listDealerListingsBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getDealerListingByHashRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetDealerListingByHash', inputVars);
}
getDealerListingByHashRef.operationName = 'GetDealerListingByHash';

export function getDealerListingByHash(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getDealerListingByHashRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listIngestLogsByFeedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListIngestLogsByFeed', inputVars);
}
listIngestLogsByFeedRef.operationName = 'ListIngestLogsByFeed';

export function listIngestLogsByFeed(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listIngestLogsByFeedRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listIngestLogsBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListIngestLogsBySeller', inputVars);
}
listIngestLogsBySellerRef.operationName = 'ListIngestLogsBySeller';

export function listIngestLogsBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listIngestLogsBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listAuditLogsByFeedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAuditLogsByFeed', inputVars);
}
listAuditLogsByFeedRef.operationName = 'ListAuditLogsByFeed';

export function listAuditLogsByFeed(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listAuditLogsByFeedRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listWebhooksByDealerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListWebhooksByDealer', inputVars);
}
listWebhooksByDealerRef.operationName = 'ListWebhooksByDealer';

export function listWebhooksByDealer(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listWebhooksByDealerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getWidgetConfigRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetWidgetConfig', inputVars);
}
getWidgetConfigRef.operationName = 'GetWidgetConfig';

export function getWidgetConfig(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getWidgetConfigRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const upsertDealerFeedProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDealerFeedProfile', inputVars);
}
upsertDealerFeedProfileRef.operationName = 'UpsertDealerFeedProfile';

export function upsertDealerFeedProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDealerFeedProfileRef(dcInstance, inputVars));
}

export const updateDealerFeedProfileSyncStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateDealerFeedProfileSyncStats', inputVars);
}
updateDealerFeedProfileSyncStatsRef.operationName = 'UpdateDealerFeedProfileSyncStats';

export function updateDealerFeedProfileSyncStats(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateDealerFeedProfileSyncStatsRef(dcInstance, inputVars));
}

export const upsertDealerListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDealerListing', inputVars);
}
upsertDealerListingRef.operationName = 'UpsertDealerListing';

export function upsertDealerListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDealerListingRef(dcInstance, inputVars));
}

export const insertDealerFeedIngestLogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertDealerFeedIngestLog', inputVars);
}
insertDealerFeedIngestLogRef.operationName = 'InsertDealerFeedIngestLog';

export function insertDealerFeedIngestLog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertDealerFeedIngestLogRef(dcInstance, inputVars));
}

export const insertDealerAuditLogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertDealerAuditLog', inputVars);
}
insertDealerAuditLogRef.operationName = 'InsertDealerAuditLog';

export function insertDealerAuditLog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertDealerAuditLogRef(dcInstance, inputVars));
}

export const upsertDealerWebhookSubscriptionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDealerWebhookSubscription', inputVars);
}
upsertDealerWebhookSubscriptionRef.operationName = 'UpsertDealerWebhookSubscription';

export function upsertDealerWebhookSubscription(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDealerWebhookSubscriptionRef(dcInstance, inputVars));
}

export const upsertDealerWidgetConfigRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDealerWidgetConfig', inputVars);
}
upsertDealerWidgetConfigRef.operationName = 'UpsertDealerWidgetConfig';

export function upsertDealerWidgetConfig(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDealerWidgetConfigRef(dcInstance, inputVars));
}

