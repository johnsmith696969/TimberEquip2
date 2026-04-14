import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'leads',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
export const getInquiryByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetInquiryById', inputVars);
}
getInquiryByIdRef.operationName = 'GetInquiryById';

export function getInquiryById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getInquiryByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listInquiriesBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInquiriesBySeller', inputVars);
}
listInquiriesBySellerRef.operationName = 'ListInquiriesBySeller';

export function listInquiriesBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listInquiriesBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listInquiriesByBuyerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInquiriesByBuyer', inputVars);
}
listInquiriesByBuyerRef.operationName = 'ListInquiriesByBuyer';

export function listInquiriesByBuyer(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listInquiriesByBuyerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listInquiriesByListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInquiriesByListing', inputVars);
}
listInquiriesByListingRef.operationName = 'ListInquiriesByListing';

export function listInquiriesByListing(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listInquiriesByListingRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listInquiriesByStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInquiriesByStatus', inputVars);
}
listInquiriesByStatusRef.operationName = 'ListInquiriesByStatus';

export function listInquiriesByStatus(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listInquiriesByStatusRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getFinancingRequestByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetFinancingRequestById', inputVars);
}
getFinancingRequestByIdRef.operationName = 'GetFinancingRequestById';

export function getFinancingRequestById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getFinancingRequestByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listFinancingRequestsBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFinancingRequestsBySeller', inputVars);
}
listFinancingRequestsBySellerRef.operationName = 'ListFinancingRequestsBySeller';

export function listFinancingRequestsBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listFinancingRequestsBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listFinancingRequestsByBuyerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFinancingRequestsByBuyer', inputVars);
}
listFinancingRequestsByBuyerRef.operationName = 'ListFinancingRequestsByBuyer';

export function listFinancingRequestsByBuyer(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listFinancingRequestsByBuyerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getCallLogByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCallLogById', inputVars);
}
getCallLogByIdRef.operationName = 'GetCallLogById';

export function getCallLogById(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getCallLogByIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listCallLogsBySellerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCallLogsBySeller', inputVars);
}
listCallLogsBySellerRef.operationName = 'ListCallLogsBySeller';

export function listCallLogsBySeller(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCallLogsBySellerRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listCallLogsByListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCallLogsByListing', inputVars);
}
listCallLogsByListingRef.operationName = 'ListCallLogsByListing';

export function listCallLogsByListing(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCallLogsByListingRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listContactRequestsByStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListContactRequestsByStatus', inputVars);
}
listContactRequestsByStatusRef.operationName = 'ListContactRequestsByStatus';

export function listContactRequestsByStatus(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listContactRequestsByStatusRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const upsertInquiryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertInquiry', inputVars);
}
upsertInquiryRef.operationName = 'UpsertInquiry';

export function upsertInquiry(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertInquiryRef(dcInstance, inputVars));
}

export const updateInquiryStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInquiryStatus', inputVars);
}
updateInquiryStatusRef.operationName = 'UpdateInquiryStatus';

export function updateInquiryStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateInquiryStatusRef(dcInstance, inputVars));
}

export const upsertFinancingRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertFinancingRequest', inputVars);
}
upsertFinancingRequestRef.operationName = 'UpsertFinancingRequest';

export function upsertFinancingRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertFinancingRequestRef(dcInstance, inputVars));
}

export const insertCallLogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertCallLog', inputVars);
}
insertCallLogRef.operationName = 'InsertCallLog';

export function insertCallLog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertCallLogRef(dcInstance, inputVars));
}

export const insertContactRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertContactRequest', inputVars);
}
insertContactRequestRef.operationName = 'InsertContactRequest';

export function insertContactRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertContactRequestRef(dcInstance, inputVars));
}

export const updateContactRequestStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateContactRequestStatus', inputVars);
}
updateContactRequestStatusRef.operationName = 'UpdateContactRequestStatus';

export function updateContactRequestStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateContactRequestStatusRef(dcInstance, inputVars));
}

