# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `leads`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`leads/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-leads/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetInquiryById*](#getinquirybyid)
  - [*ListInquiriesBySeller*](#listinquiriesbyseller)
  - [*ListInquiriesByBuyer*](#listinquiriesbybuyer)
  - [*ListInquiriesByListing*](#listinquiriesbylisting)
  - [*ListInquiriesByStatus*](#listinquiriesbystatus)
  - [*GetFinancingRequestById*](#getfinancingrequestbyid)
  - [*ListFinancingRequestsBySeller*](#listfinancingrequestsbyseller)
  - [*ListFinancingRequestsByBuyer*](#listfinancingrequestsbybuyer)
  - [*GetCallLogById*](#getcalllogbyid)
  - [*ListCallLogsBySeller*](#listcalllogsbyseller)
  - [*ListCallLogsByListing*](#listcalllogsbylisting)
  - [*ListContactRequestsByStatus*](#listcontactrequestsbystatus)
- [**Mutations**](#mutations)
  - [*UpsertInquiry*](#upsertinquiry)
  - [*UpdateInquiryStatus*](#updateinquirystatus)
  - [*UpsertFinancingRequest*](#upsertfinancingrequest)
  - [*InsertCallLog*](#insertcalllog)
  - [*InsertContactRequest*](#insertcontactrequest)
  - [*UpdateContactRequestStatus*](#updatecontactrequeststatus)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `leads`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

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
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `leads`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-leads';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-leads';

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

Below are examples of how to use the `leads` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetInquiryById
You can execute the `GetInquiryById` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useGetInquiryById(dc: DataConnect, vars: GetInquiryByIdVariables, options?: useDataConnectQueryOptions<GetInquiryByIdData>): UseDataConnectQueryResult<GetInquiryByIdData, GetInquiryByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetInquiryById(vars: GetInquiryByIdVariables, options?: useDataConnectQueryOptions<GetInquiryByIdData>): UseDataConnectQueryResult<GetInquiryByIdData, GetInquiryByIdVariables>;
```

### Variables
The `GetInquiryById` Query requires an argument of type `GetInquiryByIdVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetInquiryByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetInquiryById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetInquiryById` Query is of type `GetInquiryByIdData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetInquiryByIdData {
  inquiry?: {
    id: string;
    listingId?: string | null;
    sellerUid?: string | null;
    buyerUid?: string | null;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    message?: string | null;
    type: string;
    status: string;
    assignedToUid?: string | null;
    assignedToName?: string | null;
    internalNotes?: unknown | null;
    firstResponseAt?: TimestampString | null;
    responseTimeMinutes?: number | null;
    spamScore?: number | null;
    spamFlags?: unknown | null;
    contactConsentAccepted?: boolean | null;
    contactConsentVersion?: string | null;
    contactConsentScope?: string | null;
    contactConsentAt?: TimestampString | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & Inquiry_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetInquiryById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetInquiryByIdVariables } from '@dataconnect/generated-timberequip-leads';
import { useGetInquiryById } from '@dataconnect/generated-timberequip-leads/react'

export default function GetInquiryByIdComponent() {
  // The `useGetInquiryById` Query hook requires an argument of type `GetInquiryByIdVariables`:
  const getInquiryByIdVars: GetInquiryByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetInquiryById(getInquiryByIdVars);
  // Variables can be defined inline as well.
  const query = useGetInquiryById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetInquiryById(dataConnect, getInquiryByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetInquiryById(getInquiryByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetInquiryById(dataConnect, getInquiryByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.inquiry);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListInquiriesBySeller
You can execute the `ListInquiriesBySeller` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useListInquiriesBySeller(dc: DataConnect, vars: ListInquiriesBySellerVariables, options?: useDataConnectQueryOptions<ListInquiriesBySellerData>): UseDataConnectQueryResult<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListInquiriesBySeller(vars: ListInquiriesBySellerVariables, options?: useDataConnectQueryOptions<ListInquiriesBySellerData>): UseDataConnectQueryResult<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;
```

### Variables
The `ListInquiriesBySeller` Query requires an argument of type `ListInquiriesBySellerVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListInquiriesBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListInquiriesBySeller` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListInquiriesBySeller` Query is of type `ListInquiriesBySellerData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListInquiriesBySellerData {
  inquiries: ({
    id: string;
    listingId?: string | null;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    message?: string | null;
    type: string;
    status: string;
    assignedToName?: string | null;
    firstResponseAt?: TimestampString | null;
    responseTimeMinutes?: number | null;
    spamScore?: number | null;
    createdAt: TimestampString;
  } & Inquiry_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListInquiriesBySeller`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListInquiriesBySellerVariables } from '@dataconnect/generated-timberequip-leads';
import { useListInquiriesBySeller } from '@dataconnect/generated-timberequip-leads/react'

export default function ListInquiriesBySellerComponent() {
  // The `useListInquiriesBySeller` Query hook requires an argument of type `ListInquiriesBySellerVariables`:
  const listInquiriesBySellerVars: ListInquiriesBySellerVariables = {
    sellerUid: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListInquiriesBySeller(listInquiriesBySellerVars);
  // Variables can be defined inline as well.
  const query = useListInquiriesBySeller({ sellerUid: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListInquiriesBySeller(dataConnect, listInquiriesBySellerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListInquiriesBySeller(listInquiriesBySellerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListInquiriesBySeller(dataConnect, listInquiriesBySellerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.inquiries);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListInquiriesByBuyer
You can execute the `ListInquiriesByBuyer` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useListInquiriesByBuyer(dc: DataConnect, vars: ListInquiriesByBuyerVariables, options?: useDataConnectQueryOptions<ListInquiriesByBuyerData>): UseDataConnectQueryResult<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListInquiriesByBuyer(vars: ListInquiriesByBuyerVariables, options?: useDataConnectQueryOptions<ListInquiriesByBuyerData>): UseDataConnectQueryResult<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;
```

### Variables
The `ListInquiriesByBuyer` Query requires an argument of type `ListInquiriesByBuyerVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListInquiriesByBuyerVariables {
  buyerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListInquiriesByBuyer` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListInquiriesByBuyer` Query is of type `ListInquiriesByBuyerData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListInquiriesByBuyerData {
  inquiries: ({
    id: string;
    listingId?: string | null;
    sellerUid?: string | null;
    message?: string | null;
    type: string;
    status: string;
    createdAt: TimestampString;
  } & Inquiry_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListInquiriesByBuyer`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListInquiriesByBuyerVariables } from '@dataconnect/generated-timberequip-leads';
import { useListInquiriesByBuyer } from '@dataconnect/generated-timberequip-leads/react'

export default function ListInquiriesByBuyerComponent() {
  // The `useListInquiriesByBuyer` Query hook requires an argument of type `ListInquiriesByBuyerVariables`:
  const listInquiriesByBuyerVars: ListInquiriesByBuyerVariables = {
    buyerUid: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListInquiriesByBuyer(listInquiriesByBuyerVars);
  // Variables can be defined inline as well.
  const query = useListInquiriesByBuyer({ buyerUid: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListInquiriesByBuyer(dataConnect, listInquiriesByBuyerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListInquiriesByBuyer(listInquiriesByBuyerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListInquiriesByBuyer(dataConnect, listInquiriesByBuyerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.inquiries);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListInquiriesByListing
You can execute the `ListInquiriesByListing` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useListInquiriesByListing(dc: DataConnect, vars: ListInquiriesByListingVariables, options?: useDataConnectQueryOptions<ListInquiriesByListingData>): UseDataConnectQueryResult<ListInquiriesByListingData, ListInquiriesByListingVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListInquiriesByListing(vars: ListInquiriesByListingVariables, options?: useDataConnectQueryOptions<ListInquiriesByListingData>): UseDataConnectQueryResult<ListInquiriesByListingData, ListInquiriesByListingVariables>;
```

### Variables
The `ListInquiriesByListing` Query requires an argument of type `ListInquiriesByListingVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListInquiriesByListingVariables {
  listingId: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListInquiriesByListing` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListInquiriesByListing` Query is of type `ListInquiriesByListingData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListInquiriesByListingData {
  inquiries: ({
    id: string;
    buyerName: string;
    buyerEmail: string;
    message?: string | null;
    type: string;
    status: string;
    createdAt: TimestampString;
  } & Inquiry_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListInquiriesByListing`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListInquiriesByListingVariables } from '@dataconnect/generated-timberequip-leads';
import { useListInquiriesByListing } from '@dataconnect/generated-timberequip-leads/react'

export default function ListInquiriesByListingComponent() {
  // The `useListInquiriesByListing` Query hook requires an argument of type `ListInquiriesByListingVariables`:
  const listInquiriesByListingVars: ListInquiriesByListingVariables = {
    listingId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListInquiriesByListing(listInquiriesByListingVars);
  // Variables can be defined inline as well.
  const query = useListInquiriesByListing({ listingId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListInquiriesByListing(dataConnect, listInquiriesByListingVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListInquiriesByListing(listInquiriesByListingVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListInquiriesByListing(dataConnect, listInquiriesByListingVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.inquiries);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListInquiriesByStatus
You can execute the `ListInquiriesByStatus` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useListInquiriesByStatus(dc: DataConnect, vars: ListInquiriesByStatusVariables, options?: useDataConnectQueryOptions<ListInquiriesByStatusData>): UseDataConnectQueryResult<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListInquiriesByStatus(vars: ListInquiriesByStatusVariables, options?: useDataConnectQueryOptions<ListInquiriesByStatusData>): UseDataConnectQueryResult<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;
```

### Variables
The `ListInquiriesByStatus` Query requires an argument of type `ListInquiriesByStatusVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListInquiriesByStatusVariables {
  status: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListInquiriesByStatus` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListInquiriesByStatus` Query is of type `ListInquiriesByStatusData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListInquiriesByStatusData {
  inquiries: ({
    id: string;
    listingId?: string | null;
    sellerUid?: string | null;
    buyerName: string;
    buyerEmail: string;
    type: string;
    status: string;
    spamScore?: number | null;
    createdAt: TimestampString;
  } & Inquiry_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListInquiriesByStatus`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListInquiriesByStatusVariables } from '@dataconnect/generated-timberequip-leads';
import { useListInquiriesByStatus } from '@dataconnect/generated-timberequip-leads/react'

export default function ListInquiriesByStatusComponent() {
  // The `useListInquiriesByStatus` Query hook requires an argument of type `ListInquiriesByStatusVariables`:
  const listInquiriesByStatusVars: ListInquiriesByStatusVariables = {
    status: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListInquiriesByStatus(listInquiriesByStatusVars);
  // Variables can be defined inline as well.
  const query = useListInquiriesByStatus({ status: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListInquiriesByStatus(dataConnect, listInquiriesByStatusVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListInquiriesByStatus(listInquiriesByStatusVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListInquiriesByStatus(dataConnect, listInquiriesByStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.inquiries);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetFinancingRequestById
You can execute the `GetFinancingRequestById` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useGetFinancingRequestById(dc: DataConnect, vars: GetFinancingRequestByIdVariables, options?: useDataConnectQueryOptions<GetFinancingRequestByIdData>): UseDataConnectQueryResult<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetFinancingRequestById(vars: GetFinancingRequestByIdVariables, options?: useDataConnectQueryOptions<GetFinancingRequestByIdData>): UseDataConnectQueryResult<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;
```

### Variables
The `GetFinancingRequestById` Query requires an argument of type `GetFinancingRequestByIdVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetFinancingRequestByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetFinancingRequestById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetFinancingRequestById` Query is of type `GetFinancingRequestByIdData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetFinancingRequestByIdData {
  financingRequest?: {
    id: string;
    listingId?: string | null;
    sellerUid?: string | null;
    buyerUid?: string | null;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string | null;
    company?: string | null;
    requestedAmount?: number | null;
    message?: string | null;
    status: string;
    contactConsentAccepted?: boolean | null;
    contactConsentVersion?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & FinancingRequest_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetFinancingRequestById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetFinancingRequestByIdVariables } from '@dataconnect/generated-timberequip-leads';
import { useGetFinancingRequestById } from '@dataconnect/generated-timberequip-leads/react'

export default function GetFinancingRequestByIdComponent() {
  // The `useGetFinancingRequestById` Query hook requires an argument of type `GetFinancingRequestByIdVariables`:
  const getFinancingRequestByIdVars: GetFinancingRequestByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetFinancingRequestById(getFinancingRequestByIdVars);
  // Variables can be defined inline as well.
  const query = useGetFinancingRequestById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetFinancingRequestById(dataConnect, getFinancingRequestByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetFinancingRequestById(getFinancingRequestByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetFinancingRequestById(dataConnect, getFinancingRequestByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.financingRequest);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListFinancingRequestsBySeller
You can execute the `ListFinancingRequestsBySeller` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useListFinancingRequestsBySeller(dc: DataConnect, vars: ListFinancingRequestsBySellerVariables, options?: useDataConnectQueryOptions<ListFinancingRequestsBySellerData>): UseDataConnectQueryResult<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListFinancingRequestsBySeller(vars: ListFinancingRequestsBySellerVariables, options?: useDataConnectQueryOptions<ListFinancingRequestsBySellerData>): UseDataConnectQueryResult<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;
```

### Variables
The `ListFinancingRequestsBySeller` Query requires an argument of type `ListFinancingRequestsBySellerVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListFinancingRequestsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListFinancingRequestsBySeller` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListFinancingRequestsBySeller` Query is of type `ListFinancingRequestsBySellerData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListFinancingRequestsBySellerData {
  financingRequests: ({
    id: string;
    listingId?: string | null;
    applicantName: string;
    applicantEmail: string;
    requestedAmount?: number | null;
    status: string;
    createdAt: TimestampString;
  } & FinancingRequest_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListFinancingRequestsBySeller`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListFinancingRequestsBySellerVariables } from '@dataconnect/generated-timberequip-leads';
import { useListFinancingRequestsBySeller } from '@dataconnect/generated-timberequip-leads/react'

export default function ListFinancingRequestsBySellerComponent() {
  // The `useListFinancingRequestsBySeller` Query hook requires an argument of type `ListFinancingRequestsBySellerVariables`:
  const listFinancingRequestsBySellerVars: ListFinancingRequestsBySellerVariables = {
    sellerUid: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListFinancingRequestsBySeller(listFinancingRequestsBySellerVars);
  // Variables can be defined inline as well.
  const query = useListFinancingRequestsBySeller({ sellerUid: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListFinancingRequestsBySeller(dataConnect, listFinancingRequestsBySellerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListFinancingRequestsBySeller(listFinancingRequestsBySellerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListFinancingRequestsBySeller(dataConnect, listFinancingRequestsBySellerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.financingRequests);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListFinancingRequestsByBuyer
You can execute the `ListFinancingRequestsByBuyer` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useListFinancingRequestsByBuyer(dc: DataConnect, vars: ListFinancingRequestsByBuyerVariables, options?: useDataConnectQueryOptions<ListFinancingRequestsByBuyerData>): UseDataConnectQueryResult<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListFinancingRequestsByBuyer(vars: ListFinancingRequestsByBuyerVariables, options?: useDataConnectQueryOptions<ListFinancingRequestsByBuyerData>): UseDataConnectQueryResult<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;
```

### Variables
The `ListFinancingRequestsByBuyer` Query requires an argument of type `ListFinancingRequestsByBuyerVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListFinancingRequestsByBuyerVariables {
  buyerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListFinancingRequestsByBuyer` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListFinancingRequestsByBuyer` Query is of type `ListFinancingRequestsByBuyerData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListFinancingRequestsByBuyerData {
  financingRequests: ({
    id: string;
    listingId?: string | null;
    requestedAmount?: number | null;
    status: string;
    createdAt: TimestampString;
  } & FinancingRequest_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListFinancingRequestsByBuyer`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListFinancingRequestsByBuyerVariables } from '@dataconnect/generated-timberequip-leads';
import { useListFinancingRequestsByBuyer } from '@dataconnect/generated-timberequip-leads/react'

export default function ListFinancingRequestsByBuyerComponent() {
  // The `useListFinancingRequestsByBuyer` Query hook requires an argument of type `ListFinancingRequestsByBuyerVariables`:
  const listFinancingRequestsByBuyerVars: ListFinancingRequestsByBuyerVariables = {
    buyerUid: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListFinancingRequestsByBuyer(listFinancingRequestsByBuyerVars);
  // Variables can be defined inline as well.
  const query = useListFinancingRequestsByBuyer({ buyerUid: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListFinancingRequestsByBuyer(dataConnect, listFinancingRequestsByBuyerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListFinancingRequestsByBuyer(listFinancingRequestsByBuyerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListFinancingRequestsByBuyer(dataConnect, listFinancingRequestsByBuyerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.financingRequests);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetCallLogById
You can execute the `GetCallLogById` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useGetCallLogById(dc: DataConnect, vars: GetCallLogByIdVariables, options?: useDataConnectQueryOptions<GetCallLogByIdData>): UseDataConnectQueryResult<GetCallLogByIdData, GetCallLogByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetCallLogById(vars: GetCallLogByIdVariables, options?: useDataConnectQueryOptions<GetCallLogByIdData>): UseDataConnectQueryResult<GetCallLogByIdData, GetCallLogByIdVariables>;
```

### Variables
The `GetCallLogById` Query requires an argument of type `GetCallLogByIdVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetCallLogByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetCallLogById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetCallLogById` Query is of type `GetCallLogByIdData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetCallLogByIdData {
  callLog?: {
    id: string;
    listingId?: string | null;
    listingTitle?: string | null;
    sellerUid?: string | null;
    sellerName?: string | null;
    sellerPhone?: string | null;
    callerUid?: string | null;
    callerName?: string | null;
    callerEmail?: string | null;
    callerPhone?: string | null;
    duration?: number | null;
    status: string;
    source?: string | null;
    isAuthenticated?: boolean | null;
    recordingUrl?: string | null;
    twilioCallSid?: string | null;
    completedAt?: TimestampString | null;
    createdAt: TimestampString;
  } & CallLog_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetCallLogById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetCallLogByIdVariables } from '@dataconnect/generated-timberequip-leads';
import { useGetCallLogById } from '@dataconnect/generated-timberequip-leads/react'

export default function GetCallLogByIdComponent() {
  // The `useGetCallLogById` Query hook requires an argument of type `GetCallLogByIdVariables`:
  const getCallLogByIdVars: GetCallLogByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetCallLogById(getCallLogByIdVars);
  // Variables can be defined inline as well.
  const query = useGetCallLogById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetCallLogById(dataConnect, getCallLogByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetCallLogById(getCallLogByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetCallLogById(dataConnect, getCallLogByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.callLog);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListCallLogsBySeller
You can execute the `ListCallLogsBySeller` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useListCallLogsBySeller(dc: DataConnect, vars: ListCallLogsBySellerVariables, options?: useDataConnectQueryOptions<ListCallLogsBySellerData>): UseDataConnectQueryResult<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListCallLogsBySeller(vars: ListCallLogsBySellerVariables, options?: useDataConnectQueryOptions<ListCallLogsBySellerData>): UseDataConnectQueryResult<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;
```

### Variables
The `ListCallLogsBySeller` Query requires an argument of type `ListCallLogsBySellerVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListCallLogsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListCallLogsBySeller` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListCallLogsBySeller` Query is of type `ListCallLogsBySellerData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListCallLogsBySellerData {
  callLogs: ({
    id: string;
    listingId?: string | null;
    listingTitle?: string | null;
    callerName?: string | null;
    callerPhone?: string | null;
    duration?: number | null;
    status: string;
    source?: string | null;
    createdAt: TimestampString;
  } & CallLog_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListCallLogsBySeller`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListCallLogsBySellerVariables } from '@dataconnect/generated-timberequip-leads';
import { useListCallLogsBySeller } from '@dataconnect/generated-timberequip-leads/react'

export default function ListCallLogsBySellerComponent() {
  // The `useListCallLogsBySeller` Query hook requires an argument of type `ListCallLogsBySellerVariables`:
  const listCallLogsBySellerVars: ListCallLogsBySellerVariables = {
    sellerUid: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListCallLogsBySeller(listCallLogsBySellerVars);
  // Variables can be defined inline as well.
  const query = useListCallLogsBySeller({ sellerUid: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListCallLogsBySeller(dataConnect, listCallLogsBySellerVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListCallLogsBySeller(listCallLogsBySellerVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListCallLogsBySeller(dataConnect, listCallLogsBySellerVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.callLogs);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListCallLogsByListing
You can execute the `ListCallLogsByListing` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useListCallLogsByListing(dc: DataConnect, vars: ListCallLogsByListingVariables, options?: useDataConnectQueryOptions<ListCallLogsByListingData>): UseDataConnectQueryResult<ListCallLogsByListingData, ListCallLogsByListingVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListCallLogsByListing(vars: ListCallLogsByListingVariables, options?: useDataConnectQueryOptions<ListCallLogsByListingData>): UseDataConnectQueryResult<ListCallLogsByListingData, ListCallLogsByListingVariables>;
```

### Variables
The `ListCallLogsByListing` Query requires an argument of type `ListCallLogsByListingVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListCallLogsByListingVariables {
  listingId: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListCallLogsByListing` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListCallLogsByListing` Query is of type `ListCallLogsByListingData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListCallLogsByListingData {
  callLogs: ({
    id: string;
    callerName?: string | null;
    callerPhone?: string | null;
    duration?: number | null;
    status: string;
    createdAt: TimestampString;
  } & CallLog_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListCallLogsByListing`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListCallLogsByListingVariables } from '@dataconnect/generated-timberequip-leads';
import { useListCallLogsByListing } from '@dataconnect/generated-timberequip-leads/react'

export default function ListCallLogsByListingComponent() {
  // The `useListCallLogsByListing` Query hook requires an argument of type `ListCallLogsByListingVariables`:
  const listCallLogsByListingVars: ListCallLogsByListingVariables = {
    listingId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListCallLogsByListing(listCallLogsByListingVars);
  // Variables can be defined inline as well.
  const query = useListCallLogsByListing({ listingId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListCallLogsByListing(dataConnect, listCallLogsByListingVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListCallLogsByListing(listCallLogsByListingVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListCallLogsByListing(dataConnect, listCallLogsByListingVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.callLogs);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListContactRequestsByStatus
You can execute the `ListContactRequestsByStatus` Query using the following Query hook function, which is defined in [leads/react/index.d.ts](./index.d.ts):

```javascript
useListContactRequestsByStatus(dc: DataConnect, vars: ListContactRequestsByStatusVariables, options?: useDataConnectQueryOptions<ListContactRequestsByStatusData>): UseDataConnectQueryResult<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListContactRequestsByStatus(vars: ListContactRequestsByStatusVariables, options?: useDataConnectQueryOptions<ListContactRequestsByStatusData>): UseDataConnectQueryResult<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;
```

### Variables
The `ListContactRequestsByStatus` Query requires an argument of type `ListContactRequestsByStatusVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListContactRequestsByStatusVariables {
  status: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `ListContactRequestsByStatus` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListContactRequestsByStatus` Query is of type `ListContactRequestsByStatusData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListContactRequestsByStatusData {
  contactRequests: ({
    id: string;
    name?: string | null;
    email: string;
    category?: string | null;
    message?: string | null;
    source?: string | null;
    status?: string | null;
    createdAt: TimestampString;
  } & ContactRequest_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListContactRequestsByStatus`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListContactRequestsByStatusVariables } from '@dataconnect/generated-timberequip-leads';
import { useListContactRequestsByStatus } from '@dataconnect/generated-timberequip-leads/react'

export default function ListContactRequestsByStatusComponent() {
  // The `useListContactRequestsByStatus` Query hook requires an argument of type `ListContactRequestsByStatusVariables`:
  const listContactRequestsByStatusVars: ListContactRequestsByStatusVariables = {
    status: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListContactRequestsByStatus(listContactRequestsByStatusVars);
  // Variables can be defined inline as well.
  const query = useListContactRequestsByStatus({ status: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListContactRequestsByStatus(dataConnect, listContactRequestsByStatusVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListContactRequestsByStatus(listContactRequestsByStatusVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListContactRequestsByStatus(dataConnect, listContactRequestsByStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.contactRequests);
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

Below are examples of how to use the `leads` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## UpsertInquiry
You can execute the `UpsertInquiry` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [leads/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertInquiry(options?: useDataConnectMutationOptions<UpsertInquiryData, FirebaseError, UpsertInquiryVariables>): UseDataConnectMutationResult<UpsertInquiryData, UpsertInquiryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertInquiry(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertInquiryData, FirebaseError, UpsertInquiryVariables>): UseDataConnectMutationResult<UpsertInquiryData, UpsertInquiryVariables>;
```

### Variables
The `UpsertInquiry` Mutation requires an argument of type `UpsertInquiryVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertInquiryVariables {
  id: string;
  listingId?: string | null;
  sellerUid?: string | null;
  buyerUid?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
  message?: string | null;
  type: string;
  status: string;
  assignedToUid?: string | null;
  assignedToName?: string | null;
  internalNotes?: unknown | null;
  firstResponseAt?: TimestampString | null;
  responseTimeMinutes?: number | null;
  spamScore?: number | null;
  spamFlags?: unknown | null;
  contactConsentAccepted?: boolean | null;
  contactConsentVersion?: string | null;
  contactConsentScope?: string | null;
  contactConsentAt?: TimestampString | null;
}
```
### Return Type
Recall that calling the `UpsertInquiry` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertInquiry` Mutation is of type `UpsertInquiryData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertInquiryData {
  inquiry_upsert: Inquiry_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertInquiry`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertInquiryVariables } from '@dataconnect/generated-timberequip-leads';
import { useUpsertInquiry } from '@dataconnect/generated-timberequip-leads/react'

export default function UpsertInquiryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertInquiry();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertInquiry(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertInquiry(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertInquiry(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertInquiry` Mutation requires an argument of type `UpsertInquiryVariables`:
  const upsertInquiryVars: UpsertInquiryVariables = {
    id: ..., 
    listingId: ..., // optional
    sellerUid: ..., // optional
    buyerUid: ..., // optional
    buyerName: ..., 
    buyerEmail: ..., 
    buyerPhone: ..., // optional
    message: ..., // optional
    type: ..., 
    status: ..., 
    assignedToUid: ..., // optional
    assignedToName: ..., // optional
    internalNotes: ..., // optional
    firstResponseAt: ..., // optional
    responseTimeMinutes: ..., // optional
    spamScore: ..., // optional
    spamFlags: ..., // optional
    contactConsentAccepted: ..., // optional
    contactConsentVersion: ..., // optional
    contactConsentScope: ..., // optional
    contactConsentAt: ..., // optional
  };
  mutation.mutate(upsertInquiryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., listingId: ..., sellerUid: ..., buyerUid: ..., buyerName: ..., buyerEmail: ..., buyerPhone: ..., message: ..., type: ..., status: ..., assignedToUid: ..., assignedToName: ..., internalNotes: ..., firstResponseAt: ..., responseTimeMinutes: ..., spamScore: ..., spamFlags: ..., contactConsentAccepted: ..., contactConsentVersion: ..., contactConsentScope: ..., contactConsentAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertInquiryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.inquiry_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateInquiryStatus
You can execute the `UpdateInquiryStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [leads/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateInquiryStatus(options?: useDataConnectMutationOptions<UpdateInquiryStatusData, FirebaseError, UpdateInquiryStatusVariables>): UseDataConnectMutationResult<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateInquiryStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateInquiryStatusData, FirebaseError, UpdateInquiryStatusVariables>): UseDataConnectMutationResult<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;
```

### Variables
The `UpdateInquiryStatus` Mutation requires an argument of type `UpdateInquiryStatusVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateInquiryStatusVariables {
  id: string;
  status: string;
  assignedToUid?: string | null;
  assignedToName?: string | null;
  firstResponseAt?: TimestampString | null;
  responseTimeMinutes?: number | null;
}
```
### Return Type
Recall that calling the `UpdateInquiryStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateInquiryStatus` Mutation is of type `UpdateInquiryStatusData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateInquiryStatusData {
  inquiry_update?: Inquiry_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateInquiryStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateInquiryStatusVariables } from '@dataconnect/generated-timberequip-leads';
import { useUpdateInquiryStatus } from '@dataconnect/generated-timberequip-leads/react'

export default function UpdateInquiryStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateInquiryStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateInquiryStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateInquiryStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateInquiryStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateInquiryStatus` Mutation requires an argument of type `UpdateInquiryStatusVariables`:
  const updateInquiryStatusVars: UpdateInquiryStatusVariables = {
    id: ..., 
    status: ..., 
    assignedToUid: ..., // optional
    assignedToName: ..., // optional
    firstResponseAt: ..., // optional
    responseTimeMinutes: ..., // optional
  };
  mutation.mutate(updateInquiryStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., assignedToUid: ..., assignedToName: ..., firstResponseAt: ..., responseTimeMinutes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateInquiryStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.inquiry_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertFinancingRequest
You can execute the `UpsertFinancingRequest` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [leads/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertFinancingRequest(options?: useDataConnectMutationOptions<UpsertFinancingRequestData, FirebaseError, UpsertFinancingRequestVariables>): UseDataConnectMutationResult<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertFinancingRequest(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertFinancingRequestData, FirebaseError, UpsertFinancingRequestVariables>): UseDataConnectMutationResult<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;
```

### Variables
The `UpsertFinancingRequest` Mutation requires an argument of type `UpsertFinancingRequestVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertFinancingRequestVariables {
  id: string;
  listingId?: string | null;
  sellerUid?: string | null;
  buyerUid?: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string | null;
  company?: string | null;
  requestedAmount?: number | null;
  message?: string | null;
  status: string;
  contactConsentAccepted?: boolean | null;
  contactConsentVersion?: string | null;
  contactConsentScope?: string | null;
  contactConsentAt?: TimestampString | null;
}
```
### Return Type
Recall that calling the `UpsertFinancingRequest` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertFinancingRequest` Mutation is of type `UpsertFinancingRequestData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertFinancingRequestData {
  financingRequest_upsert: FinancingRequest_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertFinancingRequest`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertFinancingRequestVariables } from '@dataconnect/generated-timberequip-leads';
import { useUpsertFinancingRequest } from '@dataconnect/generated-timberequip-leads/react'

export default function UpsertFinancingRequestComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertFinancingRequest();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertFinancingRequest(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertFinancingRequest(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertFinancingRequest(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertFinancingRequest` Mutation requires an argument of type `UpsertFinancingRequestVariables`:
  const upsertFinancingRequestVars: UpsertFinancingRequestVariables = {
    id: ..., 
    listingId: ..., // optional
    sellerUid: ..., // optional
    buyerUid: ..., // optional
    applicantName: ..., 
    applicantEmail: ..., 
    applicantPhone: ..., // optional
    company: ..., // optional
    requestedAmount: ..., // optional
    message: ..., // optional
    status: ..., 
    contactConsentAccepted: ..., // optional
    contactConsentVersion: ..., // optional
    contactConsentScope: ..., // optional
    contactConsentAt: ..., // optional
  };
  mutation.mutate(upsertFinancingRequestVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., listingId: ..., sellerUid: ..., buyerUid: ..., applicantName: ..., applicantEmail: ..., applicantPhone: ..., company: ..., requestedAmount: ..., message: ..., status: ..., contactConsentAccepted: ..., contactConsentVersion: ..., contactConsentScope: ..., contactConsentAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertFinancingRequestVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.financingRequest_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## InsertCallLog
You can execute the `InsertCallLog` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [leads/react/index.d.ts](./index.d.ts)):
```javascript
useInsertCallLog(options?: useDataConnectMutationOptions<InsertCallLogData, FirebaseError, InsertCallLogVariables>): UseDataConnectMutationResult<InsertCallLogData, InsertCallLogVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useInsertCallLog(dc: DataConnect, options?: useDataConnectMutationOptions<InsertCallLogData, FirebaseError, InsertCallLogVariables>): UseDataConnectMutationResult<InsertCallLogData, InsertCallLogVariables>;
```

### Variables
The `InsertCallLog` Mutation requires an argument of type `InsertCallLogVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface InsertCallLogVariables {
  id: string;
  listingId?: string | null;
  listingTitle?: string | null;
  sellerUid?: string | null;
  sellerName?: string | null;
  sellerPhone?: string | null;
  callerUid?: string | null;
  callerName?: string | null;
  callerEmail?: string | null;
  callerPhone?: string | null;
  duration?: number | null;
  status: string;
  source?: string | null;
  isAuthenticated?: boolean | null;
  recordingUrl?: string | null;
  twilioCallSid?: string | null;
  completedAt?: TimestampString | null;
}
```
### Return Type
Recall that calling the `InsertCallLog` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `InsertCallLog` Mutation is of type `InsertCallLogData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface InsertCallLogData {
  callLog_insert: CallLog_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `InsertCallLog`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, InsertCallLogVariables } from '@dataconnect/generated-timberequip-leads';
import { useInsertCallLog } from '@dataconnect/generated-timberequip-leads/react'

export default function InsertCallLogComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useInsertCallLog();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useInsertCallLog(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertCallLog(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertCallLog(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useInsertCallLog` Mutation requires an argument of type `InsertCallLogVariables`:
  const insertCallLogVars: InsertCallLogVariables = {
    id: ..., 
    listingId: ..., // optional
    listingTitle: ..., // optional
    sellerUid: ..., // optional
    sellerName: ..., // optional
    sellerPhone: ..., // optional
    callerUid: ..., // optional
    callerName: ..., // optional
    callerEmail: ..., // optional
    callerPhone: ..., // optional
    duration: ..., // optional
    status: ..., 
    source: ..., // optional
    isAuthenticated: ..., // optional
    recordingUrl: ..., // optional
    twilioCallSid: ..., // optional
    completedAt: ..., // optional
  };
  mutation.mutate(insertCallLogVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., listingId: ..., listingTitle: ..., sellerUid: ..., sellerName: ..., sellerPhone: ..., callerUid: ..., callerName: ..., callerEmail: ..., callerPhone: ..., duration: ..., status: ..., source: ..., isAuthenticated: ..., recordingUrl: ..., twilioCallSid: ..., completedAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(insertCallLogVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.callLog_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## InsertContactRequest
You can execute the `InsertContactRequest` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [leads/react/index.d.ts](./index.d.ts)):
```javascript
useInsertContactRequest(options?: useDataConnectMutationOptions<InsertContactRequestData, FirebaseError, InsertContactRequestVariables>): UseDataConnectMutationResult<InsertContactRequestData, InsertContactRequestVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useInsertContactRequest(dc: DataConnect, options?: useDataConnectMutationOptions<InsertContactRequestData, FirebaseError, InsertContactRequestVariables>): UseDataConnectMutationResult<InsertContactRequestData, InsertContactRequestVariables>;
```

### Variables
The `InsertContactRequest` Mutation requires an argument of type `InsertContactRequestVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface InsertContactRequestVariables {
  id: string;
  name?: string | null;
  email: string;
  category?: string | null;
  message?: string | null;
  source?: string | null;
  status?: string | null;
}
```
### Return Type
Recall that calling the `InsertContactRequest` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `InsertContactRequest` Mutation is of type `InsertContactRequestData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface InsertContactRequestData {
  contactRequest_insert: ContactRequest_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `InsertContactRequest`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, InsertContactRequestVariables } from '@dataconnect/generated-timberequip-leads';
import { useInsertContactRequest } from '@dataconnect/generated-timberequip-leads/react'

export default function InsertContactRequestComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useInsertContactRequest();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useInsertContactRequest(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertContactRequest(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useInsertContactRequest(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useInsertContactRequest` Mutation requires an argument of type `InsertContactRequestVariables`:
  const insertContactRequestVars: InsertContactRequestVariables = {
    id: ..., 
    name: ..., // optional
    email: ..., 
    category: ..., // optional
    message: ..., // optional
    source: ..., // optional
    status: ..., // optional
  };
  mutation.mutate(insertContactRequestVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., email: ..., category: ..., message: ..., source: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(insertContactRequestVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.contactRequest_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateContactRequestStatus
You can execute the `UpdateContactRequestStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [leads/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateContactRequestStatus(options?: useDataConnectMutationOptions<UpdateContactRequestStatusData, FirebaseError, UpdateContactRequestStatusVariables>): UseDataConnectMutationResult<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateContactRequestStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateContactRequestStatusData, FirebaseError, UpdateContactRequestStatusVariables>): UseDataConnectMutationResult<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;
```

### Variables
The `UpdateContactRequestStatus` Mutation requires an argument of type `UpdateContactRequestStatusVariables`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateContactRequestStatusVariables {
  id: string;
  status: string;
}
```
### Return Type
Recall that calling the `UpdateContactRequestStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateContactRequestStatus` Mutation is of type `UpdateContactRequestStatusData`, which is defined in [leads/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateContactRequestStatusData {
  contactRequest_update?: ContactRequest_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateContactRequestStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateContactRequestStatusVariables } from '@dataconnect/generated-timberequip-leads';
import { useUpdateContactRequestStatus } from '@dataconnect/generated-timberequip-leads/react'

export default function UpdateContactRequestStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateContactRequestStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateContactRequestStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateContactRequestStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateContactRequestStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateContactRequestStatus` Mutation requires an argument of type `UpdateContactRequestStatusVariables`:
  const updateContactRequestStatusVars: UpdateContactRequestStatusVariables = {
    id: ..., 
    status: ..., 
  };
  mutation.mutate(updateContactRequestStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateContactRequestStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.contactRequest_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

