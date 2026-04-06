const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'leads',
  serviceId: 'timberequip-marketplace',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

function getInquiryById(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetInquiryById', inputVars, inputOpts);
}
exports.getInquiryById = getInquiryById;

function listInquiriesBySeller(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListInquiriesBySeller', inputVars, inputOpts);
}
exports.listInquiriesBySeller = listInquiriesBySeller;

function listInquiriesByBuyer(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListInquiriesByBuyer', inputVars, inputOpts);
}
exports.listInquiriesByBuyer = listInquiriesByBuyer;

function listInquiriesByListing(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListInquiriesByListing', inputVars, inputOpts);
}
exports.listInquiriesByListing = listInquiriesByListing;

function listInquiriesByStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListInquiriesByStatus', inputVars, inputOpts);
}
exports.listInquiriesByStatus = listInquiriesByStatus;

function getFinancingRequestById(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetFinancingRequestById', inputVars, inputOpts);
}
exports.getFinancingRequestById = getFinancingRequestById;

function listFinancingRequestsBySeller(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListFinancingRequestsBySeller', inputVars, inputOpts);
}
exports.listFinancingRequestsBySeller = listFinancingRequestsBySeller;

function listFinancingRequestsByBuyer(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListFinancingRequestsByBuyer', inputVars, inputOpts);
}
exports.listFinancingRequestsByBuyer = listFinancingRequestsByBuyer;

function getCallLogById(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetCallLogById', inputVars, inputOpts);
}
exports.getCallLogById = getCallLogById;

function listCallLogsBySeller(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListCallLogsBySeller', inputVars, inputOpts);
}
exports.listCallLogsBySeller = listCallLogsBySeller;

function listCallLogsByListing(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListCallLogsByListing', inputVars, inputOpts);
}
exports.listCallLogsByListing = listCallLogsByListing;

function listContactRequestsByStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListContactRequestsByStatus', inputVars, inputOpts);
}
exports.listContactRequestsByStatus = listContactRequestsByStatus;

function upsertInquiry(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertInquiry', inputVars, inputOpts);
}
exports.upsertInquiry = upsertInquiry;

function updateInquiryStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateInquiryStatus', inputVars, inputOpts);
}
exports.updateInquiryStatus = updateInquiryStatus;

function upsertFinancingRequest(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertFinancingRequest', inputVars, inputOpts);
}
exports.upsertFinancingRequest = upsertFinancingRequest;

function insertCallLog(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('InsertCallLog', inputVars, inputOpts);
}
exports.insertCallLog = insertCallLog;

function insertContactRequest(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('InsertContactRequest', inputVars, inputOpts);
}
exports.insertContactRequest = insertContactRequest;

function updateContactRequestStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateContactRequestStatus', inputVars, inputOpts);
}
exports.updateContactRequestStatus = updateContactRequestStatus;

