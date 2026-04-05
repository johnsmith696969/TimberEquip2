# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `listing-governance`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`generated/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-listing-governance/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*FindListingByFirestoreId*](#findlistingbyfirestoreid)
  - [*GetListingGovernance*](#getlistinggovernance)
  - [*ListLifecycleQueue*](#listlifecyclequeue)
  - [*ListListingTransitions*](#listlistingtransitions)
  - [*ListOpenListingAnomalies*](#listopenlistinganomalies)
- [**Mutations**](#mutations)
  - [*InsertListingShadow*](#insertlistingshadow)
  - [*UpdateListingShadow*](#updatelistingshadow)
  - [*DeleteListingShadow*](#deletelistingshadow)
  - [*RecordListingStateTransition*](#recordlistingstatetransition)
  - [*SubmitListing*](#submitlisting)
  - [*ApproveListing*](#approvelisting)
  - [*RejectListing*](#rejectlisting)
  - [*ConfirmListingPayment*](#confirmlistingpayment)
  - [*PublishListing*](#publishlisting)
  - [*ExpireListing*](#expirelisting)
  - [*RelistListing*](#relistlisting)
  - [*MarkListingSold*](#marklistingsold)
  - [*ArchiveListing*](#archivelisting)
  - [*ResolveListingAnomaly*](#resolvelistinganomaly)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `listing-governance`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

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
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `listing-governance`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-listing-governance';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-listing-governance';

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

Below are examples of how to use the `listing-governance` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## FindListingByFirestoreId
You can execute the `FindListingByFirestoreId` Query using the following Query hook function, which is defined in [generated/react/index.d.ts](./index.d.ts):

```javascript
useFindListingByFirestoreId(dc: DataConnect, vars: FindListingByFirestoreIdVariables, options?: useDataConnectQueryOptions<FindListingByFirestoreIdData>): UseDataConnectQueryResult<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useFindListingByFirestoreId(vars: FindListingByFirestoreIdVariables, options?: useDataConnectQueryOptions<FindListingByFirestoreIdData>): UseDataConnectQueryResult<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;
```

### Variables
The `FindListingByFirestoreId` Query requires an argument of type `FindListingByFirestoreIdVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface FindListingByFirestoreIdVariables {
  legacyFirestoreId: string;
}
```
### Return Type
Recall that calling the `FindListingByFirestoreId` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `FindListingByFirestoreId` Query is of type `FindListingByFirestoreIdData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface FindListingByFirestoreIdData {
  listings: ({
    id: UUIDString;
    lifecycleState: string;
    reviewState: string;
    paymentState: string;
    inventoryState: string;
    visibilityState: string;
    updatedAt: TimestampString;
  } & Listing_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `FindListingByFirestoreId`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, FindListingByFirestoreIdVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useFindListingByFirestoreId } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function FindListingByFirestoreIdComponent() {
  // The `useFindListingByFirestoreId` Query hook requires an argument of type `FindListingByFirestoreIdVariables`:
  const findListingByFirestoreIdVars: FindListingByFirestoreIdVariables = {
    legacyFirestoreId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useFindListingByFirestoreId(findListingByFirestoreIdVars);
  // Variables can be defined inline as well.
  const query = useFindListingByFirestoreId({ legacyFirestoreId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useFindListingByFirestoreId(dataConnect, findListingByFirestoreIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useFindListingByFirestoreId(findListingByFirestoreIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useFindListingByFirestoreId(dataConnect, findListingByFirestoreIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.listings);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetListingGovernance
You can execute the `GetListingGovernance` Query using the following Query hook function, which is defined in [generated/react/index.d.ts](./index.d.ts):

```javascript
useGetListingGovernance(dc: DataConnect, vars: GetListingGovernanceVariables, options?: useDataConnectQueryOptions<GetListingGovernanceData>): UseDataConnectQueryResult<GetListingGovernanceData, GetListingGovernanceVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetListingGovernance(vars: GetListingGovernanceVariables, options?: useDataConnectQueryOptions<GetListingGovernanceData>): UseDataConnectQueryResult<GetListingGovernanceData, GetListingGovernanceVariables>;
```

### Variables
The `GetListingGovernance` Query requires an argument of type `GetListingGovernanceVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetListingGovernanceVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `GetListingGovernance` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetListingGovernance` Query is of type `GetListingGovernanceData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetListingGovernanceData {
  listing?: {
    id: UUIDString;
    legacyFirestoreId?: string | null;
    sellerPartyId: string;
    title: string;
    lifecycleState: string;
    reviewState: string;
    paymentState: string;
    inventoryState: string;
    visibilityState: string;
    publishedAt?: TimestampString | null;
    expiresAt?: TimestampString | null;
    soldAt?: TimestampString | null;
    updatedAt: TimestampString;
  } & Listing_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetListingGovernance`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetListingGovernanceVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useGetListingGovernance } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function GetListingGovernanceComponent() {
  // The `useGetListingGovernance` Query hook requires an argument of type `GetListingGovernanceVariables`:
  const getListingGovernanceVars: GetListingGovernanceVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetListingGovernance(getListingGovernanceVars);
  // Variables can be defined inline as well.
  const query = useGetListingGovernance({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetListingGovernance(dataConnect, getListingGovernanceVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetListingGovernance(getListingGovernanceVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetListingGovernance(dataConnect, getListingGovernanceVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.listing);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListLifecycleQueue
You can execute the `ListLifecycleQueue` Query using the following Query hook function, which is defined in [generated/react/index.d.ts](./index.d.ts):

```javascript
useListLifecycleQueue(dc: DataConnect, vars: ListLifecycleQueueVariables, options?: useDataConnectQueryOptions<ListLifecycleQueueData>): UseDataConnectQueryResult<ListLifecycleQueueData, ListLifecycleQueueVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListLifecycleQueue(vars: ListLifecycleQueueVariables, options?: useDataConnectQueryOptions<ListLifecycleQueueData>): UseDataConnectQueryResult<ListLifecycleQueueData, ListLifecycleQueueVariables>;
```

### Variables
The `ListLifecycleQueue` Query requires an argument of type `ListLifecycleQueueVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListLifecycleQueueVariables {
  lifecycleStates: string[];
  limit?: number;
}
```
### Return Type
Recall that calling the `ListLifecycleQueue` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListLifecycleQueue` Query is of type `ListLifecycleQueueData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListLifecycleQueueData {
  listings: ({
    id: UUIDString;
    title: string;
    sellerPartyId: string;
    lifecycleState: string;
    reviewState: string;
    paymentState: string;
    inventoryState: string;
    visibilityState: string;
    updatedAt: TimestampString;
  } & Listing_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListLifecycleQueue`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListLifecycleQueueVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useListLifecycleQueue } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function ListLifecycleQueueComponent() {
  // The `useListLifecycleQueue` Query hook requires an argument of type `ListLifecycleQueueVariables`:
  const listLifecycleQueueVars: ListLifecycleQueueVariables = {
    lifecycleStates: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListLifecycleQueue(listLifecycleQueueVars);
  // Variables can be defined inline as well.
  const query = useListLifecycleQueue({ lifecycleStates: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListLifecycleQueue(dataConnect, listLifecycleQueueVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListLifecycleQueue(listLifecycleQueueVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListLifecycleQueue(dataConnect, listLifecycleQueueVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.listings);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListListingTransitions
You can execute the `ListListingTransitions` Query using the following Query hook function, which is defined in [generated/react/index.d.ts](./index.d.ts):

```javascript
useListListingTransitions(dc: DataConnect, vars: ListListingTransitionsVariables, options?: useDataConnectQueryOptions<ListListingTransitionsData>): UseDataConnectQueryResult<ListListingTransitionsData, ListListingTransitionsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListListingTransitions(vars: ListListingTransitionsVariables, options?: useDataConnectQueryOptions<ListListingTransitionsData>): UseDataConnectQueryResult<ListListingTransitionsData, ListListingTransitionsVariables>;
```

### Variables
The `ListListingTransitions` Query requires an argument of type `ListListingTransitionsVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListListingTransitionsVariables {
  listingId: UUIDString;
  limit?: number;
}
```
### Return Type
Recall that calling the `ListListingTransitions` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListListingTransitions` Query is of type `ListListingTransitionsData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListListingTransitionsData {
  listingStateTransitions: ({
    id: UUIDString;
    transitionAction: string;
    previousState?: string | null;
    nextState: string;
    previousReviewState?: string | null;
    nextReviewState?: string | null;
    previousPaymentState?: string | null;
    nextPaymentState?: string | null;
    previousInventoryState?: string | null;
    nextInventoryState?: string | null;
    previousVisibilityState?: string | null;
    nextVisibilityState?: string | null;
    actorType: string;
    actorId?: string | null;
    reasonCode?: string | null;
    reasonNote?: string | null;
    occurredAt: TimestampString;
  } & ListingStateTransition_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListListingTransitions`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListListingTransitionsVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useListListingTransitions } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function ListListingTransitionsComponent() {
  // The `useListListingTransitions` Query hook requires an argument of type `ListListingTransitionsVariables`:
  const listListingTransitionsVars: ListListingTransitionsVariables = {
    listingId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListListingTransitions(listListingTransitionsVars);
  // Variables can be defined inline as well.
  const query = useListListingTransitions({ listingId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListListingTransitions(dataConnect, listListingTransitionsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListListingTransitions(listListingTransitionsVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListListingTransitions(dataConnect, listListingTransitionsVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.listingStateTransitions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListOpenListingAnomalies
You can execute the `ListOpenListingAnomalies` Query using the following Query hook function, which is defined in [generated/react/index.d.ts](./index.d.ts):

```javascript
useListOpenListingAnomalies(dc: DataConnect, vars: ListOpenListingAnomaliesVariables, options?: useDataConnectQueryOptions<ListOpenListingAnomaliesData>): UseDataConnectQueryResult<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListOpenListingAnomalies(vars: ListOpenListingAnomaliesVariables, options?: useDataConnectQueryOptions<ListOpenListingAnomaliesData>): UseDataConnectQueryResult<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;
```

### Variables
The `ListOpenListingAnomalies` Query requires an argument of type `ListOpenListingAnomaliesVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListOpenListingAnomaliesVariables {
  listingId: UUIDString;
  limit?: number;
}
```
### Return Type
Recall that calling the `ListOpenListingAnomalies` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListOpenListingAnomalies` Query is of type `ListOpenListingAnomaliesData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListOpenListingAnomaliesData {
  listingAnomalies: ({
    id: UUIDString;
    anomalyCode: string;
    severity: string;
    status: string;
    detectedBy: string;
    detectedAt: TimestampString;
    resolvedAt?: TimestampString | null;
    resolutionNote?: string | null;
  } & ListingAnomaly_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListOpenListingAnomalies`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListOpenListingAnomaliesVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useListOpenListingAnomalies } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function ListOpenListingAnomaliesComponent() {
  // The `useListOpenListingAnomalies` Query hook requires an argument of type `ListOpenListingAnomaliesVariables`:
  const listOpenListingAnomaliesVars: ListOpenListingAnomaliesVariables = {
    listingId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListOpenListingAnomalies(listOpenListingAnomaliesVars);
  // Variables can be defined inline as well.
  const query = useListOpenListingAnomalies({ listingId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListOpenListingAnomalies(dataConnect, listOpenListingAnomaliesVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListOpenListingAnomalies(listOpenListingAnomaliesVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListOpenListingAnomalies(dataConnect, listOpenListingAnomaliesVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.listingAnomalies);
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

Below are examples of how to use the `listing-governance` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## InsertListingShadow
You can execute the `InsertListingShadow` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useInsertListingShadow(options?: useDataConnectMutationOptions<InsertListingShadowData, FirebaseError, InsertListingShadowVariables>): UseDataConnectMutationResult<InsertListingShadowData, InsertListingShadowVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useInsertListingShadow(dc: DataConnect, options?: useDataConnectMutationOptions<InsertListingShadowData, FirebaseError, InsertListingShadowVariables>): UseDataConnectMutationResult<InsertListingShadowData, InsertListingShadowVariables>;
```

### Variables
The `InsertListingShadow` Mutation requires an argument of type `InsertListingShadowVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface InsertListingShadowVariables {
  legacyFirestoreId: string;
  sellerPartyId: string;
  title: string;
  categoryKey: string;
  subcategoryKey?: string | null;
  manufacturerKey?: string | null;
  modelKey?: string | null;
  locationText?: string | null;
  priceAmount?: number | null;
  currencyCode: string;
  lifecycleState: string;
  reviewState: string;
  paymentState: string;
  inventoryState: string;
  visibilityState: string;
  primaryImageUrl?: string | null;
  publishedAt?: TimestampString | null;
  expiresAt?: TimestampString | null;
  soldAt?: TimestampString | null;
  sourceSystem: string;
  externalSourceName?: string | null;
  externalSourceId?: string | null;
}
```
### Return Type
Recall that calling the `InsertListingShadow` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `InsertListingShadow` Mutation is of type `InsertListingShadowData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface InsertListingShadowData {
  listing_insert: Listing_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `InsertListingShadow`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, InsertListingShadowVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useInsertListingShadow } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function InsertListingShadowComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useInsertListingShadow();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useInsertListingShadow(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertListingShadow(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertListingShadow(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useInsertListingShadow` Mutation requires an argument of type `InsertListingShadowVariables`:
  const insertListingShadowVars: InsertListingShadowVariables = {
    legacyFirestoreId: ..., 
    sellerPartyId: ..., 
    title: ..., 
    categoryKey: ..., 
    subcategoryKey: ..., // optional
    manufacturerKey: ..., // optional
    modelKey: ..., // optional
    locationText: ..., // optional
    priceAmount: ..., // optional
    currencyCode: ..., 
    lifecycleState: ..., 
    reviewState: ..., 
    paymentState: ..., 
    inventoryState: ..., 
    visibilityState: ..., 
    primaryImageUrl: ..., // optional
    publishedAt: ..., // optional
    expiresAt: ..., // optional
    soldAt: ..., // optional
    sourceSystem: ..., 
    externalSourceName: ..., // optional
    externalSourceId: ..., // optional
  };
  mutation.mutate(insertListingShadowVars);
  // Variables can be defined inline as well.
  mutation.mutate({ legacyFirestoreId: ..., sellerPartyId: ..., title: ..., categoryKey: ..., subcategoryKey: ..., manufacturerKey: ..., modelKey: ..., locationText: ..., priceAmount: ..., currencyCode: ..., lifecycleState: ..., reviewState: ..., paymentState: ..., inventoryState: ..., visibilityState: ..., primaryImageUrl: ..., publishedAt: ..., expiresAt: ..., soldAt: ..., sourceSystem: ..., externalSourceName: ..., externalSourceId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(insertListingShadowVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.listing_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateListingShadow
You can execute the `UpdateListingShadow` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateListingShadow(options?: useDataConnectMutationOptions<UpdateListingShadowData, FirebaseError, UpdateListingShadowVariables>): UseDataConnectMutationResult<UpdateListingShadowData, UpdateListingShadowVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateListingShadow(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateListingShadowData, FirebaseError, UpdateListingShadowVariables>): UseDataConnectMutationResult<UpdateListingShadowData, UpdateListingShadowVariables>;
```

### Variables
The `UpdateListingShadow` Mutation requires an argument of type `UpdateListingShadowVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateListingShadowVariables {
  id: UUIDString;
  sellerPartyId: string;
  title: string;
  categoryKey: string;
  subcategoryKey?: string | null;
  manufacturerKey?: string | null;
  modelKey?: string | null;
  locationText?: string | null;
  priceAmount?: number | null;
  currencyCode: string;
  lifecycleState: string;
  reviewState: string;
  paymentState: string;
  inventoryState: string;
  visibilityState: string;
  primaryImageUrl?: string | null;
  publishedAt?: TimestampString | null;
  expiresAt?: TimestampString | null;
  soldAt?: TimestampString | null;
  externalSourceName?: string | null;
  externalSourceId?: string | null;
}
```
### Return Type
Recall that calling the `UpdateListingShadow` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateListingShadow` Mutation is of type `UpdateListingShadowData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateListingShadowData {
  listing_update?: Listing_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateListingShadow`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateListingShadowVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useUpdateListingShadow } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function UpdateListingShadowComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateListingShadow();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateListingShadow(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateListingShadow(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateListingShadow(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateListingShadow` Mutation requires an argument of type `UpdateListingShadowVariables`:
  const updateListingShadowVars: UpdateListingShadowVariables = {
    id: ..., 
    sellerPartyId: ..., 
    title: ..., 
    categoryKey: ..., 
    subcategoryKey: ..., // optional
    manufacturerKey: ..., // optional
    modelKey: ..., // optional
    locationText: ..., // optional
    priceAmount: ..., // optional
    currencyCode: ..., 
    lifecycleState: ..., 
    reviewState: ..., 
    paymentState: ..., 
    inventoryState: ..., 
    visibilityState: ..., 
    primaryImageUrl: ..., // optional
    publishedAt: ..., // optional
    expiresAt: ..., // optional
    soldAt: ..., // optional
    externalSourceName: ..., // optional
    externalSourceId: ..., // optional
  };
  mutation.mutate(updateListingShadowVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., sellerPartyId: ..., title: ..., categoryKey: ..., subcategoryKey: ..., manufacturerKey: ..., modelKey: ..., locationText: ..., priceAmount: ..., currencyCode: ..., lifecycleState: ..., reviewState: ..., paymentState: ..., inventoryState: ..., visibilityState: ..., primaryImageUrl: ..., publishedAt: ..., expiresAt: ..., soldAt: ..., externalSourceName: ..., externalSourceId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateListingShadowVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.listing_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteListingShadow
You can execute the `DeleteListingShadow` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteListingShadow(options?: useDataConnectMutationOptions<DeleteListingShadowData, FirebaseError, DeleteListingShadowVariables>): UseDataConnectMutationResult<DeleteListingShadowData, DeleteListingShadowVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteListingShadow(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteListingShadowData, FirebaseError, DeleteListingShadowVariables>): UseDataConnectMutationResult<DeleteListingShadowData, DeleteListingShadowVariables>;
```

### Variables
The `DeleteListingShadow` Mutation requires an argument of type `DeleteListingShadowVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteListingShadowVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `DeleteListingShadow` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteListingShadow` Mutation is of type `DeleteListingShadowData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteListingShadowData {
  listing_delete?: Listing_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteListingShadow`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteListingShadowVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useDeleteListingShadow } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function DeleteListingShadowComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteListingShadow();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteListingShadow(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteListingShadow(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteListingShadow(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteListingShadow` Mutation requires an argument of type `DeleteListingShadowVariables`:
  const deleteListingShadowVars: DeleteListingShadowVariables = {
    id: ..., 
  };
  mutation.mutate(deleteListingShadowVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteListingShadowVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.listing_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RecordListingStateTransition
You can execute the `RecordListingStateTransition` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useRecordListingStateTransition(options?: useDataConnectMutationOptions<RecordListingStateTransitionData, FirebaseError, RecordListingStateTransitionVariables>): UseDataConnectMutationResult<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRecordListingStateTransition(dc: DataConnect, options?: useDataConnectMutationOptions<RecordListingStateTransitionData, FirebaseError, RecordListingStateTransitionVariables>): UseDataConnectMutationResult<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;
```

### Variables
The `RecordListingStateTransition` Mutation requires an argument of type `RecordListingStateTransitionVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RecordListingStateTransitionVariables {
  listingId: UUIDString;
  transitionAction: string;
  previousState?: string | null;
  nextState: string;
  previousReviewState?: string | null;
  nextReviewState?: string | null;
  previousPaymentState?: string | null;
  nextPaymentState?: string | null;
  previousInventoryState?: string | null;
  nextInventoryState?: string | null;
  previousVisibilityState?: string | null;
  nextVisibilityState?: string | null;
  actorType: string;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that calling the `RecordListingStateTransition` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RecordListingStateTransition` Mutation is of type `RecordListingStateTransitionData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RecordListingStateTransitionData {
  listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RecordListingStateTransition`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RecordListingStateTransitionVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useRecordListingStateTransition } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function RecordListingStateTransitionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRecordListingStateTransition();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRecordListingStateTransition(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRecordListingStateTransition(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRecordListingStateTransition(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRecordListingStateTransition` Mutation requires an argument of type `RecordListingStateTransitionVariables`:
  const recordListingStateTransitionVars: RecordListingStateTransitionVariables = {
    listingId: ..., 
    transitionAction: ..., 
    previousState: ..., // optional
    nextState: ..., 
    previousReviewState: ..., // optional
    nextReviewState: ..., // optional
    previousPaymentState: ..., // optional
    nextPaymentState: ..., // optional
    previousInventoryState: ..., // optional
    nextInventoryState: ..., // optional
    previousVisibilityState: ..., // optional
    nextVisibilityState: ..., // optional
    actorType: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
    reasonCode: ..., // optional
    reasonNote: ..., // optional
  };
  mutation.mutate(recordListingStateTransitionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ listingId: ..., transitionAction: ..., previousState: ..., nextState: ..., previousReviewState: ..., nextReviewState: ..., previousPaymentState: ..., nextPaymentState: ..., previousInventoryState: ..., nextInventoryState: ..., previousVisibilityState: ..., nextVisibilityState: ..., actorType: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(recordListingStateTransitionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SubmitListing
You can execute the `SubmitListing` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useSubmitListing(options?: useDataConnectMutationOptions<SubmitListingData, FirebaseError, SubmitListingVariables>): UseDataConnectMutationResult<SubmitListingData, SubmitListingVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSubmitListing(dc: DataConnect, options?: useDataConnectMutationOptions<SubmitListingData, FirebaseError, SubmitListingVariables>): UseDataConnectMutationResult<SubmitListingData, SubmitListingVariables>;
```

### Variables
The `SubmitListing` Mutation requires an argument of type `SubmitListingVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SubmitListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that calling the `SubmitListing` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SubmitListing` Mutation is of type `SubmitListingData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SubmitListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SubmitListing`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SubmitListingVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useSubmitListing } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function SubmitListingComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSubmitListing();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSubmitListing(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSubmitListing(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSubmitListing(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSubmitListing` Mutation requires an argument of type `SubmitListingVariables`:
  const submitListingVars: SubmitListingVariables = {
    id: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
    reasonNote: ..., // optional
  };
  mutation.mutate(submitListingVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., actorId: ..., requestId: ..., reasonNote: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(submitListingVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.query);
    console.log(mutation.data.listing_update);
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ApproveListing
You can execute the `ApproveListing` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useApproveListing(options?: useDataConnectMutationOptions<ApproveListingData, FirebaseError, ApproveListingVariables>): UseDataConnectMutationResult<ApproveListingData, ApproveListingVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useApproveListing(dc: DataConnect, options?: useDataConnectMutationOptions<ApproveListingData, FirebaseError, ApproveListingVariables>): UseDataConnectMutationResult<ApproveListingData, ApproveListingVariables>;
```

### Variables
The `ApproveListing` Mutation requires an argument of type `ApproveListingVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ApproveListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that calling the `ApproveListing` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ApproveListing` Mutation is of type `ApproveListingData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ApproveListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ApproveListing`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ApproveListingVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useApproveListing } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function ApproveListingComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useApproveListing();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useApproveListing(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useApproveListing(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useApproveListing(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useApproveListing` Mutation requires an argument of type `ApproveListingVariables`:
  const approveListingVars: ApproveListingVariables = {
    id: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
    reasonCode: ..., // optional
    reasonNote: ..., // optional
  };
  mutation.mutate(approveListingVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(approveListingVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.query);
    console.log(mutation.data.listing_update);
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RejectListing
You can execute the `RejectListing` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useRejectListing(options?: useDataConnectMutationOptions<RejectListingData, FirebaseError, RejectListingVariables>): UseDataConnectMutationResult<RejectListingData, RejectListingVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRejectListing(dc: DataConnect, options?: useDataConnectMutationOptions<RejectListingData, FirebaseError, RejectListingVariables>): UseDataConnectMutationResult<RejectListingData, RejectListingVariables>;
```

### Variables
The `RejectListing` Mutation requires an argument of type `RejectListingVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RejectListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode: string;
  reasonNote: string;
}
```
### Return Type
Recall that calling the `RejectListing` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RejectListing` Mutation is of type `RejectListingData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RejectListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RejectListing`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RejectListingVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useRejectListing } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function RejectListingComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRejectListing();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRejectListing(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRejectListing(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRejectListing(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRejectListing` Mutation requires an argument of type `RejectListingVariables`:
  const rejectListingVars: RejectListingVariables = {
    id: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
    reasonCode: ..., 
    reasonNote: ..., 
  };
  mutation.mutate(rejectListingVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(rejectListingVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.query);
    console.log(mutation.data.listing_update);
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ConfirmListingPayment
You can execute the `ConfirmListingPayment` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useConfirmListingPayment(options?: useDataConnectMutationOptions<ConfirmListingPaymentData, FirebaseError, ConfirmListingPaymentVariables>): UseDataConnectMutationResult<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useConfirmListingPayment(dc: DataConnect, options?: useDataConnectMutationOptions<ConfirmListingPaymentData, FirebaseError, ConfirmListingPaymentVariables>): UseDataConnectMutationResult<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;
```

### Variables
The `ConfirmListingPayment` Mutation requires an argument of type `ConfirmListingPaymentVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ConfirmListingPaymentVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
}
```
### Return Type
Recall that calling the `ConfirmListingPayment` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ConfirmListingPayment` Mutation is of type `ConfirmListingPaymentData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ConfirmListingPaymentData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ConfirmListingPayment`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ConfirmListingPaymentVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useConfirmListingPayment } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function ConfirmListingPaymentComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useConfirmListingPayment();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useConfirmListingPayment(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useConfirmListingPayment(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useConfirmListingPayment(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useConfirmListingPayment` Mutation requires an argument of type `ConfirmListingPaymentVariables`:
  const confirmListingPaymentVars: ConfirmListingPaymentVariables = {
    id: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
    reasonCode: ..., // optional
  };
  mutation.mutate(confirmListingPaymentVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(confirmListingPaymentVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.query);
    console.log(mutation.data.listing_update);
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## PublishListing
You can execute the `PublishListing` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
usePublishListing(options?: useDataConnectMutationOptions<PublishListingData, FirebaseError, PublishListingVariables>): UseDataConnectMutationResult<PublishListingData, PublishListingVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
usePublishListing(dc: DataConnect, options?: useDataConnectMutationOptions<PublishListingData, FirebaseError, PublishListingVariables>): UseDataConnectMutationResult<PublishListingData, PublishListingVariables>;
```

### Variables
The `PublishListing` Mutation requires an argument of type `PublishListingVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface PublishListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
}
```
### Return Type
Recall that calling the `PublishListing` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `PublishListing` Mutation is of type `PublishListingData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface PublishListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `PublishListing`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, PublishListingVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { usePublishListing } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function PublishListingComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = usePublishListing();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = usePublishListing(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = usePublishListing(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = usePublishListing(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `usePublishListing` Mutation requires an argument of type `PublishListingVariables`:
  const publishListingVars: PublishListingVariables = {
    id: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
  };
  mutation.mutate(publishListingVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., actorId: ..., requestId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(publishListingVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.query);
    console.log(mutation.data.listing_update);
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ExpireListing
You can execute the `ExpireListing` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useExpireListing(options?: useDataConnectMutationOptions<ExpireListingData, FirebaseError, ExpireListingVariables>): UseDataConnectMutationResult<ExpireListingData, ExpireListingVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useExpireListing(dc: DataConnect, options?: useDataConnectMutationOptions<ExpireListingData, FirebaseError, ExpireListingVariables>): UseDataConnectMutationResult<ExpireListingData, ExpireListingVariables>;
```

### Variables
The `ExpireListing` Mutation requires an argument of type `ExpireListingVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ExpireListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
}
```
### Return Type
Recall that calling the `ExpireListing` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ExpireListing` Mutation is of type `ExpireListingData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ExpireListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ExpireListing`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ExpireListingVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useExpireListing } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function ExpireListingComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useExpireListing();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useExpireListing(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useExpireListing(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useExpireListing(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useExpireListing` Mutation requires an argument of type `ExpireListingVariables`:
  const expireListingVars: ExpireListingVariables = {
    id: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
    reasonCode: ..., // optional
  };
  mutation.mutate(expireListingVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(expireListingVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.query);
    console.log(mutation.data.listing_update);
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RelistListing
You can execute the `RelistListing` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useRelistListing(options?: useDataConnectMutationOptions<RelistListingData, FirebaseError, RelistListingVariables>): UseDataConnectMutationResult<RelistListingData, RelistListingVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRelistListing(dc: DataConnect, options?: useDataConnectMutationOptions<RelistListingData, FirebaseError, RelistListingVariables>): UseDataConnectMutationResult<RelistListingData, RelistListingVariables>;
```

### Variables
The `RelistListing` Mutation requires an argument of type `RelistListingVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RelistListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that calling the `RelistListing` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RelistListing` Mutation is of type `RelistListingData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RelistListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RelistListing`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RelistListingVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useRelistListing } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function RelistListingComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRelistListing();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRelistListing(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRelistListing(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRelistListing(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRelistListing` Mutation requires an argument of type `RelistListingVariables`:
  const relistListingVars: RelistListingVariables = {
    id: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
    reasonNote: ..., // optional
  };
  mutation.mutate(relistListingVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., actorId: ..., requestId: ..., reasonNote: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(relistListingVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.query);
    console.log(mutation.data.listing_update);
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## MarkListingSold
You can execute the `MarkListingSold` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useMarkListingSold(options?: useDataConnectMutationOptions<MarkListingSoldData, FirebaseError, MarkListingSoldVariables>): UseDataConnectMutationResult<MarkListingSoldData, MarkListingSoldVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useMarkListingSold(dc: DataConnect, options?: useDataConnectMutationOptions<MarkListingSoldData, FirebaseError, MarkListingSoldVariables>): UseDataConnectMutationResult<MarkListingSoldData, MarkListingSoldVariables>;
```

### Variables
The `MarkListingSold` Mutation requires an argument of type `MarkListingSoldVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface MarkListingSoldVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that calling the `MarkListingSold` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `MarkListingSold` Mutation is of type `MarkListingSoldData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface MarkListingSoldData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `MarkListingSold`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, MarkListingSoldVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useMarkListingSold } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function MarkListingSoldComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useMarkListingSold();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useMarkListingSold(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkListingSold(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkListingSold(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useMarkListingSold` Mutation requires an argument of type `MarkListingSoldVariables`:
  const markListingSoldVars: MarkListingSoldVariables = {
    id: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
    reasonNote: ..., // optional
  };
  mutation.mutate(markListingSoldVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., actorId: ..., requestId: ..., reasonNote: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(markListingSoldVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.query);
    console.log(mutation.data.listing_update);
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ArchiveListing
You can execute the `ArchiveListing` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useArchiveListing(options?: useDataConnectMutationOptions<ArchiveListingData, FirebaseError, ArchiveListingVariables>): UseDataConnectMutationResult<ArchiveListingData, ArchiveListingVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useArchiveListing(dc: DataConnect, options?: useDataConnectMutationOptions<ArchiveListingData, FirebaseError, ArchiveListingVariables>): UseDataConnectMutationResult<ArchiveListingData, ArchiveListingVariables>;
```

### Variables
The `ArchiveListing` Mutation requires an argument of type `ArchiveListingVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ArchiveListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that calling the `ArchiveListing` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ArchiveListing` Mutation is of type `ArchiveListingData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ArchiveListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ArchiveListing`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ArchiveListingVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useArchiveListing } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function ArchiveListingComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useArchiveListing();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useArchiveListing(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useArchiveListing(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useArchiveListing(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useArchiveListing` Mutation requires an argument of type `ArchiveListingVariables`:
  const archiveListingVars: ArchiveListingVariables = {
    id: ..., 
    actorId: ..., // optional
    requestId: ..., // optional
    reasonCode: ..., // optional
    reasonNote: ..., // optional
  };
  mutation.mutate(archiveListingVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(archiveListingVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.query);
    console.log(mutation.data.listing_update);
    console.log(mutation.data.listingStateTransition_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ResolveListingAnomaly
You can execute the `ResolveListingAnomaly` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [generated/react/index.d.ts](./index.d.ts)):
```javascript
useResolveListingAnomaly(options?: useDataConnectMutationOptions<ResolveListingAnomalyData, FirebaseError, ResolveListingAnomalyVariables>): UseDataConnectMutationResult<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useResolveListingAnomaly(dc: DataConnect, options?: useDataConnectMutationOptions<ResolveListingAnomalyData, FirebaseError, ResolveListingAnomalyVariables>): UseDataConnectMutationResult<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;
```

### Variables
The `ResolveListingAnomaly` Mutation requires an argument of type `ResolveListingAnomalyVariables`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ResolveListingAnomalyVariables {
  id: UUIDString;
  resolutionNote: string;
}
```
### Return Type
Recall that calling the `ResolveListingAnomaly` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ResolveListingAnomaly` Mutation is of type `ResolveListingAnomalyData`, which is defined in [generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ResolveListingAnomalyData {
  listingAnomaly_update?: ListingAnomaly_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ResolveListingAnomaly`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ResolveListingAnomalyVariables } from '@dataconnect/generated-timberequip-listing-governance';
import { useResolveListingAnomaly } from '@dataconnect/generated-timberequip-listing-governance/react'

export default function ResolveListingAnomalyComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useResolveListingAnomaly();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useResolveListingAnomaly(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useResolveListingAnomaly(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useResolveListingAnomaly(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useResolveListingAnomaly` Mutation requires an argument of type `ResolveListingAnomalyVariables`:
  const resolveListingAnomalyVars: ResolveListingAnomalyVariables = {
    id: ..., 
    resolutionNote: ..., 
  };
  mutation.mutate(resolveListingAnomalyVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., resolutionNote: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(resolveListingAnomalyVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.listingAnomaly_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

