import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'auctions',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
export const getAuctionByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionById', inputVars);
}
getAuctionByIdRef.operationName = 'GetAuctionById';

export function getAuctionById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getAuctionBySlugRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionBySlug', inputVars);
}
getAuctionBySlugRef.operationName = 'GetAuctionBySlug';

export function getAuctionBySlug(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionBySlugRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listActiveAuctionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListActiveAuctions', inputVars);
}
listActiveAuctionsRef.operationName = 'ListActiveAuctions';

export function listActiveAuctions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listActiveAuctionsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listAuctionsByStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAuctionsByStatus', inputVars);
}
listAuctionsByStatusRef.operationName = 'ListAuctionsByStatus';

export function listAuctionsByStatus(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listAuctionsByStatusRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getLotsByAuctionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLotsByAuction', inputVars);
}
getLotsByAuctionRef.operationName = 'GetLotsByAuction';

export function getLotsByAuction(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getLotsByAuctionRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getLotByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLotById', inputVars);
}
getLotByIdRef.operationName = 'GetLotById';

export function getLotById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getLotByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getPromotedLotsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPromotedLots', inputVars);
}
getPromotedLotsRef.operationName = 'GetPromotedLots';

export function getPromotedLots(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getPromotedLotsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getBidsByLotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBidsByLot', inputVars);
}
getBidsByLotRef.operationName = 'GetBidsByLot';

export function getBidsByLot(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getBidsByLotRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getBidsByBidderRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBidsByBidder', inputVars);
}
getBidsByBidderRef.operationName = 'GetBidsByBidder';

export function getBidsByBidder(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getBidsByBidderRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getAuctionInvoicesByBuyerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionInvoicesByBuyer', inputVars);
}
getAuctionInvoicesByBuyerRef.operationName = 'GetAuctionInvoicesByBuyer';

export function getAuctionInvoicesByBuyer(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionInvoicesByBuyerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getAuctionInvoicesByAuctionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionInvoicesByAuction', inputVars);
}
getAuctionInvoicesByAuctionRef.operationName = 'GetAuctionInvoicesByAuction';

export function getAuctionInvoicesByAuction(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionInvoicesByAuctionRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getAuctionInvoiceByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionInvoiceById', inputVars);
}
getAuctionInvoiceByIdRef.operationName = 'GetAuctionInvoiceById';

export function getAuctionInvoiceById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionInvoiceByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getBidderProfileByUserIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBidderProfileByUserId', inputVars);
}
getBidderProfileByUserIdRef.operationName = 'GetBidderProfileByUserId';

export function getBidderProfileByUserId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getBidderProfileByUserIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const upsertAuctionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertAuction', inputVars);
}
upsertAuctionRef.operationName = 'UpsertAuction';

export function upsertAuction(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertAuctionRef(dcInstance, inputVars));
}

export const upsertAuctionLotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertAuctionLot', inputVars);
}
upsertAuctionLotRef.operationName = 'UpsertAuctionLot';

export function upsertAuctionLot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertAuctionLotRef(dcInstance, inputVars));
}

export const insertAuctionBidRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertAuctionBid', inputVars);
}
insertAuctionBidRef.operationName = 'InsertAuctionBid';

export function insertAuctionBid(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertAuctionBidRef(dcInstance, inputVars));
}

export const updateBidStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateBidStatus', inputVars);
}
updateBidStatusRef.operationName = 'UpdateBidStatus';

export function updateBidStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateBidStatusRef(dcInstance, inputVars));
}

export const upsertAuctionInvoiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertAuctionInvoice', inputVars);
}
upsertAuctionInvoiceRef.operationName = 'UpsertAuctionInvoice';

export function upsertAuctionInvoice(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertAuctionInvoiceRef(dcInstance, inputVars));
}

export const updateAuctionInvoiceStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionInvoiceStatus', inputVars);
}
updateAuctionInvoiceStatusRef.operationName = 'UpdateAuctionInvoiceStatus';

export function updateAuctionInvoiceStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionInvoiceStatusRef(dcInstance, inputVars));
}

export const updateAuctionLotBidStateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionLotBidState', inputVars);
}
updateAuctionLotBidStateRef.operationName = 'UpdateAuctionLotBidState';

export function updateAuctionLotBidState(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionLotBidStateRef(dcInstance, inputVars));
}

export const updateAuctionLotStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionLotStatus', inputVars);
}
updateAuctionLotStatusRef.operationName = 'UpdateAuctionLotStatus';

export function updateAuctionLotStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionLotStatusRef(dcInstance, inputVars));
}

export const upsertBidderProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertBidderProfile', inputVars);
}
upsertBidderProfileRef.operationName = 'UpsertBidderProfile';

export function upsertBidderProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertBidderProfileRef(dcInstance, inputVars));
}

export const updateAuctionStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionStatus', inputVars);
}
updateAuctionStatusRef.operationName = 'UpdateAuctionStatus';

export function updateAuctionStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionStatusRef(dcInstance, inputVars));
}

export const updateAuctionStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionStats', inputVars);
}
updateAuctionStatsRef.operationName = 'UpdateAuctionStats';

export function updateAuctionStats(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionStatsRef(dcInstance, inputVars));
}

