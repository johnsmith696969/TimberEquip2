const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'leads',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const getInquiryByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetInquiryById', inputVars);
}
getInquiryByIdRef.operationName = 'GetInquiryById';
exports.getInquiryByIdRef = getInquiryByIdRef;

exports.getInquiryById = function getInquiryById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getInquiryByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listInquiriesBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInquiriesBySeller', inputVars);
}
listInquiriesBySellerRef.operationName = 'ListInquiriesBySeller';
exports.listInquiriesBySellerRef = listInquiriesBySellerRef;

exports.listInquiriesBySeller = function listInquiriesBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listInquiriesBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listInquiriesByBuyerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInquiriesByBuyer', inputVars);
}
listInquiriesByBuyerRef.operationName = 'ListInquiriesByBuyer';
exports.listInquiriesByBuyerRef = listInquiriesByBuyerRef;

exports.listInquiriesByBuyer = function listInquiriesByBuyer(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listInquiriesByBuyerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listInquiriesByListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInquiriesByListing', inputVars);
}
listInquiriesByListingRef.operationName = 'ListInquiriesByListing';
exports.listInquiriesByListingRef = listInquiriesByListingRef;

exports.listInquiriesByListing = function listInquiriesByListing(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listInquiriesByListingRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listInquiriesByStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInquiriesByStatus', inputVars);
}
listInquiriesByStatusRef.operationName = 'ListInquiriesByStatus';
exports.listInquiriesByStatusRef = listInquiriesByStatusRef;

exports.listInquiriesByStatus = function listInquiriesByStatus(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listInquiriesByStatusRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getFinancingRequestByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetFinancingRequestById', inputVars);
}
getFinancingRequestByIdRef.operationName = 'GetFinancingRequestById';
exports.getFinancingRequestByIdRef = getFinancingRequestByIdRef;

exports.getFinancingRequestById = function getFinancingRequestById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getFinancingRequestByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listFinancingRequestsBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFinancingRequestsBySeller', inputVars);
}
listFinancingRequestsBySellerRef.operationName = 'ListFinancingRequestsBySeller';
exports.listFinancingRequestsBySellerRef = listFinancingRequestsBySellerRef;

exports.listFinancingRequestsBySeller = function listFinancingRequestsBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listFinancingRequestsBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listFinancingRequestsByBuyerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFinancingRequestsByBuyer', inputVars);
}
listFinancingRequestsByBuyerRef.operationName = 'ListFinancingRequestsByBuyer';
exports.listFinancingRequestsByBuyerRef = listFinancingRequestsByBuyerRef;

exports.listFinancingRequestsByBuyer = function listFinancingRequestsByBuyer(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listFinancingRequestsByBuyerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getCallLogByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCallLogById', inputVars);
}
getCallLogByIdRef.operationName = 'GetCallLogById';
exports.getCallLogByIdRef = getCallLogByIdRef;

exports.getCallLogById = function getCallLogById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getCallLogByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listCallLogsBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCallLogsBySeller', inputVars);
}
listCallLogsBySellerRef.operationName = 'ListCallLogsBySeller';
exports.listCallLogsBySellerRef = listCallLogsBySellerRef;

exports.listCallLogsBySeller = function listCallLogsBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCallLogsBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listCallLogsByListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCallLogsByListing', inputVars);
}
listCallLogsByListingRef.operationName = 'ListCallLogsByListing';
exports.listCallLogsByListingRef = listCallLogsByListingRef;

exports.listCallLogsByListing = function listCallLogsByListing(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCallLogsByListingRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listContactRequestsByStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListContactRequestsByStatus', inputVars);
}
listContactRequestsByStatusRef.operationName = 'ListContactRequestsByStatus';
exports.listContactRequestsByStatusRef = listContactRequestsByStatusRef;

exports.listContactRequestsByStatus = function listContactRequestsByStatus(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listContactRequestsByStatusRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const upsertInquiryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertInquiry', inputVars);
}
upsertInquiryRef.operationName = 'UpsertInquiry';
exports.upsertInquiryRef = upsertInquiryRef;

exports.upsertInquiry = function upsertInquiry(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertInquiryRef(dcInstance, inputVars));
}
;

const updateInquiryStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInquiryStatus', inputVars);
}
updateInquiryStatusRef.operationName = 'UpdateInquiryStatus';
exports.updateInquiryStatusRef = updateInquiryStatusRef;

exports.updateInquiryStatus = function updateInquiryStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateInquiryStatusRef(dcInstance, inputVars));
}
;

const upsertFinancingRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertFinancingRequest', inputVars);
}
upsertFinancingRequestRef.operationName = 'UpsertFinancingRequest';
exports.upsertFinancingRequestRef = upsertFinancingRequestRef;

exports.upsertFinancingRequest = function upsertFinancingRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertFinancingRequestRef(dcInstance, inputVars));
}
;

const insertCallLogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertCallLog', inputVars);
}
insertCallLogRef.operationName = 'InsertCallLog';
exports.insertCallLogRef = insertCallLogRef;

exports.insertCallLog = function insertCallLog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertCallLogRef(dcInstance, inputVars));
}
;

const insertContactRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertContactRequest', inputVars);
}
insertContactRequestRef.operationName = 'InsertContactRequest';
exports.insertContactRequestRef = insertContactRequestRef;

exports.insertContactRequest = function insertContactRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertContactRequestRef(dcInstance, inputVars));
}
;

const updateContactRequestStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateContactRequestStatus', inputVars);
}
updateContactRequestStatusRef.operationName = 'UpdateContactRequestStatus';
exports.updateContactRequestStatusRef = updateContactRequestStatusRef;

exports.updateContactRequestStatus = function updateContactRequestStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateContactRequestStatusRef(dcInstance, inputVars));
}
;
