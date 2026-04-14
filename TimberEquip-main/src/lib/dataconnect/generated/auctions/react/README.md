# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `auctions`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`auctions/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-auctions/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetAuctionById*](#getauctionbyid)
  - [*GetAuctionBySlug*](#getauctionbyslug)
  - [*ListActiveAuctions*](#listactiveauctions)
  - [*ListAuctionsByStatus*](#listauctionsbystatus)
  - [*GetLotsByAuction*](#getlotsbyauction)
  - [*GetLotById*](#getlotbyid)
  - [*GetPromotedLots*](#getpromotedlots)
  - [*GetBidsByLot*](#getbidsbylot)
  - [*GetBidsByBidder*](#getbidsbybidder)
  - [*GetAuctionInvoicesByBuyer*](#getauctioninvoicesbybuyer)
  - [*GetAuctionInvoicesByAuction*](#getauctioninvoicesbyauction)
  - [*GetAuctionInvoiceById*](#getauctioninvoicebyid)
  - [*GetBidderProfileByUserId*](#getbidderprofilebyuserid)
- [**Mutations**](#mutations)
  - [*UpsertAuction*](#upsertauction)
  - [*UpsertAuctionLot*](#upsertauctionlot)
  - [*InsertAuctionBid*](#insertauctionbid)
  - [*UpdateBidStatus*](#updatebidstatus)
  - [*UpsertAuctionInvoice*](#upsertauctioninvoice)
  - [*UpdateAuctionInvoiceStatus*](#updateauctioninvoicestatus)
  - [*UpdateAuctionLotBidState*](#updateauctionlotbidstate)
  - [*UpdateAuctionLotStatus*](#updateauctionlotstatus)
  - [*UpsertBidderProfile*](#upsertbidderprofile)
  - [*UpdateAuctionStatus*](#updateauctionstatus)
  - [*UpdateAuctionStats*](#updateauctionstats)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `auctions`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

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
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `auctions`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-auctions';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-auctions';

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

Below are examples of how to use the `auctions` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetAuctionById
You can execute the `GetAuctionById` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetAuctionById(dc: DataConnect, vars: GetAuctionByIdVariables, options?: useDataConnectQueryOptions<GetAuctionByIdData>): UseDataConnectQueryResult<GetAuctionByIdData, GetAuctionByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetAuctionById(vars: GetAuctionByIdVariables, options?: useDataConnectQueryOptions<GetAuctionByIdData>): UseDataConnectQueryResult<GetAuctionByIdData, GetAuctionByIdVariables>;
```

### Variables
The `GetAuctionById` Query requires an argument of type `GetAuctionByIdVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetAuctionByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetAuctionById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetAuctionById` Query is of type `GetAuctionByIdData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetAuctionByIdData {
  auction?: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverImageUrl?: string | null;
    startTime: TimestampString;
    endTime: TimestampString;
    previewStartTime?: TimestampString | null;
    status: string;
    lotCount?: number | null;
    totalBids?: number | null;
    totalGmv?: number | null;
    defaultBuyerPremiumPercent?: number | null;
    softCloseThresholdMin?: number | null;
    softCloseExtensionMin?: number | null;
    staggerIntervalMin?: number | null;
    defaultPaymentDeadlineDays?: number | null;
    defaultRemovalDeadlineDays?: number | null;
    termsAndConditionsUrl?: string | null;
    featured?: boolean | null;
    bannerEnabled?: boolean | null;
    bannerImageUrl?: string | null;
    createdBy: string;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & Auction_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetAuctionById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetAuctionByIdVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetAuctionById } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetAuctionByIdComponent() {
  // The `useGetAuctionById` Query hook requires an argument of type `GetAuctionByIdVariables`:
  const getAuctionByIdVars: GetAuctionByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetAuctionById(getAuctionByIdVars);
  // Variables can be defined inline as well.
  const query = useGetAuctionById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetAuctionById(dataConnect, getAuctionByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionById(getAuctionByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionById(dataConnect, getAuctionByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auction);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetAuctionBySlug
You can execute the `GetAuctionBySlug` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetAuctionBySlug(dc: DataConnect, vars: GetAuctionBySlugVariables, options?: useDataConnectQueryOptions<GetAuctionBySlugData>): UseDataConnectQueryResult<GetAuctionBySlugData, GetAuctionBySlugVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetAuctionBySlug(vars: GetAuctionBySlugVariables, options?: useDataConnectQueryOptions<GetAuctionBySlugData>): UseDataConnectQueryResult<GetAuctionBySlugData, GetAuctionBySlugVariables>;
```

### Variables
The `GetAuctionBySlug` Query requires an argument of type `GetAuctionBySlugVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetAuctionBySlugVariables {
  slug: string;
}
```
### Return Type
Recall that calling the `GetAuctionBySlug` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetAuctionBySlug` Query is of type `GetAuctionBySlugData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetAuctionBySlugData {
  auctions: ({
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverImageUrl?: string | null;
    startTime: TimestampString;
    endTime: TimestampString;
    previewStartTime?: TimestampString | null;
    status: string;
    lotCount?: number | null;
    totalBids?: number | null;
    featured?: boolean | null;
    createdAt: TimestampString;
  } & Auction_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetAuctionBySlug`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetAuctionBySlugVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetAuctionBySlug } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetAuctionBySlugComponent() {
  // The `useGetAuctionBySlug` Query hook requires an argument of type `GetAuctionBySlugVariables`:
  const getAuctionBySlugVars: GetAuctionBySlugVariables = {
    slug: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetAuctionBySlug(getAuctionBySlugVars);
  // Variables can be defined inline as well.
  const query = useGetAuctionBySlug({ slug: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetAuctionBySlug(dataConnect, getAuctionBySlugVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionBySlug(getAuctionBySlugVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionBySlug(dataConnect, getAuctionBySlugVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListActiveAuctions
You can execute the `ListActiveAuctions` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useListActiveAuctions(dc: DataConnect, vars?: ListActiveAuctionsVariables, options?: useDataConnectQueryOptions<ListActiveAuctionsData>): UseDataConnectQueryResult<ListActiveAuctionsData, ListActiveAuctionsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListActiveAuctions(vars?: ListActiveAuctionsVariables, options?: useDataConnectQueryOptions<ListActiveAuctionsData>): UseDataConnectQueryResult<ListActiveAuctionsData, ListActiveAuctionsVariables>;
```

### Variables
The `ListActiveAuctions` Query has an optional argument of type `ListActiveAuctionsVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListActiveAuctionsVariables {
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListActiveAuctions` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListActiveAuctions` Query is of type `ListActiveAuctionsData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListActiveAuctionsData {
  auctions: ({
    id: string;
    title: string;
    slug: string;
    coverImageUrl?: string | null;
    startTime: TimestampString;
    endTime: TimestampString;
    status: string;
    lotCount?: number | null;
    totalBids?: number | null;
    featured?: boolean | null;
  } & Auction_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListActiveAuctions`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListActiveAuctionsVariables } from '@dataconnect/generated-timberequip-auctions';
import { useListActiveAuctions } from '@dataconnect/generated-timberequip-auctions/react'

export default function ListActiveAuctionsComponent() {
  // The `useListActiveAuctions` Query hook has an optional argument of type `ListActiveAuctionsVariables`:
  const listActiveAuctionsVars: ListActiveAuctionsVariables = {
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListActiveAuctions(listActiveAuctionsVars);
  // Variables can be defined inline as well.
  const query = useListActiveAuctions({ limit: ..., });
  // Since all variables are optional for this Query, you can omit the `ListActiveAuctionsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListActiveAuctions();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListActiveAuctions(dataConnect, listActiveAuctionsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListActiveAuctions(listActiveAuctionsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListActiveAuctions(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListActiveAuctions(dataConnect, listActiveAuctionsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListAuctionsByStatus
You can execute the `ListAuctionsByStatus` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useListAuctionsByStatus(dc: DataConnect, vars: ListAuctionsByStatusVariables, options?: useDataConnectQueryOptions<ListAuctionsByStatusData>): UseDataConnectQueryResult<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListAuctionsByStatus(vars: ListAuctionsByStatusVariables, options?: useDataConnectQueryOptions<ListAuctionsByStatusData>): UseDataConnectQueryResult<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;
```

### Variables
The `ListAuctionsByStatus` Query requires an argument of type `ListAuctionsByStatusVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListAuctionsByStatusVariables {
  status: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListAuctionsByStatus` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListAuctionsByStatus` Query is of type `ListAuctionsByStatusData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListAuctionsByStatusData {
  auctions: ({
    id: string;
    title: string;
    slug: string;
    startTime: TimestampString;
    endTime: TimestampString;
    status: string;
    lotCount?: number | null;
    totalBids?: number | null;
    totalGmv?: number | null;
    createdAt: TimestampString;
  } & Auction_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListAuctionsByStatus`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListAuctionsByStatusVariables } from '@dataconnect/generated-timberequip-auctions';
import { useListAuctionsByStatus } from '@dataconnect/generated-timberequip-auctions/react'

export default function ListAuctionsByStatusComponent() {
  // The `useListAuctionsByStatus` Query hook requires an argument of type `ListAuctionsByStatusVariables`:
  const listAuctionsByStatusVars: ListAuctionsByStatusVariables = {
    status: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListAuctionsByStatus(listAuctionsByStatusVars);
  // Variables can be defined inline as well.
  const query = useListAuctionsByStatus({ status: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListAuctionsByStatus(dataConnect, listAuctionsByStatusVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListAuctionsByStatus(listAuctionsByStatusVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListAuctionsByStatus(dataConnect, listAuctionsByStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetLotsByAuction
You can execute the `GetLotsByAuction` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetLotsByAuction(dc: DataConnect, vars: GetLotsByAuctionVariables, options?: useDataConnectQueryOptions<GetLotsByAuctionData>): UseDataConnectQueryResult<GetLotsByAuctionData, GetLotsByAuctionVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetLotsByAuction(vars: GetLotsByAuctionVariables, options?: useDataConnectQueryOptions<GetLotsByAuctionData>): UseDataConnectQueryResult<GetLotsByAuctionData, GetLotsByAuctionVariables>;
```

### Variables
The `GetLotsByAuction` Query requires an argument of type `GetLotsByAuctionVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetLotsByAuctionVariables {
  auctionId: string;
}
```
### Return Type
Recall that calling the `GetLotsByAuction` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetLotsByAuction` Query is of type `GetLotsByAuctionData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetLotsByAuctionData {
  auctionLots: ({
    id: string;
    auctionId: string;
    listingId?: string | null;
    lotNumber: string;
    closeOrder: number;
    startingBid?: number | null;
    reserveMet?: boolean | null;
    buyerPremiumPercent?: number | null;
    startTime?: TimestampString | null;
    endTime?: TimestampString | null;
    currentBid?: number | null;
    currentBidderAnonymousId?: string | null;
    bidCount?: number | null;
    uniqueBidders?: number | null;
    status: string;
    promoted?: boolean | null;
    promotedOrder?: number | null;
    winningBidderId?: string | null;
    winningBid?: number | null;
    title?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    year?: number | null;
    thumbnailUrl?: string | null;
    pickupLocation?: string | null;
    isTitledItem?: boolean | null;
  } & AuctionLot_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetLotsByAuction`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetLotsByAuctionVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetLotsByAuction } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetLotsByAuctionComponent() {
  // The `useGetLotsByAuction` Query hook requires an argument of type `GetLotsByAuctionVariables`:
  const getLotsByAuctionVars: GetLotsByAuctionVariables = {
    auctionId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetLotsByAuction(getLotsByAuctionVars);
  // Variables can be defined inline as well.
  const query = useGetLotsByAuction({ auctionId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetLotsByAuction(dataConnect, getLotsByAuctionVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetLotsByAuction(getLotsByAuctionVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetLotsByAuction(dataConnect, getLotsByAuctionVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctionLots);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetLotById
You can execute the `GetLotById` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetLotById(dc: DataConnect, vars: GetLotByIdVariables, options?: useDataConnectQueryOptions<GetLotByIdData>): UseDataConnectQueryResult<GetLotByIdData, GetLotByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetLotById(vars: GetLotByIdVariables, options?: useDataConnectQueryOptions<GetLotByIdData>): UseDataConnectQueryResult<GetLotByIdData, GetLotByIdVariables>;
```

### Variables
The `GetLotById` Query requires an argument of type `GetLotByIdVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetLotByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetLotById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetLotById` Query is of type `GetLotByIdData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetLotByIdData {
  auctionLot?: {
    id: string;
    auctionId: string;
    listingId?: string | null;
    lotNumber: string;
    closeOrder: number;
    startingBid?: number | null;
    reservePrice?: number | null;
    reserveMet?: boolean | null;
    buyerPremiumPercent?: number | null;
    startTime?: TimestampString | null;
    endTime?: TimestampString | null;
    originalEndTime?: TimestampString | null;
    extensionCount?: number | null;
    currentBid?: number | null;
    currentBidderId?: string | null;
    currentBidderAnonymousId?: string | null;
    bidCount?: number | null;
    uniqueBidders?: number | null;
    lastBidTime?: TimestampString | null;
    status: string;
    promoted?: boolean | null;
    winningBidderId?: string | null;
    winningBid?: number | null;
    watcherCount?: number | null;
    title?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    year?: number | null;
    thumbnailUrl?: string | null;
    pickupLocation?: string | null;
    paymentDeadlineDays?: number | null;
    removalDeadlineDays?: number | null;
    storageFeePerDay?: number | null;
    isTitledItem?: boolean | null;
    titleDocumentFee?: number | null;
  } & AuctionLot_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetLotById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetLotByIdVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetLotById } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetLotByIdComponent() {
  // The `useGetLotById` Query hook requires an argument of type `GetLotByIdVariables`:
  const getLotByIdVars: GetLotByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetLotById(getLotByIdVars);
  // Variables can be defined inline as well.
  const query = useGetLotById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetLotById(dataConnect, getLotByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetLotById(getLotByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetLotById(dataConnect, getLotByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctionLot);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetPromotedLots
You can execute the `GetPromotedLots` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetPromotedLots(dc: DataConnect, vars: GetPromotedLotsVariables, options?: useDataConnectQueryOptions<GetPromotedLotsData>): UseDataConnectQueryResult<GetPromotedLotsData, GetPromotedLotsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetPromotedLots(vars: GetPromotedLotsVariables, options?: useDataConnectQueryOptions<GetPromotedLotsData>): UseDataConnectQueryResult<GetPromotedLotsData, GetPromotedLotsVariables>;
```

### Variables
The `GetPromotedLots` Query requires an argument of type `GetPromotedLotsVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetPromotedLotsVariables {
  auctionId: string;
}
```
### Return Type
Recall that calling the `GetPromotedLots` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetPromotedLots` Query is of type `GetPromotedLotsData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetPromotedLotsData {
  auctionLots: ({
    id: string;
    lotNumber: string;
    currentBid?: number | null;
    bidCount?: number | null;
    status: string;
    title?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    year?: number | null;
    thumbnailUrl?: string | null;
  } & AuctionLot_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetPromotedLots`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetPromotedLotsVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetPromotedLots } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetPromotedLotsComponent() {
  // The `useGetPromotedLots` Query hook requires an argument of type `GetPromotedLotsVariables`:
  const getPromotedLotsVars: GetPromotedLotsVariables = {
    auctionId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetPromotedLots(getPromotedLotsVars);
  // Variables can be defined inline as well.
  const query = useGetPromotedLots({ auctionId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetPromotedLots(dataConnect, getPromotedLotsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetPromotedLots(getPromotedLotsVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetPromotedLots(dataConnect, getPromotedLotsVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctionLots);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetBidsByLot
You can execute the `GetBidsByLot` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetBidsByLot(dc: DataConnect, vars: GetBidsByLotVariables, options?: useDataConnectQueryOptions<GetBidsByLotData>): UseDataConnectQueryResult<GetBidsByLotData, GetBidsByLotVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBidsByLot(vars: GetBidsByLotVariables, options?: useDataConnectQueryOptions<GetBidsByLotData>): UseDataConnectQueryResult<GetBidsByLotData, GetBidsByLotVariables>;
```

### Variables
The `GetBidsByLot` Query requires an argument of type `GetBidsByLotVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBidsByLotVariables {
  auctionId: string;
  lotId: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `GetBidsByLot` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBidsByLot` Query is of type `GetBidsByLotData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBidsByLotData {
  auctionBids: ({
    id: string;
    bidderId: string;
    bidderAnonymousId: string;
    amount: number;
    maxBid?: number | null;
    type: string;
    status: string;
    triggeredExtension?: boolean | null;
    bidTime: TimestampString;
  } & AuctionBid_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBidsByLot`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBidsByLotVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetBidsByLot } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetBidsByLotComponent() {
  // The `useGetBidsByLot` Query hook requires an argument of type `GetBidsByLotVariables`:
  const getBidsByLotVars: GetBidsByLotVariables = {
    auctionId: ..., 
    lotId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBidsByLot(getBidsByLotVars);
  // Variables can be defined inline as well.
  const query = useGetBidsByLot({ auctionId: ..., lotId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBidsByLot(dataConnect, getBidsByLotVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBidsByLot(getBidsByLotVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBidsByLot(dataConnect, getBidsByLotVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctionBids);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetBidsByBidder
You can execute the `GetBidsByBidder` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetBidsByBidder(dc: DataConnect, vars: GetBidsByBidderVariables, options?: useDataConnectQueryOptions<GetBidsByBidderData>): UseDataConnectQueryResult<GetBidsByBidderData, GetBidsByBidderVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBidsByBidder(vars: GetBidsByBidderVariables, options?: useDataConnectQueryOptions<GetBidsByBidderData>): UseDataConnectQueryResult<GetBidsByBidderData, GetBidsByBidderVariables>;
```

### Variables
The `GetBidsByBidder` Query requires an argument of type `GetBidsByBidderVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBidsByBidderVariables {
  bidderId: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `GetBidsByBidder` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBidsByBidder` Query is of type `GetBidsByBidderData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBidsByBidderData {
  auctionBids: ({
    id: string;
    auctionId: string;
    lotId: string;
    amount: number;
    status: string;
    bidTime: TimestampString;
  } & AuctionBid_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBidsByBidder`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBidsByBidderVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetBidsByBidder } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetBidsByBidderComponent() {
  // The `useGetBidsByBidder` Query hook requires an argument of type `GetBidsByBidderVariables`:
  const getBidsByBidderVars: GetBidsByBidderVariables = {
    bidderId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBidsByBidder(getBidsByBidderVars);
  // Variables can be defined inline as well.
  const query = useGetBidsByBidder({ bidderId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBidsByBidder(dataConnect, getBidsByBidderVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBidsByBidder(getBidsByBidderVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBidsByBidder(dataConnect, getBidsByBidderVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctionBids);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetAuctionInvoicesByBuyer
You can execute the `GetAuctionInvoicesByBuyer` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetAuctionInvoicesByBuyer(dc: DataConnect, vars: GetAuctionInvoicesByBuyerVariables, options?: useDataConnectQueryOptions<GetAuctionInvoicesByBuyerData>): UseDataConnectQueryResult<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetAuctionInvoicesByBuyer(vars: GetAuctionInvoicesByBuyerVariables, options?: useDataConnectQueryOptions<GetAuctionInvoicesByBuyerData>): UseDataConnectQueryResult<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;
```

### Variables
The `GetAuctionInvoicesByBuyer` Query requires an argument of type `GetAuctionInvoicesByBuyerVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetAuctionInvoicesByBuyerVariables {
  buyerId: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `GetAuctionInvoicesByBuyer` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetAuctionInvoicesByBuyer` Query is of type `GetAuctionInvoicesByBuyerData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetAuctionInvoicesByBuyerData {
  auctionInvoices: ({
    id: string;
    auctionId: string;
    lotId: string;
    sellerId: string;
    hammerPrice: number;
    buyerPremium: number;
    documentationFee?: number | null;
    salesTaxAmount?: number | null;
    totalDue: number;
    status: string;
    paymentMethod?: string | null;
    dueDate: TimestampString;
    paidAt?: TimestampString | null;
    createdAt: TimestampString;
  } & AuctionInvoice_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetAuctionInvoicesByBuyer`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetAuctionInvoicesByBuyerVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetAuctionInvoicesByBuyer } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetAuctionInvoicesByBuyerComponent() {
  // The `useGetAuctionInvoicesByBuyer` Query hook requires an argument of type `GetAuctionInvoicesByBuyerVariables`:
  const getAuctionInvoicesByBuyerVars: GetAuctionInvoicesByBuyerVariables = {
    buyerId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetAuctionInvoicesByBuyer(getAuctionInvoicesByBuyerVars);
  // Variables can be defined inline as well.
  const query = useGetAuctionInvoicesByBuyer({ buyerId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetAuctionInvoicesByBuyer(dataConnect, getAuctionInvoicesByBuyerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionInvoicesByBuyer(getAuctionInvoicesByBuyerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionInvoicesByBuyer(dataConnect, getAuctionInvoicesByBuyerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctionInvoices);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetAuctionInvoicesByAuction
You can execute the `GetAuctionInvoicesByAuction` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetAuctionInvoicesByAuction(dc: DataConnect, vars: GetAuctionInvoicesByAuctionVariables, options?: useDataConnectQueryOptions<GetAuctionInvoicesByAuctionData>): UseDataConnectQueryResult<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetAuctionInvoicesByAuction(vars: GetAuctionInvoicesByAuctionVariables, options?: useDataConnectQueryOptions<GetAuctionInvoicesByAuctionData>): UseDataConnectQueryResult<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;
```

### Variables
The `GetAuctionInvoicesByAuction` Query requires an argument of type `GetAuctionInvoicesByAuctionVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetAuctionInvoicesByAuctionVariables {
  auctionId: string;
}
```
### Return Type
Recall that calling the `GetAuctionInvoicesByAuction` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetAuctionInvoicesByAuction` Query is of type `GetAuctionInvoicesByAuctionData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetAuctionInvoicesByAuctionData {
  auctionInvoices: ({
    id: string;
    lotId: string;
    buyerId: string;
    sellerId: string;
    hammerPrice: number;
    buyerPremium: number;
    totalDue: number;
    status: string;
    paymentMethod?: string | null;
    dueDate: TimestampString;
    paidAt?: TimestampString | null;
    sellerPayout?: number | null;
    sellerPaidAt?: TimestampString | null;
    createdAt: TimestampString;
  } & AuctionInvoice_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetAuctionInvoicesByAuction`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetAuctionInvoicesByAuctionVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetAuctionInvoicesByAuction } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetAuctionInvoicesByAuctionComponent() {
  // The `useGetAuctionInvoicesByAuction` Query hook requires an argument of type `GetAuctionInvoicesByAuctionVariables`:
  const getAuctionInvoicesByAuctionVars: GetAuctionInvoicesByAuctionVariables = {
    auctionId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetAuctionInvoicesByAuction(getAuctionInvoicesByAuctionVars);
  // Variables can be defined inline as well.
  const query = useGetAuctionInvoicesByAuction({ auctionId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetAuctionInvoicesByAuction(dataConnect, getAuctionInvoicesByAuctionVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionInvoicesByAuction(getAuctionInvoicesByAuctionVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionInvoicesByAuction(dataConnect, getAuctionInvoicesByAuctionVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctionInvoices);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetAuctionInvoiceById
You can execute the `GetAuctionInvoiceById` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetAuctionInvoiceById(dc: DataConnect, vars: GetAuctionInvoiceByIdVariables, options?: useDataConnectQueryOptions<GetAuctionInvoiceByIdData>): UseDataConnectQueryResult<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetAuctionInvoiceById(vars: GetAuctionInvoiceByIdVariables, options?: useDataConnectQueryOptions<GetAuctionInvoiceByIdData>): UseDataConnectQueryResult<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;
```

### Variables
The `GetAuctionInvoiceById` Query requires an argument of type `GetAuctionInvoiceByIdVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetAuctionInvoiceByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetAuctionInvoiceById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetAuctionInvoiceById` Query is of type `GetAuctionInvoiceByIdData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetAuctionInvoiceByIdData {
  auctionInvoice?: {
    id: string;
    auctionId: string;
    lotId: string;
    buyerId: string;
    sellerId: string;
    hammerPrice: number;
    buyerPremium: number;
    documentationFee?: number | null;
    cardProcessingFee?: number | null;
    salesTaxRate?: number | null;
    salesTaxAmount?: number | null;
    salesTaxState?: string | null;
    totalDue: number;
    currency?: string | null;
    status: string;
    paymentMethod?: string | null;
    stripeInvoiceId?: string | null;
    stripePaymentIntentId?: string | null;
    buyerTaxExempt?: boolean | null;
    buyerTaxExemptState?: string | null;
    dueDate: TimestampString;
    paidAt?: TimestampString | null;
    sellerCommission?: number | null;
    sellerPayout?: number | null;
    sellerPaidAt?: TimestampString | null;
    removalConfirmedAt?: TimestampString | null;
    storageFeesAccrued?: number | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & AuctionInvoice_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetAuctionInvoiceById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetAuctionInvoiceByIdVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetAuctionInvoiceById } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetAuctionInvoiceByIdComponent() {
  // The `useGetAuctionInvoiceById` Query hook requires an argument of type `GetAuctionInvoiceByIdVariables`:
  const getAuctionInvoiceByIdVars: GetAuctionInvoiceByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetAuctionInvoiceById(getAuctionInvoiceByIdVars);
  // Variables can be defined inline as well.
  const query = useGetAuctionInvoiceById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetAuctionInvoiceById(dataConnect, getAuctionInvoiceByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionInvoiceById(getAuctionInvoiceByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetAuctionInvoiceById(dataConnect, getAuctionInvoiceByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.auctionInvoice);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetBidderProfileByUserId
You can execute the `GetBidderProfileByUserId` Query using the following Query hook function, which is defined in [auctions/react/index.d.ts](./index.d.ts):

```javascript
useGetBidderProfileByUserId(dc: DataConnect, vars: GetBidderProfileByUserIdVariables, options?: useDataConnectQueryOptions<GetBidderProfileByUserIdData>): UseDataConnectQueryResult<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBidderProfileByUserId(vars: GetBidderProfileByUserIdVariables, options?: useDataConnectQueryOptions<GetBidderProfileByUserIdData>): UseDataConnectQueryResult<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;
```

### Variables
The `GetBidderProfileByUserId` Query requires an argument of type `GetBidderProfileByUserIdVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBidderProfileByUserIdVariables {
  userId: string;
}
```
### Return Type
Recall that calling the `GetBidderProfileByUserId` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBidderProfileByUserId` Query is of type `GetBidderProfileByUserIdData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBidderProfileByUserIdData {
  bidderProfiles: ({
    id: string;
    userId: string;
    verificationTier: string;
    fullName?: string | null;
    phone?: string | null;
    phoneVerified?: boolean | null;
    addressCity?: string | null;
    addressState?: string | null;
    companyName?: string | null;
    stripeCustomerId?: string | null;
    idVerificationStatus?: string | null;
    bidderApprovedAt?: TimestampString | null;
    totalAuctionsParticipated?: number | null;
    totalItemsWon?: number | null;
    totalSpent?: number | null;
    nonPaymentCount?: number | null;
    taxExempt?: boolean | null;
    taxExemptState?: string | null;
    termsAcceptedAt?: TimestampString | null;
    termsVersion?: string | null;
    createdAt: TimestampString;
  } & BidderProfile_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBidderProfileByUserId`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBidderProfileByUserIdVariables } from '@dataconnect/generated-timberequip-auctions';
import { useGetBidderProfileByUserId } from '@dataconnect/generated-timberequip-auctions/react'

export default function GetBidderProfileByUserIdComponent() {
  // The `useGetBidderProfileByUserId` Query hook requires an argument of type `GetBidderProfileByUserIdVariables`:
  const getBidderProfileByUserIdVars: GetBidderProfileByUserIdVariables = {
    userId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBidderProfileByUserId(getBidderProfileByUserIdVars);
  // Variables can be defined inline as well.
  const query = useGetBidderProfileByUserId({ userId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBidderProfileByUserId(dataConnect, getBidderProfileByUserIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBidderProfileByUserId(getBidderProfileByUserIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBidderProfileByUserId(dataConnect, getBidderProfileByUserIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.bidderProfiles);
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

Below are examples of how to use the `auctions` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## UpsertAuction
You can execute the `UpsertAuction` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertAuction(options?: useDataConnectMutationOptions<UpsertAuctionData, FirebaseError, UpsertAuctionVariables>): UseDataConnectMutationResult<UpsertAuctionData, UpsertAuctionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertAuction(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertAuctionData, FirebaseError, UpsertAuctionVariables>): UseDataConnectMutationResult<UpsertAuctionData, UpsertAuctionVariables>;
```

### Variables
The `UpsertAuction` Mutation requires an argument of type `UpsertAuctionVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertAuctionVariables {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  startTime: TimestampString;
  endTime: TimestampString;
  previewStartTime?: TimestampString | null;
  status: string;
  lotCount?: number | null;
  totalBids?: number | null;
  totalGmv?: number | null;
  defaultBuyerPremiumPercent?: number | null;
  softCloseThresholdMin?: number | null;
  softCloseExtensionMin?: number | null;
  staggerIntervalMin?: number | null;
  defaultPaymentDeadlineDays?: number | null;
  defaultRemovalDeadlineDays?: number | null;
  termsAndConditionsUrl?: string | null;
  featured?: boolean | null;
  bannerEnabled?: boolean | null;
  bannerImageUrl?: string | null;
  createdBy: string;
}
```
### Return Type
Recall that calling the `UpsertAuction` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertAuction` Mutation is of type `UpsertAuctionData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertAuctionData {
  auction_upsert: Auction_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertAuction`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertAuctionVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpsertAuction } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpsertAuctionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertAuction();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertAuction(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertAuction(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertAuction(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertAuction` Mutation requires an argument of type `UpsertAuctionVariables`:
  const upsertAuctionVars: UpsertAuctionVariables = {
    id: ..., 
    title: ..., 
    slug: ..., 
    description: ..., // optional
    coverImageUrl: ..., // optional
    startTime: ..., 
    endTime: ..., 
    previewStartTime: ..., // optional
    status: ..., 
    lotCount: ..., // optional
    totalBids: ..., // optional
    totalGmv: ..., // optional
    defaultBuyerPremiumPercent: ..., // optional
    softCloseThresholdMin: ..., // optional
    softCloseExtensionMin: ..., // optional
    staggerIntervalMin: ..., // optional
    defaultPaymentDeadlineDays: ..., // optional
    defaultRemovalDeadlineDays: ..., // optional
    termsAndConditionsUrl: ..., // optional
    featured: ..., // optional
    bannerEnabled: ..., // optional
    bannerImageUrl: ..., // optional
    createdBy: ..., 
  };
  mutation.mutate(upsertAuctionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., title: ..., slug: ..., description: ..., coverImageUrl: ..., startTime: ..., endTime: ..., previewStartTime: ..., status: ..., lotCount: ..., totalBids: ..., totalGmv: ..., defaultBuyerPremiumPercent: ..., softCloseThresholdMin: ..., softCloseExtensionMin: ..., staggerIntervalMin: ..., defaultPaymentDeadlineDays: ..., defaultRemovalDeadlineDays: ..., termsAndConditionsUrl: ..., featured: ..., bannerEnabled: ..., bannerImageUrl: ..., createdBy: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertAuctionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auction_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertAuctionLot
You can execute the `UpsertAuctionLot` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertAuctionLot(options?: useDataConnectMutationOptions<UpsertAuctionLotData, FirebaseError, UpsertAuctionLotVariables>): UseDataConnectMutationResult<UpsertAuctionLotData, UpsertAuctionLotVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertAuctionLot(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertAuctionLotData, FirebaseError, UpsertAuctionLotVariables>): UseDataConnectMutationResult<UpsertAuctionLotData, UpsertAuctionLotVariables>;
```

### Variables
The `UpsertAuctionLot` Mutation requires an argument of type `UpsertAuctionLotVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertAuctionLotVariables {
  id: string;
  auctionId: string;
  listingId?: string | null;
  lotNumber: string;
  closeOrder: number;
  startingBid?: number | null;
  reservePrice?: number | null;
  reserveMet?: boolean | null;
  buyerPremiumPercent?: number | null;
  startTime?: TimestampString | null;
  endTime?: TimestampString | null;
  originalEndTime?: TimestampString | null;
  extensionCount?: number | null;
  currentBid?: number | null;
  currentBidderId?: string | null;
  currentBidderAnonymousId?: string | null;
  bidCount?: number | null;
  uniqueBidders?: number | null;
  lastBidTime?: TimestampString | null;
  status: string;
  promoted?: boolean | null;
  promotedOrder?: number | null;
  winningBidderId?: string | null;
  winningBid?: number | null;
  watcherCount?: number | null;
  title?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  year?: number | null;
  thumbnailUrl?: string | null;
  pickupLocation?: string | null;
  paymentDeadlineDays?: number | null;
  removalDeadlineDays?: number | null;
  storageFeePerDay?: number | null;
  isTitledItem?: boolean | null;
  titleDocumentFee?: number | null;
}
```
### Return Type
Recall that calling the `UpsertAuctionLot` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertAuctionLot` Mutation is of type `UpsertAuctionLotData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertAuctionLotData {
  auctionLot_upsert: AuctionLot_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertAuctionLot`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertAuctionLotVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpsertAuctionLot } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpsertAuctionLotComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertAuctionLot();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertAuctionLot(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertAuctionLot(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertAuctionLot(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertAuctionLot` Mutation requires an argument of type `UpsertAuctionLotVariables`:
  const upsertAuctionLotVars: UpsertAuctionLotVariables = {
    id: ..., 
    auctionId: ..., 
    listingId: ..., // optional
    lotNumber: ..., 
    closeOrder: ..., 
    startingBid: ..., // optional
    reservePrice: ..., // optional
    reserveMet: ..., // optional
    buyerPremiumPercent: ..., // optional
    startTime: ..., // optional
    endTime: ..., // optional
    originalEndTime: ..., // optional
    extensionCount: ..., // optional
    currentBid: ..., // optional
    currentBidderId: ..., // optional
    currentBidderAnonymousId: ..., // optional
    bidCount: ..., // optional
    uniqueBidders: ..., // optional
    lastBidTime: ..., // optional
    status: ..., 
    promoted: ..., // optional
    promotedOrder: ..., // optional
    winningBidderId: ..., // optional
    winningBid: ..., // optional
    watcherCount: ..., // optional
    title: ..., // optional
    manufacturer: ..., // optional
    model: ..., // optional
    year: ..., // optional
    thumbnailUrl: ..., // optional
    pickupLocation: ..., // optional
    paymentDeadlineDays: ..., // optional
    removalDeadlineDays: ..., // optional
    storageFeePerDay: ..., // optional
    isTitledItem: ..., // optional
    titleDocumentFee: ..., // optional
  };
  mutation.mutate(upsertAuctionLotVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., auctionId: ..., listingId: ..., lotNumber: ..., closeOrder: ..., startingBid: ..., reservePrice: ..., reserveMet: ..., buyerPremiumPercent: ..., startTime: ..., endTime: ..., originalEndTime: ..., extensionCount: ..., currentBid: ..., currentBidderId: ..., currentBidderAnonymousId: ..., bidCount: ..., uniqueBidders: ..., lastBidTime: ..., status: ..., promoted: ..., promotedOrder: ..., winningBidderId: ..., winningBid: ..., watcherCount: ..., title: ..., manufacturer: ..., model: ..., year: ..., thumbnailUrl: ..., pickupLocation: ..., paymentDeadlineDays: ..., removalDeadlineDays: ..., storageFeePerDay: ..., isTitledItem: ..., titleDocumentFee: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertAuctionLotVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auctionLot_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## InsertAuctionBid
You can execute the `InsertAuctionBid` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useInsertAuctionBid(options?: useDataConnectMutationOptions<InsertAuctionBidData, FirebaseError, InsertAuctionBidVariables>): UseDataConnectMutationResult<InsertAuctionBidData, InsertAuctionBidVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useInsertAuctionBid(dc: DataConnect, options?: useDataConnectMutationOptions<InsertAuctionBidData, FirebaseError, InsertAuctionBidVariables>): UseDataConnectMutationResult<InsertAuctionBidData, InsertAuctionBidVariables>;
```

### Variables
The `InsertAuctionBid` Mutation requires an argument of type `InsertAuctionBidVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface InsertAuctionBidVariables {
  id: string;
  auctionId: string;
  lotId: string;
  bidderId: string;
  bidderAnonymousId: string;
  amount: number;
  maxBid?: number | null;
  type: string;
  status: string;
  triggeredExtension?: boolean | null;
  bidTime: TimestampString;
}
```
### Return Type
Recall that calling the `InsertAuctionBid` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `InsertAuctionBid` Mutation is of type `InsertAuctionBidData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface InsertAuctionBidData {
  auctionBid_insert: AuctionBid_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `InsertAuctionBid`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, InsertAuctionBidVariables } from '@dataconnect/generated-timberequip-auctions';
import { useInsertAuctionBid } from '@dataconnect/generated-timberequip-auctions/react'

export default function InsertAuctionBidComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useInsertAuctionBid();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useInsertAuctionBid(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertAuctionBid(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertAuctionBid(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useInsertAuctionBid` Mutation requires an argument of type `InsertAuctionBidVariables`:
  const insertAuctionBidVars: InsertAuctionBidVariables = {
    id: ..., 
    auctionId: ..., 
    lotId: ..., 
    bidderId: ..., 
    bidderAnonymousId: ..., 
    amount: ..., 
    maxBid: ..., // optional
    type: ..., 
    status: ..., 
    triggeredExtension: ..., // optional
    bidTime: ..., 
  };
  mutation.mutate(insertAuctionBidVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., auctionId: ..., lotId: ..., bidderId: ..., bidderAnonymousId: ..., amount: ..., maxBid: ..., type: ..., status: ..., triggeredExtension: ..., bidTime: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(insertAuctionBidVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auctionBid_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateBidStatus
You can execute the `UpdateBidStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateBidStatus(options?: useDataConnectMutationOptions<UpdateBidStatusData, FirebaseError, UpdateBidStatusVariables>): UseDataConnectMutationResult<UpdateBidStatusData, UpdateBidStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateBidStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateBidStatusData, FirebaseError, UpdateBidStatusVariables>): UseDataConnectMutationResult<UpdateBidStatusData, UpdateBidStatusVariables>;
```

### Variables
The `UpdateBidStatus` Mutation requires an argument of type `UpdateBidStatusVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateBidStatusVariables {
  id: string;
  status: string;
}
```
### Return Type
Recall that calling the `UpdateBidStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateBidStatus` Mutation is of type `UpdateBidStatusData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateBidStatusData {
  auctionBid_update?: AuctionBid_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateBidStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateBidStatusVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpdateBidStatus } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpdateBidStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateBidStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateBidStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateBidStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateBidStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateBidStatus` Mutation requires an argument of type `UpdateBidStatusVariables`:
  const updateBidStatusVars: UpdateBidStatusVariables = {
    id: ..., 
    status: ..., 
  };
  mutation.mutate(updateBidStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateBidStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auctionBid_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertAuctionInvoice
You can execute the `UpsertAuctionInvoice` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertAuctionInvoice(options?: useDataConnectMutationOptions<UpsertAuctionInvoiceData, FirebaseError, UpsertAuctionInvoiceVariables>): UseDataConnectMutationResult<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertAuctionInvoice(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertAuctionInvoiceData, FirebaseError, UpsertAuctionInvoiceVariables>): UseDataConnectMutationResult<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;
```

### Variables
The `UpsertAuctionInvoice` Mutation requires an argument of type `UpsertAuctionInvoiceVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertAuctionInvoiceVariables {
  id: string;
  auctionId: string;
  lotId: string;
  buyerId: string;
  sellerId: string;
  hammerPrice: number;
  buyerPremium: number;
  documentationFee?: number | null;
  cardProcessingFee?: number | null;
  salesTaxRate?: number | null;
  salesTaxAmount?: number | null;
  salesTaxState?: string | null;
  totalDue: number;
  currency?: string | null;
  status: string;
  paymentMethod?: string | null;
  stripeInvoiceId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  buyerTaxExempt?: boolean | null;
  buyerTaxExemptState?: string | null;
  buyerTaxExemptCertificateUrl?: string | null;
  dueDate: TimestampString;
  paidAt?: TimestampString | null;
  sellerCommission?: number | null;
  sellerPayout?: number | null;
  sellerPaidAt?: TimestampString | null;
}
```
### Return Type
Recall that calling the `UpsertAuctionInvoice` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertAuctionInvoice` Mutation is of type `UpsertAuctionInvoiceData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertAuctionInvoiceData {
  auctionInvoice_upsert: AuctionInvoice_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertAuctionInvoice`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertAuctionInvoiceVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpsertAuctionInvoice } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpsertAuctionInvoiceComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertAuctionInvoice();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertAuctionInvoice(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertAuctionInvoice(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertAuctionInvoice(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertAuctionInvoice` Mutation requires an argument of type `UpsertAuctionInvoiceVariables`:
  const upsertAuctionInvoiceVars: UpsertAuctionInvoiceVariables = {
    id: ..., 
    auctionId: ..., 
    lotId: ..., 
    buyerId: ..., 
    sellerId: ..., 
    hammerPrice: ..., 
    buyerPremium: ..., 
    documentationFee: ..., // optional
    cardProcessingFee: ..., // optional
    salesTaxRate: ..., // optional
    salesTaxAmount: ..., // optional
    salesTaxState: ..., // optional
    totalDue: ..., 
    currency: ..., // optional
    status: ..., 
    paymentMethod: ..., // optional
    stripeInvoiceId: ..., // optional
    stripeCheckoutSessionId: ..., // optional
    stripePaymentIntentId: ..., // optional
    buyerTaxExempt: ..., // optional
    buyerTaxExemptState: ..., // optional
    buyerTaxExemptCertificateUrl: ..., // optional
    dueDate: ..., 
    paidAt: ..., // optional
    sellerCommission: ..., // optional
    sellerPayout: ..., // optional
    sellerPaidAt: ..., // optional
  };
  mutation.mutate(upsertAuctionInvoiceVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., auctionId: ..., lotId: ..., buyerId: ..., sellerId: ..., hammerPrice: ..., buyerPremium: ..., documentationFee: ..., cardProcessingFee: ..., salesTaxRate: ..., salesTaxAmount: ..., salesTaxState: ..., totalDue: ..., currency: ..., status: ..., paymentMethod: ..., stripeInvoiceId: ..., stripeCheckoutSessionId: ..., stripePaymentIntentId: ..., buyerTaxExempt: ..., buyerTaxExemptState: ..., buyerTaxExemptCertificateUrl: ..., dueDate: ..., paidAt: ..., sellerCommission: ..., sellerPayout: ..., sellerPaidAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertAuctionInvoiceVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auctionInvoice_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateAuctionInvoiceStatus
You can execute the `UpdateAuctionInvoiceStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateAuctionInvoiceStatus(options?: useDataConnectMutationOptions<UpdateAuctionInvoiceStatusData, FirebaseError, UpdateAuctionInvoiceStatusVariables>): UseDataConnectMutationResult<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateAuctionInvoiceStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionInvoiceStatusData, FirebaseError, UpdateAuctionInvoiceStatusVariables>): UseDataConnectMutationResult<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;
```

### Variables
The `UpdateAuctionInvoiceStatus` Mutation requires an argument of type `UpdateAuctionInvoiceStatusVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateAuctionInvoiceStatusVariables {
  id: string;
  status: string;
  paidAt?: TimestampString | null;
  paymentMethod?: string | null;
}
```
### Return Type
Recall that calling the `UpdateAuctionInvoiceStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateAuctionInvoiceStatus` Mutation is of type `UpdateAuctionInvoiceStatusData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateAuctionInvoiceStatusData {
  auctionInvoice_update?: AuctionInvoice_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateAuctionInvoiceStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateAuctionInvoiceStatusVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpdateAuctionInvoiceStatus } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpdateAuctionInvoiceStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateAuctionInvoiceStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateAuctionInvoiceStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionInvoiceStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionInvoiceStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateAuctionInvoiceStatus` Mutation requires an argument of type `UpdateAuctionInvoiceStatusVariables`:
  const updateAuctionInvoiceStatusVars: UpdateAuctionInvoiceStatusVariables = {
    id: ..., 
    status: ..., 
    paidAt: ..., // optional
    paymentMethod: ..., // optional
  };
  mutation.mutate(updateAuctionInvoiceStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., paidAt: ..., paymentMethod: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateAuctionInvoiceStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auctionInvoice_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateAuctionLotBidState
You can execute the `UpdateAuctionLotBidState` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateAuctionLotBidState(options?: useDataConnectMutationOptions<UpdateAuctionLotBidStateData, FirebaseError, UpdateAuctionLotBidStateVariables>): UseDataConnectMutationResult<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateAuctionLotBidState(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionLotBidStateData, FirebaseError, UpdateAuctionLotBidStateVariables>): UseDataConnectMutationResult<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;
```

### Variables
The `UpdateAuctionLotBidState` Mutation requires an argument of type `UpdateAuctionLotBidStateVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateAuctionLotBidStateVariables {
  id: string;
  currentBid: number;
  currentBidderId?: string | null;
  currentBidderAnonymousId?: string | null;
  bidCount: number;
  uniqueBidders?: number | null;
  lastBidTime?: TimestampString | null;
  reserveMet?: boolean | null;
}
```
### Return Type
Recall that calling the `UpdateAuctionLotBidState` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateAuctionLotBidState` Mutation is of type `UpdateAuctionLotBidStateData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateAuctionLotBidStateData {
  auctionLot_update?: AuctionLot_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateAuctionLotBidState`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateAuctionLotBidStateVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpdateAuctionLotBidState } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpdateAuctionLotBidStateComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateAuctionLotBidState();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateAuctionLotBidState(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionLotBidState(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionLotBidState(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateAuctionLotBidState` Mutation requires an argument of type `UpdateAuctionLotBidStateVariables`:
  const updateAuctionLotBidStateVars: UpdateAuctionLotBidStateVariables = {
    id: ..., 
    currentBid: ..., 
    currentBidderId: ..., // optional
    currentBidderAnonymousId: ..., // optional
    bidCount: ..., 
    uniqueBidders: ..., // optional
    lastBidTime: ..., // optional
    reserveMet: ..., // optional
  };
  mutation.mutate(updateAuctionLotBidStateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., currentBid: ..., currentBidderId: ..., currentBidderAnonymousId: ..., bidCount: ..., uniqueBidders: ..., lastBidTime: ..., reserveMet: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateAuctionLotBidStateVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auctionLot_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateAuctionLotStatus
You can execute the `UpdateAuctionLotStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateAuctionLotStatus(options?: useDataConnectMutationOptions<UpdateAuctionLotStatusData, FirebaseError, UpdateAuctionLotStatusVariables>): UseDataConnectMutationResult<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateAuctionLotStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionLotStatusData, FirebaseError, UpdateAuctionLotStatusVariables>): UseDataConnectMutationResult<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;
```

### Variables
The `UpdateAuctionLotStatus` Mutation requires an argument of type `UpdateAuctionLotStatusVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateAuctionLotStatusVariables {
  id: string;
  status: string;
  winningBidderId?: string | null;
  winningBid?: number | null;
}
```
### Return Type
Recall that calling the `UpdateAuctionLotStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateAuctionLotStatus` Mutation is of type `UpdateAuctionLotStatusData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateAuctionLotStatusData {
  auctionLot_update?: AuctionLot_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateAuctionLotStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateAuctionLotStatusVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpdateAuctionLotStatus } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpdateAuctionLotStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateAuctionLotStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateAuctionLotStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionLotStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionLotStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateAuctionLotStatus` Mutation requires an argument of type `UpdateAuctionLotStatusVariables`:
  const updateAuctionLotStatusVars: UpdateAuctionLotStatusVariables = {
    id: ..., 
    status: ..., 
    winningBidderId: ..., // optional
    winningBid: ..., // optional
  };
  mutation.mutate(updateAuctionLotStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., winningBidderId: ..., winningBid: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateAuctionLotStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auctionLot_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertBidderProfile
You can execute the `UpsertBidderProfile` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertBidderProfile(options?: useDataConnectMutationOptions<UpsertBidderProfileData, FirebaseError, UpsertBidderProfileVariables>): UseDataConnectMutationResult<UpsertBidderProfileData, UpsertBidderProfileVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertBidderProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertBidderProfileData, FirebaseError, UpsertBidderProfileVariables>): UseDataConnectMutationResult<UpsertBidderProfileData, UpsertBidderProfileVariables>;
```

### Variables
The `UpsertBidderProfile` Mutation requires an argument of type `UpsertBidderProfileVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertBidderProfileVariables {
  id: string;
  userId: string;
  verificationTier: string;
  fullName?: string | null;
  phone?: string | null;
  phoneVerified?: boolean | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  addressCountry?: string | null;
  companyName?: string | null;
  stripeCustomerId?: string | null;
  idVerificationStatus?: string | null;
  idVerifiedAt?: TimestampString | null;
  bidderApprovedAt?: TimestampString | null;
  bidderApprovedBy?: string | null;
  totalAuctionsParticipated?: number | null;
  totalItemsWon?: number | null;
  totalSpent?: number | null;
  nonPaymentCount?: number | null;
  taxExempt?: boolean | null;
  taxExemptState?: string | null;
  taxExemptCertificateUrl?: string | null;
  defaultPaymentMethodId?: string | null;
  defaultPaymentMethodBrand?: string | null;
  defaultPaymentMethodLast4?: string | null;
  termsAcceptedAt?: TimestampString | null;
  termsVersion?: string | null;
}
```
### Return Type
Recall that calling the `UpsertBidderProfile` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertBidderProfile` Mutation is of type `UpsertBidderProfileData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertBidderProfileData {
  bidderProfile_upsert: BidderProfile_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertBidderProfile`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertBidderProfileVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpsertBidderProfile } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpsertBidderProfileComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertBidderProfile();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertBidderProfile(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertBidderProfile(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertBidderProfile(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertBidderProfile` Mutation requires an argument of type `UpsertBidderProfileVariables`:
  const upsertBidderProfileVars: UpsertBidderProfileVariables = {
    id: ..., 
    userId: ..., 
    verificationTier: ..., 
    fullName: ..., // optional
    phone: ..., // optional
    phoneVerified: ..., // optional
    addressStreet: ..., // optional
    addressCity: ..., // optional
    addressState: ..., // optional
    addressZip: ..., // optional
    addressCountry: ..., // optional
    companyName: ..., // optional
    stripeCustomerId: ..., // optional
    idVerificationStatus: ..., // optional
    idVerifiedAt: ..., // optional
    bidderApprovedAt: ..., // optional
    bidderApprovedBy: ..., // optional
    totalAuctionsParticipated: ..., // optional
    totalItemsWon: ..., // optional
    totalSpent: ..., // optional
    nonPaymentCount: ..., // optional
    taxExempt: ..., // optional
    taxExemptState: ..., // optional
    taxExemptCertificateUrl: ..., // optional
    defaultPaymentMethodId: ..., // optional
    defaultPaymentMethodBrand: ..., // optional
    defaultPaymentMethodLast4: ..., // optional
    termsAcceptedAt: ..., // optional
    termsVersion: ..., // optional
  };
  mutation.mutate(upsertBidderProfileVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., userId: ..., verificationTier: ..., fullName: ..., phone: ..., phoneVerified: ..., addressStreet: ..., addressCity: ..., addressState: ..., addressZip: ..., addressCountry: ..., companyName: ..., stripeCustomerId: ..., idVerificationStatus: ..., idVerifiedAt: ..., bidderApprovedAt: ..., bidderApprovedBy: ..., totalAuctionsParticipated: ..., totalItemsWon: ..., totalSpent: ..., nonPaymentCount: ..., taxExempt: ..., taxExemptState: ..., taxExemptCertificateUrl: ..., defaultPaymentMethodId: ..., defaultPaymentMethodBrand: ..., defaultPaymentMethodLast4: ..., termsAcceptedAt: ..., termsVersion: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertBidderProfileVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.bidderProfile_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateAuctionStatus
You can execute the `UpdateAuctionStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateAuctionStatus(options?: useDataConnectMutationOptions<UpdateAuctionStatusData, FirebaseError, UpdateAuctionStatusVariables>): UseDataConnectMutationResult<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateAuctionStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionStatusData, FirebaseError, UpdateAuctionStatusVariables>): UseDataConnectMutationResult<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;
```

### Variables
The `UpdateAuctionStatus` Mutation requires an argument of type `UpdateAuctionStatusVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateAuctionStatusVariables {
  id: string;
  status: string;
}
```
### Return Type
Recall that calling the `UpdateAuctionStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateAuctionStatus` Mutation is of type `UpdateAuctionStatusData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateAuctionStatusData {
  auction_update?: Auction_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateAuctionStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateAuctionStatusVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpdateAuctionStatus } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpdateAuctionStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateAuctionStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateAuctionStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateAuctionStatus` Mutation requires an argument of type `UpdateAuctionStatusVariables`:
  const updateAuctionStatusVars: UpdateAuctionStatusVariables = {
    id: ..., 
    status: ..., 
  };
  mutation.mutate(updateAuctionStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateAuctionStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auction_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateAuctionStats
You can execute the `UpdateAuctionStats` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [auctions/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateAuctionStats(options?: useDataConnectMutationOptions<UpdateAuctionStatsData, FirebaseError, UpdateAuctionStatsVariables>): UseDataConnectMutationResult<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateAuctionStats(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateAuctionStatsData, FirebaseError, UpdateAuctionStatsVariables>): UseDataConnectMutationResult<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;
```

### Variables
The `UpdateAuctionStats` Mutation requires an argument of type `UpdateAuctionStatsVariables`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateAuctionStatsVariables {
  id: string;
  lotCount?: number | null;
  totalBids?: number | null;
  totalGmv?: number | null;
}
```
### Return Type
Recall that calling the `UpdateAuctionStats` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateAuctionStats` Mutation is of type `UpdateAuctionStatsData`, which is defined in [auctions/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateAuctionStatsData {
  auction_update?: Auction_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateAuctionStats`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateAuctionStatsVariables } from '@dataconnect/generated-timberequip-auctions';
import { useUpdateAuctionStats } from '@dataconnect/generated-timberequip-auctions/react'

export default function UpdateAuctionStatsComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateAuctionStats();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateAuctionStats(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionStats(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateAuctionStats(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateAuctionStats` Mutation requires an argument of type `UpdateAuctionStatsVariables`:
  const updateAuctionStatsVars: UpdateAuctionStatsVariables = {
    id: ..., 
    lotCount: ..., // optional
    totalBids: ..., // optional
    totalGmv: ..., // optional
  };
  mutation.mutate(updateAuctionStatsVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., lotCount: ..., totalBids: ..., totalGmv: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateAuctionStatsVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.auction_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

