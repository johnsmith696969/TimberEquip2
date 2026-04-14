import { GetListingGovernanceData, GetListingGovernanceVariables, ListLifecycleQueueData, ListLifecycleQueueVariables, ListListingTransitionsData, ListListingTransitionsVariables, ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables, SubmitListingData, SubmitListingVariables, ApproveListingData, ApproveListingVariables, RejectListingData, RejectListingVariables, ConfirmListingPaymentData, ConfirmListingPaymentVariables, PublishListingData, PublishListingVariables, ExpireListingData, ExpireListingVariables, RelistListingData, RelistListingVariables, MarkListingSoldData, MarkListingSoldVariables, ArchiveListingData, ArchiveListingVariables, ResolveListingAnomalyData, ResolveListingAnomalyVariables, FindListingByFirestoreIdData, FindListingByFirestoreIdVariables, InsertListingShadowData, InsertListingShadowVariables, UpdateListingShadowData, UpdateListingShadowVariables, DeleteListingShadowData, DeleteListingShadowVariables, RecordListingStateTransitionData, RecordListingStateTransitionVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetListingGovernance(vars: GetListingGovernanceVariables, options?: useDataConnectQueryOptions<GetListingGovernanceData>): UseDataConnectQueryResult<GetListingGovernanceData, GetListingGovernanceVariables>;
export function useGetListingGovernance(dc: DataConnect, vars: GetListingGovernanceVariables, options?: useDataConnectQueryOptions<GetListingGovernanceData>): UseDataConnectQueryResult<GetListingGovernanceData, GetListingGovernanceVariables>;

export function useListLifecycleQueue(vars: ListLifecycleQueueVariables, options?: useDataConnectQueryOptions<ListLifecycleQueueData>): UseDataConnectQueryResult<ListLifecycleQueueData, ListLifecycleQueueVariables>;
export function useListLifecycleQueue(dc: DataConnect, vars: ListLifecycleQueueVariables, options?: useDataConnectQueryOptions<ListLifecycleQueueData>): UseDataConnectQueryResult<ListLifecycleQueueData, ListLifecycleQueueVariables>;

export function useListListingTransitions(vars: ListListingTransitionsVariables, options?: useDataConnectQueryOptions<ListListingTransitionsData>): UseDataConnectQueryResult<ListListingTransitionsData, ListListingTransitionsVariables>;
export function useListListingTransitions(dc: DataConnect, vars: ListListingTransitionsVariables, options?: useDataConnectQueryOptions<ListListingTransitionsData>): UseDataConnectQueryResult<ListListingTransitionsData, ListListingTransitionsVariables>;

export function useListOpenListingAnomalies(vars: ListOpenListingAnomaliesVariables, options?: useDataConnectQueryOptions<ListOpenListingAnomaliesData>): UseDataConnectQueryResult<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;
export function useListOpenListingAnomalies(dc: DataConnect, vars: ListOpenListingAnomaliesVariables, options?: useDataConnectQueryOptions<ListOpenListingAnomaliesData>): UseDataConnectQueryResult<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;

export function useSubmitListing(options?: useDataConnectMutationOptions<SubmitListingData, FirebaseError, SubmitListingVariables>): UseDataConnectMutationResult<SubmitListingData, SubmitListingVariables>;
export function useSubmitListing(dc: DataConnect, options?: useDataConnectMutationOptions<SubmitListingData, FirebaseError, SubmitListingVariables>): UseDataConnectMutationResult<SubmitListingData, SubmitListingVariables>;

export function useApproveListing(options?: useDataConnectMutationOptions<ApproveListingData, FirebaseError, ApproveListingVariables>): UseDataConnectMutationResult<ApproveListingData, ApproveListingVariables>;
export function useApproveListing(dc: DataConnect, options?: useDataConnectMutationOptions<ApproveListingData, FirebaseError, ApproveListingVariables>): UseDataConnectMutationResult<ApproveListingData, ApproveListingVariables>;

export function useRejectListing(options?: useDataConnectMutationOptions<RejectListingData, FirebaseError, RejectListingVariables>): UseDataConnectMutationResult<RejectListingData, RejectListingVariables>;
export function useRejectListing(dc: DataConnect, options?: useDataConnectMutationOptions<RejectListingData, FirebaseError, RejectListingVariables>): UseDataConnectMutationResult<RejectListingData, RejectListingVariables>;

export function useConfirmListingPayment(options?: useDataConnectMutationOptions<ConfirmListingPaymentData, FirebaseError, ConfirmListingPaymentVariables>): UseDataConnectMutationResult<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;
export function useConfirmListingPayment(dc: DataConnect, options?: useDataConnectMutationOptions<ConfirmListingPaymentData, FirebaseError, ConfirmListingPaymentVariables>): UseDataConnectMutationResult<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;

export function usePublishListing(options?: useDataConnectMutationOptions<PublishListingData, FirebaseError, PublishListingVariables>): UseDataConnectMutationResult<PublishListingData, PublishListingVariables>;
export function usePublishListing(dc: DataConnect, options?: useDataConnectMutationOptions<PublishListingData, FirebaseError, PublishListingVariables>): UseDataConnectMutationResult<PublishListingData, PublishListingVariables>;

export function useExpireListing(options?: useDataConnectMutationOptions<ExpireListingData, FirebaseError, ExpireListingVariables>): UseDataConnectMutationResult<ExpireListingData, ExpireListingVariables>;
export function useExpireListing(dc: DataConnect, options?: useDataConnectMutationOptions<ExpireListingData, FirebaseError, ExpireListingVariables>): UseDataConnectMutationResult<ExpireListingData, ExpireListingVariables>;

export function useRelistListing(options?: useDataConnectMutationOptions<RelistListingData, FirebaseError, RelistListingVariables>): UseDataConnectMutationResult<RelistListingData, RelistListingVariables>;
export function useRelistListing(dc: DataConnect, options?: useDataConnectMutationOptions<RelistListingData, FirebaseError, RelistListingVariables>): UseDataConnectMutationResult<RelistListingData, RelistListingVariables>;

export function useMarkListingSold(options?: useDataConnectMutationOptions<MarkListingSoldData, FirebaseError, MarkListingSoldVariables>): UseDataConnectMutationResult<MarkListingSoldData, MarkListingSoldVariables>;
export function useMarkListingSold(dc: DataConnect, options?: useDataConnectMutationOptions<MarkListingSoldData, FirebaseError, MarkListingSoldVariables>): UseDataConnectMutationResult<MarkListingSoldData, MarkListingSoldVariables>;

export function useArchiveListing(options?: useDataConnectMutationOptions<ArchiveListingData, FirebaseError, ArchiveListingVariables>): UseDataConnectMutationResult<ArchiveListingData, ArchiveListingVariables>;
export function useArchiveListing(dc: DataConnect, options?: useDataConnectMutationOptions<ArchiveListingData, FirebaseError, ArchiveListingVariables>): UseDataConnectMutationResult<ArchiveListingData, ArchiveListingVariables>;

export function useResolveListingAnomaly(options?: useDataConnectMutationOptions<ResolveListingAnomalyData, FirebaseError, ResolveListingAnomalyVariables>): UseDataConnectMutationResult<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;
export function useResolveListingAnomaly(dc: DataConnect, options?: useDataConnectMutationOptions<ResolveListingAnomalyData, FirebaseError, ResolveListingAnomalyVariables>): UseDataConnectMutationResult<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;

export function useFindListingByFirestoreId(vars: FindListingByFirestoreIdVariables, options?: useDataConnectQueryOptions<FindListingByFirestoreIdData>): UseDataConnectQueryResult<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;
export function useFindListingByFirestoreId(dc: DataConnect, vars: FindListingByFirestoreIdVariables, options?: useDataConnectQueryOptions<FindListingByFirestoreIdData>): UseDataConnectQueryResult<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;

export function useInsertListingShadow(options?: useDataConnectMutationOptions<InsertListingShadowData, FirebaseError, InsertListingShadowVariables>): UseDataConnectMutationResult<InsertListingShadowData, InsertListingShadowVariables>;
export function useInsertListingShadow(dc: DataConnect, options?: useDataConnectMutationOptions<InsertListingShadowData, FirebaseError, InsertListingShadowVariables>): UseDataConnectMutationResult<InsertListingShadowData, InsertListingShadowVariables>;

export function useUpdateListingShadow(options?: useDataConnectMutationOptions<UpdateListingShadowData, FirebaseError, UpdateListingShadowVariables>): UseDataConnectMutationResult<UpdateListingShadowData, UpdateListingShadowVariables>;
export function useUpdateListingShadow(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateListingShadowData, FirebaseError, UpdateListingShadowVariables>): UseDataConnectMutationResult<UpdateListingShadowData, UpdateListingShadowVariables>;

export function useDeleteListingShadow(options?: useDataConnectMutationOptions<DeleteListingShadowData, FirebaseError, DeleteListingShadowVariables>): UseDataConnectMutationResult<DeleteListingShadowData, DeleteListingShadowVariables>;
export function useDeleteListingShadow(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteListingShadowData, FirebaseError, DeleteListingShadowVariables>): UseDataConnectMutationResult<DeleteListingShadowData, DeleteListingShadowVariables>;

export function useRecordListingStateTransition(options?: useDataConnectMutationOptions<RecordListingStateTransitionData, FirebaseError, RecordListingStateTransitionVariables>): UseDataConnectMutationResult<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;
export function useRecordListingStateTransition(dc: DataConnect, options?: useDataConnectMutationOptions<RecordListingStateTransitionData, FirebaseError, RecordListingStateTransitionVariables>): UseDataConnectMutationResult<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;
