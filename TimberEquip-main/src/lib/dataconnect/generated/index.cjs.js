const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'listing-governance',
  service: 'timberequip-marketplace',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const findListingByFirestoreIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'FindListingByFirestoreId', inputVars);
}
findListingByFirestoreIdRef.operationName = 'FindListingByFirestoreId';
exports.findListingByFirestoreIdRef = findListingByFirestoreIdRef;

exports.findListingByFirestoreId = function findListingByFirestoreId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(findListingByFirestoreIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const insertListingShadowRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertListingShadow', inputVars);
}
insertListingShadowRef.operationName = 'InsertListingShadow';
exports.insertListingShadowRef = insertListingShadowRef;

exports.insertListingShadow = function insertListingShadow(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertListingShadowRef(dcInstance, inputVars));
}
;

const updateListingShadowRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateListingShadow', inputVars);
}
updateListingShadowRef.operationName = 'UpdateListingShadow';
exports.updateListingShadowRef = updateListingShadowRef;

exports.updateListingShadow = function updateListingShadow(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateListingShadowRef(dcInstance, inputVars));
}
;

const deleteListingShadowRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteListingShadow', inputVars);
}
deleteListingShadowRef.operationName = 'DeleteListingShadow';
exports.deleteListingShadowRef = deleteListingShadowRef;

exports.deleteListingShadow = function deleteListingShadow(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteListingShadowRef(dcInstance, inputVars));
}
;

const recordListingStateTransitionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RecordListingStateTransition', inputVars);
}
recordListingStateTransitionRef.operationName = 'RecordListingStateTransition';
exports.recordListingStateTransitionRef = recordListingStateTransitionRef;

exports.recordListingStateTransition = function recordListingStateTransition(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(recordListingStateTransitionRef(dcInstance, inputVars));
}
;

const getListingGovernanceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetListingGovernance', inputVars);
}
getListingGovernanceRef.operationName = 'GetListingGovernance';
exports.getListingGovernanceRef = getListingGovernanceRef;

exports.getListingGovernance = function getListingGovernance(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getListingGovernanceRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listLifecycleQueueRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListLifecycleQueue', inputVars);
}
listLifecycleQueueRef.operationName = 'ListLifecycleQueue';
exports.listLifecycleQueueRef = listLifecycleQueueRef;

exports.listLifecycleQueue = function listLifecycleQueue(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listLifecycleQueueRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listListingTransitionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListListingTransitions', inputVars);
}
listListingTransitionsRef.operationName = 'ListListingTransitions';
exports.listListingTransitionsRef = listListingTransitionsRef;

exports.listListingTransitions = function listListingTransitions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listListingTransitionsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listOpenListingAnomaliesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListOpenListingAnomalies', inputVars);
}
listOpenListingAnomaliesRef.operationName = 'ListOpenListingAnomalies';
exports.listOpenListingAnomaliesRef = listOpenListingAnomaliesRef;

exports.listOpenListingAnomalies = function listOpenListingAnomalies(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listOpenListingAnomaliesRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const submitListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SubmitListing', inputVars);
}
submitListingRef.operationName = 'SubmitListing';
exports.submitListingRef = submitListingRef;

exports.submitListing = function submitListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(submitListingRef(dcInstance, inputVars));
}
;

const approveListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ApproveListing', inputVars);
}
approveListingRef.operationName = 'ApproveListing';
exports.approveListingRef = approveListingRef;

exports.approveListing = function approveListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(approveListingRef(dcInstance, inputVars));
}
;

const rejectListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RejectListing', inputVars);
}
rejectListingRef.operationName = 'RejectListing';
exports.rejectListingRef = rejectListingRef;

exports.rejectListing = function rejectListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(rejectListingRef(dcInstance, inputVars));
}
;

const confirmListingPaymentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ConfirmListingPayment', inputVars);
}
confirmListingPaymentRef.operationName = 'ConfirmListingPayment';
exports.confirmListingPaymentRef = confirmListingPaymentRef;

exports.confirmListingPayment = function confirmListingPayment(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(confirmListingPaymentRef(dcInstance, inputVars));
}
;

const publishListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'PublishListing', inputVars);
}
publishListingRef.operationName = 'PublishListing';
exports.publishListingRef = publishListingRef;

exports.publishListing = function publishListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(publishListingRef(dcInstance, inputVars));
}
;

const expireListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ExpireListing', inputVars);
}
expireListingRef.operationName = 'ExpireListing';
exports.expireListingRef = expireListingRef;

exports.expireListing = function expireListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(expireListingRef(dcInstance, inputVars));
}
;

const relistListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RelistListing', inputVars);
}
relistListingRef.operationName = 'RelistListing';
exports.relistListingRef = relistListingRef;

exports.relistListing = function relistListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(relistListingRef(dcInstance, inputVars));
}
;

const markListingSoldRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkListingSold', inputVars);
}
markListingSoldRef.operationName = 'MarkListingSold';
exports.markListingSoldRef = markListingSoldRef;

exports.markListingSold = function markListingSold(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(markListingSoldRef(dcInstance, inputVars));
}
;

const archiveListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ArchiveListing', inputVars);
}
archiveListingRef.operationName = 'ArchiveListing';
exports.archiveListingRef = archiveListingRef;

exports.archiveListing = function archiveListing(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(archiveListingRef(dcInstance, inputVars));
}
;

const resolveListingAnomalyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ResolveListingAnomaly', inputVars);
}
resolveListingAnomalyRef.operationName = 'ResolveListingAnomaly';
exports.resolveListingAnomalyRef = resolveListingAnomalyRef;

exports.resolveListingAnomaly = function resolveListingAnomaly(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(resolveListingAnomalyRef(dcInstance, inputVars));
}
;
