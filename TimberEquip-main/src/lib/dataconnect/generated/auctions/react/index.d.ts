import { GetAuctionByIdData, GetAuctionByIdVariables, GetAuctionBySlugData, GetAuctionBySlugVariables, ListActiveAuctionsData, ListActiveAuctionsVariables, ListAuctionsByStatusData, ListAuctionsByStatusVariables, GetLotsByAuctionData, GetLotsByAuctionVariables, GetLotByIdData, GetLotByIdVariables, GetPromotedLotsData, GetPromotedLotsVariables, GetBidsByLotData, GetBidsByLotVariables, GetBidsByBidderData, GetBidsByBidderVariables, GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables, GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables, GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables, GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables, UpsertAuctionData, UpsertAuctionVariables, UpsertAuctionLotData, UpsertAuctionLotVariables, InsertAuctionBidData, InsertAuctionBidVariables, UpdateBidStatusData, UpdateBidStatusVariables, UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables, UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables, UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables, UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables, UpsertBidderProfileData, UpsertBidderProfileVariables, UpdateAuctionStatusData, UpdateAuctionStatusVariables, UpdateAuctionStatsData, UpdateAuctionStatsVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetAuctionById(vars: GetAuctionByIdVariables, options?: useDataConnectQueryOptions<GetAuctionByIdData>): UseDataConnectQueryResult<GetAuctionByIdData, GetAuctionByIdVariables>;
export function useGetAuctionById(dc: DataConnect, vars: GetAuctionByIdVariables, options?: useDataConnectQueryOptions<GetAuctionByIdData>): UseDataConnectQueryResult<GetAuctionByIdData, GetAuctionByIdVariables>;

export function useGetAuctionBySlug(vars: GetAuctionBySlugVariables, options?: useDataConnectQueryOptions<GetAuctionBySlugData>): UseDataConnectQueryResult<GetAuctionBySlugData, GetAuctionBySlugVariables>;
export function useGetAuctionBySlug(dc: DataConnect, vars: GetAuctionBySlugVariables, options?: useDataConnectQueryOptions<GetAuctionBySlugData>): UseDataConnectQueryResult<GetAuctionBySlugData, GetAuctionBySlugVariables>;

export function useListActiveAuctions(vars?: ListActiveAuctionsVariables, options?: useDataConnectQueryOptions<ListActiveAuctionsData>): UseDataConnectQueryResult<ListActiveAuctionsData, ListActiveAuctionsVariables>;
export function useListActiveAuctions(dc: DataConnect, vars?: ListActiveAuctionsVariables, options?: useDataConnectQueryOptions<ListActiveAuctionsData>): UseDataConnectQueryResult<ListActiveAuctionsData, ListActiveAuctionsVariables>;

export function useListAuctionsByStatus(vars: ListAuctionsByStatusVariables, options?: useDataConnectQueryOptions<ListAuctionsByStatusData>): UseDataConnectQueryResult<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;
export function useListAuctionsByStatus(dc: DataConnect, vars: ListAuctionsByStatusVariables, options?: useDataConnectQueryOptions<ListAuctionsByStatusData>): UseDataConnectQueryResult<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;

export function useGetLotsByAuction(vars: GetLotsByAuctionVariables, options?: useDataConnectQueryOptions<GetLotsByAuctionData>): UseDataConnectQueryResult<GetLotsByAuctionData, GetLotsByAuctionVariables>;
export function useGetLotsByAuction(dc: DataConnect, vars: GetLotsByAuctionVariables, options?: useDataConnectQueryOptions<GetLotsByAuctionData>): UseDataConnectQueryResult<GetLotsByAuctionData, GetLotsByAuctionVariables>;

export function useGetLotById(vars: GetLotByIdVariables, options?: useDataConnectQueryOptions<GetLotByIdData>): UseDataConnectQueryResult<GetLotByIdData, GetLotByIdVariables>;
export function useGetLotById(dc: DataConnect, vars: GetLotByIdVariables, options?: useDataConnectQueryOptions<GetLotByIdData>): UseDataConnectQueryResult<GetLotByIdData, GetLotByIdVariables>;

export function useGetPromotedLots(vars: GetPromotedLotsVariables, options?: useDataConnectQueryOptions<GetPromotedLotsData>): UseDataConnectQueryResult<GetPromotedLotsData, GetPromotedLotsVariables>;
export function useGetPromotedLots(dc: DataConnect, vars: GetPromotedLotsVariables, options?: useDataConnectQueryOptions<GetPromotedLotsData>): UseDataConnectQueryResult<GetPromotedLotsData, GetPromotedLotsVariables>;

export function useGetBidsByLot(vars: GetBidsByLotVariables, options?: useDataConnectQueryOptions<GetBidsByLotData>): UseDataConnectQueryResult<GetBidsByLotData, GetBidsByLotVariables>;
export function useGetBidsByLot(dc: DataConnect, vars: GetBidsByLotVariables, options?: useDataConnectQueryOptions<GetBidsByLotData>): UseDataConnectQueryResult<GetBidsByLotData, GetBidsByLotVariables>;

export function useGetBidsByBidder(vars: GetBidsByBidderVariables, options?: useDataConnectQueryOptions<GetBidsByBidderData>): UseDataConnectQueryResult<GetBidsByBidderData, GetBidsByBidderVariables>;
export function useGetBidsByBidder(dc: DataConnect, vars: GetBidsByBidderVariables, options?: useDataConnectQueryOptions<GetBidsByBidderData>): UseDataConnectQueryResult<GetBidsByBidderData, GetBidsByBidderVariables>;

export function useGetAuctionInvoicesByBuyer(vars: GetAuctionInvoicesByBuyerVariables, options?: useDataConnectQueryOptions<GetAuctionInvoicesByBuyerData>): UseDataConnectQueryResult<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;
export function useGetAuctionInvoicesByBuyer(dc: DataConnect, vars: GetAuctionInvoicesByBuyerVariables, options?: useDataConnectQueryOptions<GetAuctionInvoicesByBuyerData>): UseDataConnectQueryResult<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;

export function useGetAuctionInvoicesByAuction(vars: GetAuctionInvoicesByAuctionVariables, options?: useDataConnectQueryOptions<GetAuctionInvoicesByAuctionData>): UseDataConnectQueryResult<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;
export function useGetAuctionInvoicesByAuction(dc: DataConnect, vars: GetAuctionInvoicesByAuctionVariables, options?: useDataConnectQueryOptions<GetAuctionInvoicesByAuctionData>): UseDataConnectQueryResult<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;

export function useGetAuctionInvoiceById(vars: GetAuctionInvoiceByIdVariables, options?: useDataConnectQueryOptions<GetAuctionInvoiceByIdData>): UseDataConnectQueryResult<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;
export function useGetAuctionInvoiceById(dc: DataConnect, vars: GetAuctionInvoiceByIdVariables, options?: useDataConnectQueryOptions<GetAuctionInvoiceByIdData>): UseDataConnectQueryResult<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;

export function useGetBidderProfileByUserId(vars: GetBidderProfileByUserIdVariables, options?: useDataConnectQueryOptions<GetBidderProfileByUserIdData>): UseDataConnectQueryResult<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;
export function useGetBidderProfileByUserId(dc: DataConnect, vars: GetBidderProfileByUserIdVariables, options?: useDataConnectQueryOptions<GetBidderProfileByUserIdData>): UseDataConnectQueryResult<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;

export function useUpsertAuction(options?: useDataConnectMutationOptions<UpsertAuctionData, FirebaseError, UpsertAuctionVariables>): UseDataConnectMutationResult<UpsertAuctionData, UpsertAuctionVariables>;
export function useUpsertAuction(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertAuctionData, FirebaseError, UpsertAuctionVariables>): UseDataConnectMutationResult<UpsertAuctionData, UpsertAuctionVariables>;

export function useUpsertAuctionLot(options?: useDataConnectMutationOptions<UpsertAuctionLotData, FirebaseError, UpsertAuctionLotVariables>): UseDataConnectMutationResult<UpsertAuctionLotData, UpsertAuctionLotVariables>;
export function useUpsertAuctionLot(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertAuctionLotData, FirebaseError, UpsertAuctionLotVariables>): UseDataConnectMutationResult<UpsertAuctionLotData, UpsertAuctionLotVariables>;

export function useInsertAuctionBid(options?: useDataConnectMutationOptions<InsertAuctionBidData, FirebaseError, InsertAuctionBidVariables>): UseDataConnectMutationResult<InsertAuctionBidData, InsertAuctionBidVariables>;
export function useInsertAuctionBid(dc: DataConnect, options?: useDataConnectMutationOptions<InsertAuctionBidData, FirebaseError, InsertAuctionBidVariables>): UseDataConnectMutationResult<InsertAuctionBidData, InsertAuctionBidVariables>;

export function useUpdateBidStatus(options?: useDataConnectMutationOptions<UpdateBidStatusData, FirebaseError, UpdateBidStatusVariables>): UseDataConnectMutationResult<UpdateBidStatusData, UpdateBidStatusVariables>;
export function useUpdateBidStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateBidStatusData, FirebaseError, UpdateBidStatusVariables>): UseDataConnectMutationResult<UpdateBidStatusData, UpdateBidStatusVariables>;

export function useUpsertAuctionInvoice(options?: useDataConnectMutationOptions<UpsertAuctionInvoiceData, FirebaseError, UpsertAuctionInvoiceVariables>): UseDataConnectMutationResult<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;
export function useUpsertAuctionInvoice(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertAuctionInvoiceData, FirebaseError, UpsertAuctionInvoiceVariables>): UseDataConnectMutationResult<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;

export function useUpdateAuctionInvoiceStatus(options?: useDataConnectMutationOptions<UpdateAuctionInvoiceStatusData, FirebaseError, UpdateAuctionInvoiceStatusVariables>): UseDataConnectMutationResult<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;
export function useUpdateAuctionInvoiceStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionInvoiceStatusData, FirebaseError, UpdateAuctionInvoiceStatusVariables>): UseDataConnectMutationResult<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;

export function useUpdateAuctionLotBidState(options?: useDataConnectMutationOptions<UpdateAuctionLotBidStateData, FirebaseError, UpdateAuctionLotBidStateVariables>): UseDataConnectMutationResult<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;
export function useUpdateAuctionLotBidState(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionLotBidStateData, FirebaseError, UpdateAuctionLotBidStateVariables>): UseDataConnectMutationResult<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;

export function useUpdateAuctionLotStatus(options?: useDataConnectMutationOptions<UpdateAuctionLotStatusData, FirebaseError, UpdateAuctionLotStatusVariables>): UseDataConnectMutationResult<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;
export function useUpdateAuctionLotStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionLotStatusData, FirebaseError, UpdateAuctionLotStatusVariables>): UseDataConnectMutationResult<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;

export function useUpsertBidderProfile(options?: useDataConnectMutationOptions<UpsertBidderProfileData, FirebaseError, UpsertBidderProfileVariables>): UseDataConnectMutationResult<UpsertBidderProfileData, UpsertBidderProfileVariables>;
export function useUpsertBidderProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertBidderProfileData, FirebaseError, UpsertBidderProfileVariables>): UseDataConnectMutationResult<UpsertBidderProfileData, UpsertBidderProfileVariables>;

export function useUpdateAuctionStatus(options?: useDataConnectMutationOptions<UpdateAuctionStatusData, FirebaseError, UpdateAuctionStatusVariables>): UseDataConnectMutationResult<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;
export function useUpdateAuctionStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionStatusData, FirebaseError, UpdateAuctionStatusVariables>): UseDataConnectMutationResult<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;

export function useUpdateAuctionStats(options?: useDataConnectMutationOptions<UpdateAuctionStatsData, FirebaseError, UpdateAuctionStatsVariables>): UseDataConnectMutationResult<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;
export function useUpdateAuctionStats(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionStatsData, FirebaseError, UpdateAuctionStatsVariables>): UseDataConnectMutationResult<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;
