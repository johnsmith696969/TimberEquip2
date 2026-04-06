import { GetUserByIdData, GetUserByIdVariables, GetUserByEmailData, GetUserByEmailVariables, ListUsersByRoleData, ListUsersByRoleVariables, GetStorefrontBySlugData, GetStorefrontBySlugVariables, GetStorefrontByUserIdData, GetStorefrontByUserIdVariables, ListActiveStorefrontsData, ListActiveStorefrontsVariables, UpsertUserData, UpsertUserVariables, UpsertStorefrontData, UpsertStorefrontVariables, DeleteUserData, DeleteUserVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetUserById(vars: GetUserByIdVariables, options?: useDataConnectQueryOptions<GetUserByIdData>): UseDataConnectQueryResult<GetUserByIdData, GetUserByIdVariables>;
export function useGetUserById(dc: DataConnect, vars: GetUserByIdVariables, options?: useDataConnectQueryOptions<GetUserByIdData>): UseDataConnectQueryResult<GetUserByIdData, GetUserByIdVariables>;

export function useGetUserByEmail(vars: GetUserByEmailVariables, options?: useDataConnectQueryOptions<GetUserByEmailData>): UseDataConnectQueryResult<GetUserByEmailData, GetUserByEmailVariables>;
export function useGetUserByEmail(dc: DataConnect, vars: GetUserByEmailVariables, options?: useDataConnectQueryOptions<GetUserByEmailData>): UseDataConnectQueryResult<GetUserByEmailData, GetUserByEmailVariables>;

export function useListUsersByRole(vars: ListUsersByRoleVariables, options?: useDataConnectQueryOptions<ListUsersByRoleData>): UseDataConnectQueryResult<ListUsersByRoleData, ListUsersByRoleVariables>;
export function useListUsersByRole(dc: DataConnect, vars: ListUsersByRoleVariables, options?: useDataConnectQueryOptions<ListUsersByRoleData>): UseDataConnectQueryResult<ListUsersByRoleData, ListUsersByRoleVariables>;

export function useGetStorefrontBySlug(vars: GetStorefrontBySlugVariables, options?: useDataConnectQueryOptions<GetStorefrontBySlugData>): UseDataConnectQueryResult<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;
export function useGetStorefrontBySlug(dc: DataConnect, vars: GetStorefrontBySlugVariables, options?: useDataConnectQueryOptions<GetStorefrontBySlugData>): UseDataConnectQueryResult<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;

export function useGetStorefrontByUserId(vars: GetStorefrontByUserIdVariables, options?: useDataConnectQueryOptions<GetStorefrontByUserIdData>): UseDataConnectQueryResult<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;
export function useGetStorefrontByUserId(dc: DataConnect, vars: GetStorefrontByUserIdVariables, options?: useDataConnectQueryOptions<GetStorefrontByUserIdData>): UseDataConnectQueryResult<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;

export function useListActiveStorefronts(vars?: ListActiveStorefrontsVariables, options?: useDataConnectQueryOptions<ListActiveStorefrontsData>): UseDataConnectQueryResult<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;
export function useListActiveStorefronts(dc: DataConnect, vars?: ListActiveStorefrontsVariables, options?: useDataConnectQueryOptions<ListActiveStorefrontsData>): UseDataConnectQueryResult<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;

export function useUpsertUser(options?: useDataConnectMutationOptions<UpsertUserData, FirebaseError, UpsertUserVariables>): UseDataConnectMutationResult<UpsertUserData, UpsertUserVariables>;
export function useUpsertUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertUserData, FirebaseError, UpsertUserVariables>): UseDataConnectMutationResult<UpsertUserData, UpsertUserVariables>;

export function useUpsertStorefront(options?: useDataConnectMutationOptions<UpsertStorefrontData, FirebaseError, UpsertStorefrontVariables>): UseDataConnectMutationResult<UpsertStorefrontData, UpsertStorefrontVariables>;
export function useUpsertStorefront(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertStorefrontData, FirebaseError, UpsertStorefrontVariables>): UseDataConnectMutationResult<UpsertStorefrontData, UpsertStorefrontVariables>;

export function useDeleteUser(options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, DeleteUserVariables>): UseDataConnectMutationResult<DeleteUserData, DeleteUserVariables>;
export function useDeleteUser(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, DeleteUserVariables>): UseDataConnectMutationResult<DeleteUserData, DeleteUserVariables>;
