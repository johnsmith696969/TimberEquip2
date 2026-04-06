const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'auctions',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const getAuctionByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionById', inputVars);
}
getAuctionByIdRef.operationName = 'GetAuctionById';
exports.getAuctionByIdRef = getAuctionByIdRef;

exports.getAuctionById = function getAuctionById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getAuctionBySlugRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionBySlug', inputVars);
}
getAuctionBySlugRef.operationName = 'GetAuctionBySlug';
exports.getAuctionBySlugRef = getAuctionBySlugRef;

exports.getAuctionBySlug = function getAuctionBySlug(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionBySlugRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listActiveAuctionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListActiveAuctions', inputVars);
}
listActiveAuctionsRef.operationName = 'ListActiveAuctions';
exports.listActiveAuctionsRef = listActiveAuctionsRef;

exports.listActiveAuctions = function listActiveAuctions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listActiveAuctionsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listAuctionsByStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAuctionsByStatus', inputVars);
}
listAuctionsByStatusRef.operationName = 'ListAuctionsByStatus';
exports.listAuctionsByStatusRef = listAuctionsByStatusRef;

exports.listAuctionsByStatus = function listAuctionsByStatus(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listAuctionsByStatusRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getLotsByAuctionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLotsByAuction', inputVars);
}
getLotsByAuctionRef.operationName = 'GetLotsByAuction';
exports.getLotsByAuctionRef = getLotsByAuctionRef;

exports.getLotsByAuction = function getLotsByAuction(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getLotsByAuctionRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getLotByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLotById', inputVars);
}
getLotByIdRef.operationName = 'GetLotById';
exports.getLotByIdRef = getLotByIdRef;

exports.getLotById = function getLotById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getLotByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getPromotedLotsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPromotedLots', inputVars);
}
getPromotedLotsRef.operationName = 'GetPromotedLots';
exports.getPromotedLotsRef = getPromotedLotsRef;

exports.getPromotedLots = function getPromotedLots(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getPromotedLotsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getBidsByLotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBidsByLot', inputVars);
}
getBidsByLotRef.operationName = 'GetBidsByLot';
exports.getBidsByLotRef = getBidsByLotRef;

exports.getBidsByLot = function getBidsByLot(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getBidsByLotRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getBidsByBidderRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBidsByBidder', inputVars);
}
getBidsByBidderRef.operationName = 'GetBidsByBidder';
exports.getBidsByBidderRef = getBidsByBidderRef;

exports.getBidsByBidder = function getBidsByBidder(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getBidsByBidderRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getAuctionInvoicesByBuyerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionInvoicesByBuyer', inputVars);
}
getAuctionInvoicesByBuyerRef.operationName = 'GetAuctionInvoicesByBuyer';
exports.getAuctionInvoicesByBuyerRef = getAuctionInvoicesByBuyerRef;

exports.getAuctionInvoicesByBuyer = function getAuctionInvoicesByBuyer(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionInvoicesByBuyerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getAuctionInvoicesByAuctionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionInvoicesByAuction', inputVars);
}
getAuctionInvoicesByAuctionRef.operationName = 'GetAuctionInvoicesByAuction';
exports.getAuctionInvoicesByAuctionRef = getAuctionInvoicesByAuctionRef;

exports.getAuctionInvoicesByAuction = function getAuctionInvoicesByAuction(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionInvoicesByAuctionRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getAuctionInvoiceByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAuctionInvoiceById', inputVars);
}
getAuctionInvoiceByIdRef.operationName = 'GetAuctionInvoiceById';
exports.getAuctionInvoiceByIdRef = getAuctionInvoiceByIdRef;

exports.getAuctionInvoiceById = function getAuctionInvoiceById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAuctionInvoiceByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getBidderProfileByUserIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBidderProfileByUserId', inputVars);
}
getBidderProfileByUserIdRef.operationName = 'GetBidderProfileByUserId';
exports.getBidderProfileByUserIdRef = getBidderProfileByUserIdRef;

exports.getBidderProfileByUserId = function getBidderProfileByUserId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getBidderProfileByUserIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const upsertAuctionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertAuction', inputVars);
}
upsertAuctionRef.operationName = 'UpsertAuction';
exports.upsertAuctionRef = upsertAuctionRef;

exports.upsertAuction = function upsertAuction(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertAuctionRef(dcInstance, inputVars));
}
;

const upsertAuctionLotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertAuctionLot', inputVars);
}
upsertAuctionLotRef.operationName = 'UpsertAuctionLot';
exports.upsertAuctionLotRef = upsertAuctionLotRef;

exports.upsertAuctionLot = function upsertAuctionLot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertAuctionLotRef(dcInstance, inputVars));
}
;

const insertAuctionBidRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertAuctionBid', inputVars);
}
insertAuctionBidRef.operationName = 'InsertAuctionBid';
exports.insertAuctionBidRef = insertAuctionBidRef;

exports.insertAuctionBid = function insertAuctionBid(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertAuctionBidRef(dcInstance, inputVars));
}
;

const updateBidStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateBidStatus', inputVars);
}
updateBidStatusRef.operationName = 'UpdateBidStatus';
exports.updateBidStatusRef = updateBidStatusRef;

exports.updateBidStatus = function updateBidStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateBidStatusRef(dcInstance, inputVars));
}
;

const upsertAuctionInvoiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertAuctionInvoice', inputVars);
}
upsertAuctionInvoiceRef.operationName = 'UpsertAuctionInvoice';
exports.upsertAuctionInvoiceRef = upsertAuctionInvoiceRef;

exports.upsertAuctionInvoice = function upsertAuctionInvoice(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertAuctionInvoiceRef(dcInstance, inputVars));
}
;

const updateAuctionInvoiceStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionInvoiceStatus', inputVars);
}
updateAuctionInvoiceStatusRef.operationName = 'UpdateAuctionInvoiceStatus';
exports.updateAuctionInvoiceStatusRef = updateAuctionInvoiceStatusRef;

exports.updateAuctionInvoiceStatus = function updateAuctionInvoiceStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionInvoiceStatusRef(dcInstance, inputVars));
}
;

const updateAuctionLotBidStateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionLotBidState', inputVars);
}
updateAuctionLotBidStateRef.operationName = 'UpdateAuctionLotBidState';
exports.updateAuctionLotBidStateRef = updateAuctionLotBidStateRef;

exports.updateAuctionLotBidState = function updateAuctionLotBidState(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionLotBidStateRef(dcInstance, inputVars));
}
;

const updateAuctionLotStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionLotStatus', inputVars);
}
updateAuctionLotStatusRef.operationName = 'UpdateAuctionLotStatus';
exports.updateAuctionLotStatusRef = updateAuctionLotStatusRef;

exports.updateAuctionLotStatus = function updateAuctionLotStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionLotStatusRef(dcInstance, inputVars));
}
;

const upsertBidderProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertBidderProfile', inputVars);
}
upsertBidderProfileRef.operationName = 'UpsertBidderProfile';
exports.upsertBidderProfileRef = upsertBidderProfileRef;

exports.upsertBidderProfile = function upsertBidderProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertBidderProfileRef(dcInstance, inputVars));
}
;

const updateAuctionStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionStatus', inputVars);
}
updateAuctionStatusRef.operationName = 'UpdateAuctionStatus';
exports.updateAuctionStatusRef = updateAuctionStatusRef;

exports.updateAuctionStatus = function updateAuctionStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionStatusRef(dcInstance, inputVars));
}
;

const updateAuctionStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAuctionStats', inputVars);
}
updateAuctionStatsRef.operationName = 'UpdateAuctionStats';
exports.updateAuctionStatsRef = updateAuctionStatsRef;

exports.updateAuctionStats = function updateAuctionStats(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAuctionStatsRef(dcInstance, inputVars));
}
;
