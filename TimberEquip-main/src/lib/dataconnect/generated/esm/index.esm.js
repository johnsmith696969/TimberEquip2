import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'listing-governance',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
export const findListingByFirestoreIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'FindListingByFirestoreId', inputVars);
}
findListingByFirestoreIdRef.operationName = 'FindListingByFirestoreId';

export function findListingByFirestoreId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(findListingByFirestoreIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const insertListingShadowRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertListingShadow', inputVars);
}
insertListingShadowRef.operationName = 'InsertListingShadow';

export function insertListingShadow(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertListingShadowRef(dcInstance, inputVars));
}

export const updateListingShadowRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateListingShadow', inputVars);
}
updateListingShadowRef.operationName = 'UpdateListingShadow';

export function updateListingShadow(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateListingShadowRef(dcInstance, inputVars));
}

export const deleteListingShadowRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteListingShadow', inputVars);
}
deleteListingShadowRef.operationName = 'DeleteListingShadow';

export function deleteListingShadow(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteListingShadowRef(dcInstance, inputVars));
}

export const recordListingStateTransitionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RecordListingStateTransition', inputVars);
}
recordListingStateTransitionRef.operationName = 'RecordListingStateTransition';

export function recordListingStateTransition(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(recordListingStateTransitionRef(dcInstance, inputVars));
}

export const getListingGovernanceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetListingGovernance', inputVars);
}
getListingGovernanceRef.operationName = 'GetListingGovernance';

export function getListingGovernance(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getListingGovernanceRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listLifecycleQueueRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListLifecycleQueue', inputVars);
}
listLifecycleQueueRef.operationName = 'ListLifecycleQueue';

export function listLifecycleQueue(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listLifecycleQueueRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listListingTransitionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListListingTransitions', inputVars);
}
listListingTransitionsRef.operationName = 'ListListingTransitions';

export function listListingTransitions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listListingTransitionsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listOpenListingAnomaliesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListOpenListingAnomalies', inputVars);
}
listOpenListingAnomaliesRef.operationName = 'ListOpenListingAnomalies';

export function listOpenListingAnomalies(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listOpenListingAnomaliesRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const submitListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SubmitListing', inputVars);
}
submitListingRef.operationName = 'SubmitListing';

export function submitListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(submitListingRef(dcInstance, inputVars));
}

export const approveListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ApproveListing', inputVars);
}
approveListingRef.operationName = 'ApproveListing';

export function approveListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(approveListingRef(dcInstance, inputVars));
}

export const rejectListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RejectListing', inputVars);
}
rejectListingRef.operationName = 'RejectListing';

export function rejectListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(rejectListingRef(dcInstance, inputVars));
}

export const confirmListingPaymentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ConfirmListingPayment', inputVars);
}
confirmListingPaymentRef.operationName = 'ConfirmListingPayment';

export function confirmListingPayment(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(confirmListingPaymentRef(dcInstance, inputVars));
}

export const publishListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'PublishListing', inputVars);
}
publishListingRef.operationName = 'PublishListing';

export function publishListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(publishListingRef(dcInstance, inputVars));
}

export const expireListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ExpireListing', inputVars);
}
expireListingRef.operationName = 'ExpireListing';

export function expireListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(expireListingRef(dcInstance, inputVars));
}

export const relistListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RelistListing', inputVars);
}
relistListingRef.operationName = 'RelistListing';

export function relistListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(relistListingRef(dcInstance, inputVars));
}

export const markListingSoldRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkListingSold', inputVars);
}
markListingSoldRef.operationName = 'MarkListingSold';

export function markListingSold(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(markListingSoldRef(dcInstance, inputVars));
}

export const archiveListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ArchiveListing', inputVars);
}
archiveListingRef.operationName = 'ArchiveListing';

export function archiveListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(archiveListingRef(dcInstance, inputVars));
}

export const resolveListingAnomalyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ResolveListingAnomaly', inputVars);
}
resolveListingAnomalyRef.operationName = 'ResolveListingAnomaly';

export function resolveListingAnomaly(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(resolveListingAnomalyRef(dcInstance, inputVars));
}

