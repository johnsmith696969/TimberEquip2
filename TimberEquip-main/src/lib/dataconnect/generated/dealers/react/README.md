# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `dealers`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`dealers/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-dealers/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetDealerFeedProfileById*](#getdealerfeedprofilebyid)
  - [*ListDealerFeedProfilesBySeller*](#listdealerfeedprofilesbyseller)
  - [*ListDealerFeedProfilesByStatus*](#listdealerfeedprofilesbystatus)
  - [*ListDealerListingsByFeed*](#listdealerlistingsbyfeed)
  - [*ListDealerListingsBySeller*](#listdealerlistingsbyseller)
  - [*GetDealerListingByHash*](#getdealerlistingbyhash)
  - [*ListIngestLogsByFeed*](#listingestlogsbyfeed)
  - [*ListIngestLogsBySeller*](#listingestlogsbyseller)
  - [*ListAuditLogsByFeed*](#listauditlogsbyfeed)
  - [*ListWebhooksByDealer*](#listwebhooksbydealer)
  - [*GetWidgetConfig*](#getwidgetconfig)
- [**Mutations**](#mutations)
  - [*UpsertDealerFeedProfile*](#upsertdealerfeedprofile)
  - [*UpdateDealerFeedProfileSyncStats*](#updatedealerfeedprofilesyncstats)
  - [*UpsertDealerListing*](#upsertdealerlisting)
  - [*InsertDealerFeedIngestLog*](#insertdealerfeedingestlog)
  - [*InsertDealerAuditLog*](#insertdealerauditlog)
  - [*UpsertDealerWebhookSubscription*](#upsertdealerwebhooksubscription)
  - [*UpsertDealerWidgetConfig*](#upsertdealerwidgetconfig)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `dealers`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

***You do not need to be familiar with Tanstack Query or Tanstack Query Firebase to use this SDK.*** However, you may find it useful to learn more about them, as they will empower you as a user of this Generated React SDK.

## Installing TanStack Query Firebase and TanStack React Query Packages
In order to use the React generated SDK, you must install the `TanStack React Query` and `TanStack Query Firebase` packages.
```bash
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```
```bash
npm i --save firebase@latest # Note: React has a peer dependency on ^11.3.0
```

You can also follow the installation instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#tanstack-install), or the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react) and [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/installation).

## Configuring TanStack Query
In order to use the React generated SDK in your application, you must wrap your application's component tree in a `QueryClientProvider` component from TanStack React Query. None of your generated React SDK hooks will work without this provider.

```javascript
import { QueryClientProvider } from '@tanstack/react-query';

// Create a TanStack Query client instance
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <MyApplication />
    </QueryClientProvider>
  )
}
```

To learn more about `QueryClientProvider`, see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start) and the [TanStack Query Firebase documentation](https://invertase.docs.page/tanstack-query-firebase/react#usage).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `dealers`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-dealers';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-dealers';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) using the hooks provided from your generated React SDK.

# Queries

The React generated SDK provides Query hook functions that call and return [`useDataConnectQuery`](https://react-query-firebase.invertase.dev/react/data-connect/querying) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and the most recent data returned by the Query, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/querying).

TanStack React Query caches the results of your Queries, so using the same Query hook function in multiple places in your application allows the entire application to automatically see updates to that Query's data.

Query hooks execute their Queries automatically when called, and periodically refresh, unless you change the `queryOptions` for the Query. To learn how to stop a Query from automatically executing, including how to make a query "lazy", see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).

To learn more about TanStack React Query's Queries, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/queries).

## Using Query Hooks
Here's a general overview of how to use the generated Query hooks in your code:

- If the Query has no variables, the Query hook function does not require arguments.
- If the Query has any required variables, the Query hook function will require at least one argument: an object that contains all the required variables for the Query.
- If the Query has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Query's variables are optional, the Query hook function does not require any arguments.
- Query hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Query hooks functions can be called with or without passing in an `options` argument of type `useDataConnectQueryOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).
  - ***Special case:***  If the Query has all optional variables and you would like to provide an `options` argument to the Query hook function without providing any variables, you must pass `undefined` where you would normally pass the Query's variables, and then may provide the `options` argument.

Below are examples of how to use the `dealers` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetDealerFeedProfileById
You can execute the `GetDealerFeedProfileById` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useGetDealerFeedProfileById(dc: DataConnect, vars: GetDealerFeedProfileByIdVariables, options?: useDataConnectQueryOptions<GetDealerFeedProfileByIdData>): UseDataConnectQueryResult<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetDealerFeedProfileById(vars: GetDealerFeedProfileByIdVariables, options?: useDataConnectQueryOptions<GetDealerFeedProfileByIdData>): UseDataConnectQueryResult<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;
```

### Variables
The `GetDealerFeedProfileById` Query requires an argument of type `GetDealerFeedProfileByIdVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetDealerFeedProfileByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetDealerFeedProfileById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetDealerFeedProfileById` Query is of type `GetDealerFeedProfileByIdData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetDealerFeedProfileByIdData {
  dealerFeedProfile?: {
    id: string;
    sellerUid: string;
    dealerName?: string | null;
    dealerEmail?: string | null;
    sourceName?: string | null;
    sourceType?: string | null;
    feedUrl?: string | null;
    apiEndpoint?: string | null;
    status?: string | null;
    syncMode?: string | null;
    syncFrequency?: string | null;
    nightlySyncEnabled?: boolean | null;
    autoPublish?: boolean | null;
    fieldMapping?: unknown | null;
    apiKeyPreview?: string | null;
    totalListingsSynced?: number | null;
    totalListingsActive?: number | null;
    totalListingsCreated?: number | null;
    totalListingsUpdated?: number | null;
    totalListingsDeleted?: number | null;
    lastSyncAt?: TimestampString | null;
    nextSyncAt?: TimestampString | null;
    lastSyncStatus?: string | null;
    lastSyncMessage?: string | null;
    lastResolvedType?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & DealerFeedProfile_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetDealerFeedProfileById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetDealerFeedProfileByIdVariables } from '@dataconnect/generated-timberequip-dealers';
import { useGetDealerFeedProfileById } from '@dataconnect/generated-timberequip-dealers/react'

export default function GetDealerFeedProfileByIdComponent() {
  // The `useGetDealerFeedProfileById` Query hook requires an argument of type `GetDealerFeedProfileByIdVariables`:
  const getDealerFeedProfileByIdVars: GetDealerFeedProfileByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetDealerFeedProfileById(getDealerFeedProfileByIdVars);
  // Variables can be defined inline as well.
  const query = useGetDealerFeedProfileById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetDealerFeedProfileById(dataConnect, getDealerFeedProfileByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetDealerFeedProfileById(getDealerFeedProfileByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetDealerFeedProfileById(dataConnect, getDealerFeedProfileByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerFeedProfile);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListDealerFeedProfilesBySeller
You can execute the `ListDealerFeedProfilesBySeller` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useListDealerFeedProfilesBySeller(dc: DataConnect, vars: ListDealerFeedProfilesBySellerVariables, options?: useDataConnectQueryOptions<ListDealerFeedProfilesBySellerData>): UseDataConnectQueryResult<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListDealerFeedProfilesBySeller(vars: ListDealerFeedProfilesBySellerVariables, options?: useDataConnectQueryOptions<ListDealerFeedProfilesBySellerData>): UseDataConnectQueryResult<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;
```

### Variables
The `ListDealerFeedProfilesBySeller` Query requires an argument of type `ListDealerFeedProfilesBySellerVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListDealerFeedProfilesBySellerVariables {
  sellerUid: string;
}
```
### Return Type
Recall that calling the `ListDealerFeedProfilesBySeller` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListDealerFeedProfilesBySeller` Query is of type `ListDealerFeedProfilesBySellerData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListDealerFeedProfilesBySellerData {
  dealerFeedProfiles: ({
    id: string;
    dealerName?: string | null;
    sourceName?: string | null;
    sourceType?: string | null;
    status?: string | null;
    syncMode?: string | null;
    syncFrequency?: string | null;
    nightlySyncEnabled?: boolean | null;
    totalListingsSynced?: number | null;
    totalListingsActive?: number | null;
    lastSyncAt?: TimestampString | null;
    lastSyncStatus?: string | null;
    createdAt: TimestampString;
  } & DealerFeedProfile_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListDealerFeedProfilesBySeller`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListDealerFeedProfilesBySellerVariables } from '@dataconnect/generated-timberequip-dealers';
import { useListDealerFeedProfilesBySeller } from '@dataconnect/generated-timberequip-dealers/react'

export default function ListDealerFeedProfilesBySellerComponent() {
  // The `useListDealerFeedProfilesBySeller` Query hook requires an argument of type `ListDealerFeedProfilesBySellerVariables`:
  const listDealerFeedProfilesBySellerVars: ListDealerFeedProfilesBySellerVariables = {
    sellerUid: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListDealerFeedProfilesBySeller(listDealerFeedProfilesBySellerVars);
  // Variables can be defined inline as well.
  const query = useListDealerFeedProfilesBySeller({ sellerUid: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListDealerFeedProfilesBySeller(dataConnect, listDealerFeedProfilesBySellerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListDealerFeedProfilesBySeller(listDealerFeedProfilesBySellerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListDealerFeedProfilesBySeller(dataConnect, listDealerFeedProfilesBySellerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerFeedProfiles);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListDealerFeedProfilesByStatus
You can execute the `ListDealerFeedProfilesByStatus` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useListDealerFeedProfilesByStatus(dc: DataConnect, vars: ListDealerFeedProfilesByStatusVariables, options?: useDataConnectQueryOptions<ListDealerFeedProfilesByStatusData>): UseDataConnectQueryResult<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListDealerFeedProfilesByStatus(vars: ListDealerFeedProfilesByStatusVariables, options?: useDataConnectQueryOptions<ListDealerFeedProfilesByStatusData>): UseDataConnectQueryResult<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;
```

### Variables
The `ListDealerFeedProfilesByStatus` Query requires an argument of type `ListDealerFeedProfilesByStatusVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListDealerFeedProfilesByStatusVariables {
  status: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListDealerFeedProfilesByStatus` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListDealerFeedProfilesByStatus` Query is of type `ListDealerFeedProfilesByStatusData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListDealerFeedProfilesByStatusData {
  dealerFeedProfiles: ({
    id: string;
    sellerUid: string;
    dealerName?: string | null;
    sourceName?: string | null;
    status?: string | null;
    totalListingsSynced?: number | null;
    lastSyncAt?: TimestampString | null;
    lastSyncStatus?: string | null;
    createdAt: TimestampString;
  } & DealerFeedProfile_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListDealerFeedProfilesByStatus`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListDealerFeedProfilesByStatusVariables } from '@dataconnect/generated-timberequip-dealers';
import { useListDealerFeedProfilesByStatus } from '@dataconnect/generated-timberequip-dealers/react'

export default function ListDealerFeedProfilesByStatusComponent() {
  // The `useListDealerFeedProfilesByStatus` Query hook requires an argument of type `ListDealerFeedProfilesByStatusVariables`:
  const listDealerFeedProfilesByStatusVars: ListDealerFeedProfilesByStatusVariables = {
    status: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListDealerFeedProfilesByStatus(listDealerFeedProfilesByStatusVars);
  // Variables can be defined inline as well.
  const query = useListDealerFeedProfilesByStatus({ status: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListDealerFeedProfilesByStatus(dataConnect, listDealerFeedProfilesByStatusVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListDealerFeedProfilesByStatus(listDealerFeedProfilesByStatusVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListDealerFeedProfilesByStatus(dataConnect, listDealerFeedProfilesByStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerFeedProfiles);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListDealerListingsByFeed
You can execute the `ListDealerListingsByFeed` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useListDealerListingsByFeed(dc: DataConnect, vars: ListDealerListingsByFeedVariables, options?: useDataConnectQueryOptions<ListDealerListingsByFeedData>): UseDataConnectQueryResult<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListDealerListingsByFeed(vars: ListDealerListingsByFeedVariables, options?: useDataConnectQueryOptions<ListDealerListingsByFeedData>): UseDataConnectQueryResult<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;
```

### Variables
The `ListDealerListingsByFeed` Query requires an argument of type `ListDealerListingsByFeedVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListDealerListingsByFeedVariables {
  dealerFeedId: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListDealerListingsByFeed` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListDealerListingsByFeed` Query is of type `ListDealerListingsByFeedData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListDealerListingsByFeedData {
  dealerListings: ({
    id: string;
    dealerFeedId: string;
    sellerUid: string;
    externalListingId: string;
    timberequipListingId?: string | null;
    equipmentHash?: string | null;
    status?: string | null;
    dealerSourceUrl?: string | null;
    dataSource?: string | null;
    externalData?: unknown | null;
    mappedData?: unknown | null;
    syncedAt?: TimestampString | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & DealerListing_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListDealerListingsByFeed`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListDealerListingsByFeedVariables } from '@dataconnect/generated-timberequip-dealers';
import { useListDealerListingsByFeed } from '@dataconnect/generated-timberequip-dealers/react'

export default function ListDealerListingsByFeedComponent() {
  // The `useListDealerListingsByFeed` Query hook requires an argument of type `ListDealerListingsByFeedVariables`:
  const listDealerListingsByFeedVars: ListDealerListingsByFeedVariables = {
    dealerFeedId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListDealerListingsByFeed(listDealerListingsByFeedVars);
  // Variables can be defined inline as well.
  const query = useListDealerListingsByFeed({ dealerFeedId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListDealerListingsByFeed(dataConnect, listDealerListingsByFeedVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListDealerListingsByFeed(listDealerListingsByFeedVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListDealerListingsByFeed(dataConnect, listDealerListingsByFeedVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerListings);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListDealerListingsBySeller
You can execute the `ListDealerListingsBySeller` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useListDealerListingsBySeller(dc: DataConnect, vars: ListDealerListingsBySellerVariables, options?: useDataConnectQueryOptions<ListDealerListingsBySellerData>): UseDataConnectQueryResult<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListDealerListingsBySeller(vars: ListDealerListingsBySellerVariables, options?: useDataConnectQueryOptions<ListDealerListingsBySellerData>): UseDataConnectQueryResult<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;
```

### Variables
The `ListDealerListingsBySeller` Query requires an argument of type `ListDealerListingsBySellerVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListDealerListingsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListDealerListingsBySeller` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListDealerListingsBySeller` Query is of type `ListDealerListingsBySellerData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListDealerListingsBySellerData {
  dealerListings: ({
    id: string;
    dealerFeedId: string;
    externalListingId: string;
    timberequipListingId?: string | null;
    status?: string | null;
    syncedAt?: TimestampString | null;
    createdAt: TimestampString;
  } & DealerListing_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListDealerListingsBySeller`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListDealerListingsBySellerVariables } from '@dataconnect/generated-timberequip-dealers';
import { useListDealerListingsBySeller } from '@dataconnect/generated-timberequip-dealers/react'

export default function ListDealerListingsBySellerComponent() {
  // The `useListDealerListingsBySeller` Query hook requires an argument of type `ListDealerListingsBySellerVariables`:
  const listDealerListingsBySellerVars: ListDealerListingsBySellerVariables = {
    sellerUid: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListDealerListingsBySeller(listDealerListingsBySellerVars);
  // Variables can be defined inline as well.
  const query = useListDealerListingsBySeller({ sellerUid: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListDealerListingsBySeller(dataConnect, listDealerListingsBySellerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListDealerListingsBySeller(listDealerListingsBySellerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListDealerListingsBySeller(dataConnect, listDealerListingsBySellerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerListings);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetDealerListingByHash
You can execute the `GetDealerListingByHash` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useGetDealerListingByHash(dc: DataConnect, vars: GetDealerListingByHashVariables, options?: useDataConnectQueryOptions<GetDealerListingByHashData>): UseDataConnectQueryResult<GetDealerListingByHashData, GetDealerListingByHashVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetDealerListingByHash(vars: GetDealerListingByHashVariables, options?: useDataConnectQueryOptions<GetDealerListingByHashData>): UseDataConnectQueryResult<GetDealerListingByHashData, GetDealerListingByHashVariables>;
```

### Variables
The `GetDealerListingByHash` Query requires an argument of type `GetDealerListingByHashVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetDealerListingByHashVariables {
  equipmentHash: string;
}
```
### Return Type
Recall that calling the `GetDealerListingByHash` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetDealerListingByHash` Query is of type `GetDealerListingByHashData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetDealerListingByHashData {
  dealerListings: ({
    id: string;
    dealerFeedId: string;
    externalListingId: string;
    timberequipListingId?: string | null;
    status?: string | null;
  } & DealerListing_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetDealerListingByHash`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetDealerListingByHashVariables } from '@dataconnect/generated-timberequip-dealers';
import { useGetDealerListingByHash } from '@dataconnect/generated-timberequip-dealers/react'

export default function GetDealerListingByHashComponent() {
  // The `useGetDealerListingByHash` Query hook requires an argument of type `GetDealerListingByHashVariables`:
  const getDealerListingByHashVars: GetDealerListingByHashVariables = {
    equipmentHash: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetDealerListingByHash(getDealerListingByHashVars);
  // Variables can be defined inline as well.
  const query = useGetDealerListingByHash({ equipmentHash: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetDealerListingByHash(dataConnect, getDealerListingByHashVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetDealerListingByHash(getDealerListingByHashVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetDealerListingByHash(dataConnect, getDealerListingByHashVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerListings);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListIngestLogsByFeed
You can execute the `ListIngestLogsByFeed` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useListIngestLogsByFeed(dc: DataConnect, vars: ListIngestLogsByFeedVariables, options?: useDataConnectQueryOptions<ListIngestLogsByFeedData>): UseDataConnectQueryResult<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListIngestLogsByFeed(vars: ListIngestLogsByFeedVariables, options?: useDataConnectQueryOptions<ListIngestLogsByFeedData>): UseDataConnectQueryResult<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;
```

### Variables
The `ListIngestLogsByFeed` Query requires an argument of type `ListIngestLogsByFeedVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListIngestLogsByFeedVariables {
  feedId: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListIngestLogsByFeed` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListIngestLogsByFeed` Query is of type `ListIngestLogsByFeedData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListIngestLogsByFeedData {
  dealerFeedIngestLogs: ({
    id: string;
    feedId?: string | null;
    sellerUid: string;
    actorUid?: string | null;
    actorRole?: string | null;
    sourceName?: string | null;
    totalReceived?: number | null;
    processed?: number | null;
    created?: number | null;
    updated?: number | null;
    upserted?: number | null;
    skipped?: number | null;
    archived?: number | null;
    errorCount?: number | null;
    errors?: unknown | null;
    dryRun?: boolean | null;
    processedAt?: TimestampString | null;
    createdAt: TimestampString;
  } & DealerFeedIngestLog_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListIngestLogsByFeed`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListIngestLogsByFeedVariables } from '@dataconnect/generated-timberequip-dealers';
import { useListIngestLogsByFeed } from '@dataconnect/generated-timberequip-dealers/react'

export default function ListIngestLogsByFeedComponent() {
  // The `useListIngestLogsByFeed` Query hook requires an argument of type `ListIngestLogsByFeedVariables`:
  const listIngestLogsByFeedVars: ListIngestLogsByFeedVariables = {
    feedId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListIngestLogsByFeed(listIngestLogsByFeedVars);
  // Variables can be defined inline as well.
  const query = useListIngestLogsByFeed({ feedId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListIngestLogsByFeed(dataConnect, listIngestLogsByFeedVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListIngestLogsByFeed(listIngestLogsByFeedVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListIngestLogsByFeed(dataConnect, listIngestLogsByFeedVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerFeedIngestLogs);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListIngestLogsBySeller
You can execute the `ListIngestLogsBySeller` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useListIngestLogsBySeller(dc: DataConnect, vars: ListIngestLogsBySellerVariables, options?: useDataConnectQueryOptions<ListIngestLogsBySellerData>): UseDataConnectQueryResult<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListIngestLogsBySeller(vars: ListIngestLogsBySellerVariables, options?: useDataConnectQueryOptions<ListIngestLogsBySellerData>): UseDataConnectQueryResult<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;
```

### Variables
The `ListIngestLogsBySeller` Query requires an argument of type `ListIngestLogsBySellerVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListIngestLogsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListIngestLogsBySeller` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListIngestLogsBySeller` Query is of type `ListIngestLogsBySellerData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListIngestLogsBySellerData {
  dealerFeedIngestLogs: ({
    id: string;
    feedId?: string | null;
    sourceName?: string | null;
    totalReceived?: number | null;
    processed?: number | null;
    created?: number | null;
    updated?: number | null;
    errorCount?: number | null;
    dryRun?: boolean | null;
    processedAt?: TimestampString | null;
    createdAt: TimestampString;
  } & DealerFeedIngestLog_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListIngestLogsBySeller`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListIngestLogsBySellerVariables } from '@dataconnect/generated-timberequip-dealers';
import { useListIngestLogsBySeller } from '@dataconnect/generated-timberequip-dealers/react'

export default function ListIngestLogsBySellerComponent() {
  // The `useListIngestLogsBySeller` Query hook requires an argument of type `ListIngestLogsBySellerVariables`:
  const listIngestLogsBySellerVars: ListIngestLogsBySellerVariables = {
    sellerUid: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListIngestLogsBySeller(listIngestLogsBySellerVars);
  // Variables can be defined inline as well.
  const query = useListIngestLogsBySeller({ sellerUid: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListIngestLogsBySeller(dataConnect, listIngestLogsBySellerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListIngestLogsBySeller(listIngestLogsBySellerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListIngestLogsBySeller(dataConnect, listIngestLogsBySellerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerFeedIngestLogs);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListAuditLogsByFeed
You can execute the `ListAuditLogsByFeed` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useListAuditLogsByFeed(dc: DataConnect, vars: ListAuditLogsByFeedVariables, options?: useDataConnectQueryOptions<ListAuditLogsByFeedData>): UseDataConnectQueryResult<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListAuditLogsByFeed(vars: ListAuditLogsByFeedVariables, options?: useDataConnectQueryOptions<ListAuditLogsByFeedData>): UseDataConnectQueryResult<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;
```

### Variables
The `ListAuditLogsByFeed` Query requires an argument of type `ListAuditLogsByFeedVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListAuditLogsByFeedVariables {
  dealerFeedId: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListAuditLogsByFeed` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListAuditLogsByFeed` Query is of type `ListAuditLogsByFeedData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListAuditLogsByFeedData {
  dealerAuditLogs: ({
    id: string;
    dealerFeedId?: string | null;
    sellerUid: string;
    action: string;
    details?: string | null;
    errorMessage?: string | null;
    itemsProcessed?: number | null;
    itemsSucceeded?: number | null;
    itemsFailed?: number | null;
    metadata?: unknown | null;
    createdAt: TimestampString;
  } & DealerAuditLog_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListAuditLogsByFeed`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListAuditLogsByFeedVariables } from '@dataconnect/generated-timberequip-dealers';
import { useListAuditLogsByFeed } from '@dataconnect/generated-timberequip-dealers/react'

export default function ListAuditLogsByFeedComponent() {
  // The `useListAuditLogsByFeed` Query hook requires an argument of type `ListAuditLogsByFeedVariables`:
  const listAuditLogsByFeedVars: ListAuditLogsByFeedVariables = {
    dealerFeedId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListAuditLogsByFeed(listAuditLogsByFeedVars);
  // Variables can be defined inline as well.
  const query = useListAuditLogsByFeed({ dealerFeedId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListAuditLogsByFeed(dataConnect, listAuditLogsByFeedVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListAuditLogsByFeed(listAuditLogsByFeedVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListAuditLogsByFeed(dataConnect, listAuditLogsByFeedVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerAuditLogs);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListWebhooksByDealer
You can execute the `ListWebhooksByDealer` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useListWebhooksByDealer(dc: DataConnect, vars: ListWebhooksByDealerVariables, options?: useDataConnectQueryOptions<ListWebhooksByDealerData>): UseDataConnectQueryResult<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListWebhooksByDealer(vars: ListWebhooksByDealerVariables, options?: useDataConnectQueryOptions<ListWebhooksByDealerData>): UseDataConnectQueryResult<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;
```

### Variables
The `ListWebhooksByDealer` Query requires an argument of type `ListWebhooksByDealerVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListWebhooksByDealerVariables {
  dealerUid: string;
}
```
### Return Type
Recall that calling the `ListWebhooksByDealer` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListWebhooksByDealer` Query is of type `ListWebhooksByDealerData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListWebhooksByDealerData {
  dealerWebhookSubscriptions: ({
    id: string;
    dealerUid: string;
    callbackUrl: string;
    events?: unknown | null;
    active?: boolean | null;
    secretMasked?: string | null;
    failureCount?: number | null;
    lastDeliveryAt?: TimestampString | null;
    createdAt: TimestampString;
  } & DealerWebhookSubscription_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListWebhooksByDealer`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListWebhooksByDealerVariables } from '@dataconnect/generated-timberequip-dealers';
import { useListWebhooksByDealer } from '@dataconnect/generated-timberequip-dealers/react'

export default function ListWebhooksByDealerComponent() {
  // The `useListWebhooksByDealer` Query hook requires an argument of type `ListWebhooksByDealerVariables`:
  const listWebhooksByDealerVars: ListWebhooksByDealerVariables = {
    dealerUid: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListWebhooksByDealer(listWebhooksByDealerVars);
  // Variables can be defined inline as well.
  const query = useListWebhooksByDealer({ dealerUid: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListWebhooksByDealer(dataConnect, listWebhooksByDealerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListWebhooksByDealer(listWebhooksByDealerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListWebhooksByDealer(dataConnect, listWebhooksByDealerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerWebhookSubscriptions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetWidgetConfig
You can execute the `GetWidgetConfig` Query using the following Query hook function, which is defined in [dealers/react/index.d.ts](./index.d.ts):

```javascript
useGetWidgetConfig(dc: DataConnect, vars: GetWidgetConfigVariables, options?: useDataConnectQueryOptions<GetWidgetConfigData>): UseDataConnectQueryResult<GetWidgetConfigData, GetWidgetConfigVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetWidgetConfig(vars: GetWidgetConfigVariables, options?: useDataConnectQueryOptions<GetWidgetConfigData>): UseDataConnectQueryResult<GetWidgetConfigData, GetWidgetConfigVariables>;
```

### Variables
The `GetWidgetConfig` Query requires an argument of type `GetWidgetConfigVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetWidgetConfigVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetWidgetConfig` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetWidgetConfig` Query is of type `GetWidgetConfigData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetWidgetConfigData {
  dealerWidgetConfig?: {
    id: string;
    cardStyle?: string | null;
    accentColor?: string | null;
    fontFamily?: string | null;
    darkMode?: boolean | null;
    showInquiry?: boolean | null;
    showCall?: boolean | null;
    showDetails?: boolean | null;
    pageSize?: number | null;
    customCss?: string | null;
    updatedAt?: TimestampString | null;
  } & DealerWidgetConfig_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetWidgetConfig`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetWidgetConfigVariables } from '@dataconnect/generated-timberequip-dealers';
import { useGetWidgetConfig } from '@dataconnect/generated-timberequip-dealers/react'

export default function GetWidgetConfigComponent() {
  // The `useGetWidgetConfig` Query hook requires an argument of type `GetWidgetConfigVariables`:
  const getWidgetConfigVars: GetWidgetConfigVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetWidgetConfig(getWidgetConfigVars);
  // Variables can be defined inline as well.
  const query = useGetWidgetConfig({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetWidgetConfig(dataConnect, getWidgetConfigVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetWidgetConfig(getWidgetConfigVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetWidgetConfig(dataConnect, getWidgetConfigVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.dealerWidgetConfig);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

# Mutations

The React generated SDK provides Mutations hook functions that call and return [`useDataConnectMutation`](https://react-query-firebase.invertase.dev/react/data-connect/mutations) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, and the most recent data returned by the Mutation, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/mutations).

Mutation hooks do not execute their Mutations automatically when called. Rather, after calling the Mutation hook function and getting a `UseMutationResult` object, you must call the `UseMutationResult.mutate()` function to execute the Mutation.

To learn more about TanStack React Query's Mutations, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).

## Using Mutation Hooks
Here's a general overview of how to use the generated Mutation hooks in your code:

- Mutation hook functions are not called with the arguments to the Mutation. Instead, arguments are passed to `UseMutationResult.mutate()`.
- If the Mutation has no variables, the `mutate()` function does not require arguments.
- If the Mutation has any required variables, the `mutate()` function will require at least one argument: an object that contains all the required variables for the Mutation.
- If the Mutation has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Mutation's variables are optional, the Mutation hook function does not require any arguments.
- Mutation hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Mutation hooks also accept an `options` argument of type `useDataConnectMutationOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations#mutation-side-effects).
  - `UseMutationResult.mutate()` also accepts an `options` argument of type `useDataConnectMutationOptions`.
  - ***Special case:*** If the Mutation has no arguments (or all optional arguments and you wish to provide none), and you want to pass `options` to `UseMutationResult.mutate()`, you must pass `undefined` where you would normally pass the Mutation's arguments, and then may provide the options argument.

Below are examples of how to use the `dealers` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## UpsertDealerFeedProfile
You can execute the `UpsertDealerFeedProfile` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dealers/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertDealerFeedProfile(options?: useDataConnectMutationOptions<UpsertDealerFeedProfileData, FirebaseError, UpsertDealerFeedProfileVariables>): UseDataConnectMutationResult<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertDealerFeedProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertDealerFeedProfileData, FirebaseError, UpsertDealerFeedProfileVariables>): UseDataConnectMutationResult<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;
```

### Variables
The `UpsertDealerFeedProfile` Mutation requires an argument of type `UpsertDealerFeedProfileVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertDealerFeedProfileVariables {
  id: string;
  sellerUid: string;
  dealerName?: string | null;
  dealerEmail?: string | null;
  sourceName?: string | null;
  sourceType?: string | null;
  rawInput?: string | null;
  feedUrl?: string | null;
  apiEndpoint?: string | null;
  status?: string | null;
  syncMode?: string | null;
  syncFrequency?: string | null;
  nightlySyncEnabled?: boolean | null;
  autoPublish?: boolean | null;
  fieldMapping?: unknown | null;
  apiKeyPreview?: string | null;
  totalListingsSynced?: number | null;
  totalListingsActive?: number | null;
  totalListingsCreated?: number | null;
  totalListingsUpdated?: number | null;
  totalListingsDeleted?: number | null;
  lastSyncAt?: TimestampString | null;
  nextSyncAt?: TimestampString | null;
  lastSyncStatus?: string | null;
  lastSyncMessage?: string | null;
  lastResolvedType?: string | null;
}
```
### Return Type
Recall that calling the `UpsertDealerFeedProfile` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertDealerFeedProfile` Mutation is of type `UpsertDealerFeedProfileData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertDealerFeedProfileData {
  dealerFeedProfile_upsert: DealerFeedProfile_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertDealerFeedProfile`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertDealerFeedProfileVariables } from '@dataconnect/generated-timberequip-dealers';
import { useUpsertDealerFeedProfile } from '@dataconnect/generated-timberequip-dealers/react'

export default function UpsertDealerFeedProfileComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertDealerFeedProfile();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertDealerFeedProfile(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertDealerFeedProfile(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertDealerFeedProfile(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertDealerFeedProfile` Mutation requires an argument of type `UpsertDealerFeedProfileVariables`:
  const upsertDealerFeedProfileVars: UpsertDealerFeedProfileVariables = {
    id: ..., 
    sellerUid: ..., 
    dealerName: ..., // optional
    dealerEmail: ..., // optional
    sourceName: ..., // optional
    sourceType: ..., // optional
    rawInput: ..., // optional
    feedUrl: ..., // optional
    apiEndpoint: ..., // optional
    status: ..., // optional
    syncMode: ..., // optional
    syncFrequency: ..., // optional
    nightlySyncEnabled: ..., // optional
    autoPublish: ..., // optional
    fieldMapping: ..., // optional
    apiKeyPreview: ..., // optional
    totalListingsSynced: ..., // optional
    totalListingsActive: ..., // optional
    totalListingsCreated: ..., // optional
    totalListingsUpdated: ..., // optional
    totalListingsDeleted: ..., // optional
    lastSyncAt: ..., // optional
    nextSyncAt: ..., // optional
    lastSyncStatus: ..., // optional
    lastSyncMessage: ..., // optional
    lastResolvedType: ..., // optional
  };
  mutation.mutate(upsertDealerFeedProfileVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., sellerUid: ..., dealerName: ..., dealerEmail: ..., sourceName: ..., sourceType: ..., rawInput: ..., feedUrl: ..., apiEndpoint: ..., status: ..., syncMode: ..., syncFrequency: ..., nightlySyncEnabled: ..., autoPublish: ..., fieldMapping: ..., apiKeyPreview: ..., totalListingsSynced: ..., totalListingsActive: ..., totalListingsCreated: ..., totalListingsUpdated: ..., totalListingsDeleted: ..., lastSyncAt: ..., nextSyncAt: ..., lastSyncStatus: ..., lastSyncMessage: ..., lastResolvedType: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertDealerFeedProfileVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.dealerFeedProfile_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateDealerFeedProfileSyncStats
You can execute the `UpdateDealerFeedProfileSyncStats` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dealers/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateDealerFeedProfileSyncStats(options?: useDataConnectMutationOptions<UpdateDealerFeedProfileSyncStatsData, FirebaseError, UpdateDealerFeedProfileSyncStatsVariables>): UseDataConnectMutationResult<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateDealerFeedProfileSyncStats(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateDealerFeedProfileSyncStatsData, FirebaseError, UpdateDealerFeedProfileSyncStatsVariables>): UseDataConnectMutationResult<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;
```

### Variables
The `UpdateDealerFeedProfileSyncStats` Mutation requires an argument of type `UpdateDealerFeedProfileSyncStatsVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateDealerFeedProfileSyncStatsVariables {
  id: string;
  totalListingsSynced?: number | null;
  totalListingsActive?: number | null;
  totalListingsCreated?: number | null;
  totalListingsUpdated?: number | null;
  totalListingsDeleted?: number | null;
  lastSyncAt?: TimestampString | null;
  lastSyncStatus?: string | null;
  lastSyncMessage?: string | null;
}
```
### Return Type
Recall that calling the `UpdateDealerFeedProfileSyncStats` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateDealerFeedProfileSyncStats` Mutation is of type `UpdateDealerFeedProfileSyncStatsData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateDealerFeedProfileSyncStatsData {
  dealerFeedProfile_update?: DealerFeedProfile_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateDealerFeedProfileSyncStats`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateDealerFeedProfileSyncStatsVariables } from '@dataconnect/generated-timberequip-dealers';
import { useUpdateDealerFeedProfileSyncStats } from '@dataconnect/generated-timberequip-dealers/react'

export default function UpdateDealerFeedProfileSyncStatsComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateDealerFeedProfileSyncStats();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateDealerFeedProfileSyncStats(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateDealerFeedProfileSyncStats(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateDealerFeedProfileSyncStats(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateDealerFeedProfileSyncStats` Mutation requires an argument of type `UpdateDealerFeedProfileSyncStatsVariables`:
  const updateDealerFeedProfileSyncStatsVars: UpdateDealerFeedProfileSyncStatsVariables = {
    id: ..., 
    totalListingsSynced: ..., // optional
    totalListingsActive: ..., // optional
    totalListingsCreated: ..., // optional
    totalListingsUpdated: ..., // optional
    totalListingsDeleted: ..., // optional
    lastSyncAt: ..., // optional
    lastSyncStatus: ..., // optional
    lastSyncMessage: ..., // optional
  };
  mutation.mutate(updateDealerFeedProfileSyncStatsVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., totalListingsSynced: ..., totalListingsActive: ..., totalListingsCreated: ..., totalListingsUpdated: ..., totalListingsDeleted: ..., lastSyncAt: ..., lastSyncStatus: ..., lastSyncMessage: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateDealerFeedProfileSyncStatsVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.dealerFeedProfile_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertDealerListing
You can execute the `UpsertDealerListing` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dealers/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertDealerListing(options?: useDataConnectMutationOptions<UpsertDealerListingData, FirebaseError, UpsertDealerListingVariables>): UseDataConnectMutationResult<UpsertDealerListingData, UpsertDealerListingVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertDealerListing(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertDealerListingData, FirebaseError, UpsertDealerListingVariables>): UseDataConnectMutationResult<UpsertDealerListingData, UpsertDealerListingVariables>;
```

### Variables
The `UpsertDealerListing` Mutation requires an argument of type `UpsertDealerListingVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertDealerListingVariables {
  id: string;
  dealerFeedId: string;
  sellerUid: string;
  externalListingId: string;
  timberequipListingId?: string | null;
  equipmentHash?: string | null;
  status?: string | null;
  dealerSourceUrl?: string | null;
  dataSource?: string | null;
  externalData?: unknown | null;
  mappedData?: unknown | null;
  syncedAt?: TimestampString | null;
}
```
### Return Type
Recall that calling the `UpsertDealerListing` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertDealerListing` Mutation is of type `UpsertDealerListingData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertDealerListingData {
  dealerListing_upsert: DealerListing_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertDealerListing`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertDealerListingVariables } from '@dataconnect/generated-timberequip-dealers';
import { useUpsertDealerListing } from '@dataconnect/generated-timberequip-dealers/react'

export default function UpsertDealerListingComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertDealerListing();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertDealerListing(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertDealerListing(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertDealerListing(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertDealerListing` Mutation requires an argument of type `UpsertDealerListingVariables`:
  const upsertDealerListingVars: UpsertDealerListingVariables = {
    id: ..., 
    dealerFeedId: ..., 
    sellerUid: ..., 
    externalListingId: ..., 
    timberequipListingId: ..., // optional
    equipmentHash: ..., // optional
    status: ..., // optional
    dealerSourceUrl: ..., // optional
    dataSource: ..., // optional
    externalData: ..., // optional
    mappedData: ..., // optional
    syncedAt: ..., // optional
  };
  mutation.mutate(upsertDealerListingVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., dealerFeedId: ..., sellerUid: ..., externalListingId: ..., timberequipListingId: ..., equipmentHash: ..., status: ..., dealerSourceUrl: ..., dataSource: ..., externalData: ..., mappedData: ..., syncedAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertDealerListingVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.dealerListing_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## InsertDealerFeedIngestLog
You can execute the `InsertDealerFeedIngestLog` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dealers/react/index.d.ts](./index.d.ts)):
```javascript
useInsertDealerFeedIngestLog(options?: useDataConnectMutationOptions<InsertDealerFeedIngestLogData, FirebaseError, InsertDealerFeedIngestLogVariables>): UseDataConnectMutationResult<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useInsertDealerFeedIngestLog(dc: DataConnect, options?: useDataConnectMutationOptions<InsertDealerFeedIngestLogData, FirebaseError, InsertDealerFeedIngestLogVariables>): UseDataConnectMutationResult<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;
```

### Variables
The `InsertDealerFeedIngestLog` Mutation requires an argument of type `InsertDealerFeedIngestLogVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface InsertDealerFeedIngestLogVariables {
  id: string;
  feedId?: string | null;
  sellerUid: string;
  actorUid?: string | null;
  actorRole?: string | null;
  sourceName?: string | null;
  totalReceived?: number | null;
  processed?: number | null;
  created?: number | null;
  updated?: number | null;
  upserted?: number | null;
  skipped?: number | null;
  archived?: number | null;
  errorCount?: number | null;
  errors?: unknown | null;
  dryRun?: boolean | null;
  syncContext?: unknown | null;
  processedAt?: TimestampString | null;
}
```
### Return Type
Recall that calling the `InsertDealerFeedIngestLog` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `InsertDealerFeedIngestLog` Mutation is of type `InsertDealerFeedIngestLogData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface InsertDealerFeedIngestLogData {
  dealerFeedIngestLog_insert: DealerFeedIngestLog_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `InsertDealerFeedIngestLog`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, InsertDealerFeedIngestLogVariables } from '@dataconnect/generated-timberequip-dealers';
import { useInsertDealerFeedIngestLog } from '@dataconnect/generated-timberequip-dealers/react'

export default function InsertDealerFeedIngestLogComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useInsertDealerFeedIngestLog();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useInsertDealerFeedIngestLog(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertDealerFeedIngestLog(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertDealerFeedIngestLog(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useInsertDealerFeedIngestLog` Mutation requires an argument of type `InsertDealerFeedIngestLogVariables`:
  const insertDealerFeedIngestLogVars: InsertDealerFeedIngestLogVariables = {
    id: ..., 
    feedId: ..., // optional
    sellerUid: ..., 
    actorUid: ..., // optional
    actorRole: ..., // optional
    sourceName: ..., // optional
    totalReceived: ..., // optional
    processed: ..., // optional
    created: ..., // optional
    updated: ..., // optional
    upserted: ..., // optional
    skipped: ..., // optional
    archived: ..., // optional
    errorCount: ..., // optional
    errors: ..., // optional
    dryRun: ..., // optional
    syncContext: ..., // optional
    processedAt: ..., // optional
  };
  mutation.mutate(insertDealerFeedIngestLogVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., feedId: ..., sellerUid: ..., actorUid: ..., actorRole: ..., sourceName: ..., totalReceived: ..., processed: ..., created: ..., updated: ..., upserted: ..., skipped: ..., archived: ..., errorCount: ..., errors: ..., dryRun: ..., syncContext: ..., processedAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(insertDealerFeedIngestLogVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.dealerFeedIngestLog_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## InsertDealerAuditLog
You can execute the `InsertDealerAuditLog` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dealers/react/index.d.ts](./index.d.ts)):
```javascript
useInsertDealerAuditLog(options?: useDataConnectMutationOptions<InsertDealerAuditLogData, FirebaseError, InsertDealerAuditLogVariables>): UseDataConnectMutationResult<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useInsertDealerAuditLog(dc: DataConnect, options?: useDataConnectMutationOptions<InsertDealerAuditLogData, FirebaseError, InsertDealerAuditLogVariables>): UseDataConnectMutationResult<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;
```

### Variables
The `InsertDealerAuditLog` Mutation requires an argument of type `InsertDealerAuditLogVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface InsertDealerAuditLogVariables {
  id: string;
  dealerFeedId?: string | null;
  sellerUid: string;
  action: string;
  details?: string | null;
  errorMessage?: string | null;
  itemsProcessed?: number | null;
  itemsSucceeded?: number | null;
  itemsFailed?: number | null;
  metadata?: unknown | null;
}
```
### Return Type
Recall that calling the `InsertDealerAuditLog` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `InsertDealerAuditLog` Mutation is of type `InsertDealerAuditLogData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface InsertDealerAuditLogData {
  dealerAuditLog_insert: DealerAuditLog_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `InsertDealerAuditLog`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, InsertDealerAuditLogVariables } from '@dataconnect/generated-timberequip-dealers';
import { useInsertDealerAuditLog } from '@dataconnect/generated-timberequip-dealers/react'

export default function InsertDealerAuditLogComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useInsertDealerAuditLog();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useInsertDealerAuditLog(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertDealerAuditLog(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertDealerAuditLog(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useInsertDealerAuditLog` Mutation requires an argument of type `InsertDealerAuditLogVariables`:
  const insertDealerAuditLogVars: InsertDealerAuditLogVariables = {
    id: ..., 
    dealerFeedId: ..., // optional
    sellerUid: ..., 
    action: ..., 
    details: ..., // optional
    errorMessage: ..., // optional
    itemsProcessed: ..., // optional
    itemsSucceeded: ..., // optional
    itemsFailed: ..., // optional
    metadata: ..., // optional
  };
  mutation.mutate(insertDealerAuditLogVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., dealerFeedId: ..., sellerUid: ..., action: ..., details: ..., errorMessage: ..., itemsProcessed: ..., itemsSucceeded: ..., itemsFailed: ..., metadata: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(insertDealerAuditLogVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.dealerAuditLog_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertDealerWebhookSubscription
You can execute the `UpsertDealerWebhookSubscription` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dealers/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertDealerWebhookSubscription(options?: useDataConnectMutationOptions<UpsertDealerWebhookSubscriptionData, FirebaseError, UpsertDealerWebhookSubscriptionVariables>): UseDataConnectMutationResult<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertDealerWebhookSubscription(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertDealerWebhookSubscriptionData, FirebaseError, UpsertDealerWebhookSubscriptionVariables>): UseDataConnectMutationResult<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;
```

### Variables
The `UpsertDealerWebhookSubscription` Mutation requires an argument of type `UpsertDealerWebhookSubscriptionVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertDealerWebhookSubscriptionVariables {
  id: string;
  dealerUid: string;
  callbackUrl: string;
  events?: unknown | null;
  active?: boolean | null;
  secretMasked?: string | null;
  failureCount?: number | null;
  lastDeliveryAt?: TimestampString | null;
}
```
### Return Type
Recall that calling the `UpsertDealerWebhookSubscription` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertDealerWebhookSubscription` Mutation is of type `UpsertDealerWebhookSubscriptionData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertDealerWebhookSubscriptionData {
  dealerWebhookSubscription_upsert: DealerWebhookSubscription_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertDealerWebhookSubscription`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertDealerWebhookSubscriptionVariables } from '@dataconnect/generated-timberequip-dealers';
import { useUpsertDealerWebhookSubscription } from '@dataconnect/generated-timberequip-dealers/react'

export default function UpsertDealerWebhookSubscriptionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertDealerWebhookSubscription();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertDealerWebhookSubscription(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertDealerWebhookSubscription(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertDealerWebhookSubscription(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertDealerWebhookSubscription` Mutation requires an argument of type `UpsertDealerWebhookSubscriptionVariables`:
  const upsertDealerWebhookSubscriptionVars: UpsertDealerWebhookSubscriptionVariables = {
    id: ..., 
    dealerUid: ..., 
    callbackUrl: ..., 
    events: ..., // optional
    active: ..., // optional
    secretMasked: ..., // optional
    failureCount: ..., // optional
    lastDeliveryAt: ..., // optional
  };
  mutation.mutate(upsertDealerWebhookSubscriptionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., dealerUid: ..., callbackUrl: ..., events: ..., active: ..., secretMasked: ..., failureCount: ..., lastDeliveryAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertDealerWebhookSubscriptionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.dealerWebhookSubscription_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertDealerWidgetConfig
You can execute the `UpsertDealerWidgetConfig` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dealers/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertDealerWidgetConfig(options?: useDataConnectMutationOptions<UpsertDealerWidgetConfigData, FirebaseError, UpsertDealerWidgetConfigVariables>): UseDataConnectMutationResult<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertDealerWidgetConfig(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertDealerWidgetConfigData, FirebaseError, UpsertDealerWidgetConfigVariables>): UseDataConnectMutationResult<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;
```

### Variables
The `UpsertDealerWidgetConfig` Mutation requires an argument of type `UpsertDealerWidgetConfigVariables`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertDealerWidgetConfigVariables {
  id: string;
  cardStyle?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  darkMode?: boolean | null;
  showInquiry?: boolean | null;
  showCall?: boolean | null;
  showDetails?: boolean | null;
  pageSize?: number | null;
  customCss?: string | null;
}
```
### Return Type
Recall that calling the `UpsertDealerWidgetConfig` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertDealerWidgetConfig` Mutation is of type `UpsertDealerWidgetConfigData`, which is defined in [dealers/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertDealerWidgetConfigData {
  dealerWidgetConfig_upsert: DealerWidgetConfig_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertDealerWidgetConfig`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertDealerWidgetConfigVariables } from '@dataconnect/generated-timberequip-dealers';
import { useUpsertDealerWidgetConfig } from '@dataconnect/generated-timberequip-dealers/react'

export default function UpsertDealerWidgetConfigComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertDealerWidgetConfig();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertDealerWidgetConfig(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertDealerWidgetConfig(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertDealerWidgetConfig(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertDealerWidgetConfig` Mutation requires an argument of type `UpsertDealerWidgetConfigVariables`:
  const upsertDealerWidgetConfigVars: UpsertDealerWidgetConfigVariables = {
    id: ..., 
    cardStyle: ..., // optional
    accentColor: ..., // optional
    fontFamily: ..., // optional
    darkMode: ..., // optional
    showInquiry: ..., // optional
    showCall: ..., // optional
    showDetails: ..., // optional
    pageSize: ..., // optional
    customCss: ..., // optional
  };
  mutation.mutate(upsertDealerWidgetConfigVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., cardStyle: ..., accentColor: ..., fontFamily: ..., darkMode: ..., showInquiry: ..., showCall: ..., showDetails: ..., pageSize: ..., customCss: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertDealerWidgetConfigVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.dealerWidgetConfig_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

