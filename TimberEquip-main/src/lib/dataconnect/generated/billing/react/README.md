# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `billing`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`billing/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-billing/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetSubscriptionsByUser*](#getsubscriptionsbyuser)
  - [*GetActiveSubscriptionForListing*](#getactivesubscriptionforlisting)
  - [*GetSubscriptionByStripeId*](#getsubscriptionbystripeid)
  - [*GetInvoicesByUser*](#getinvoicesbyuser)
  - [*GetSellerApplicationsByUser*](#getsellerapplicationsbyuser)
- [**Mutations**](#mutations)
  - [*UpsertSubscription*](#upsertsubscription)
  - [*UpsertInvoice*](#upsertinvoice)
  - [*UpsertSellerApplication*](#upsertsellerapplication)
  - [*UpdateSubscriptionStatus*](#updatesubscriptionstatus)
  - [*UpdateInvoiceStatus*](#updateinvoicestatus)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `billing`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

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
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `billing`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-billing';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-billing';

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

Below are examples of how to use the `billing` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetSubscriptionsByUser
You can execute the `GetSubscriptionsByUser` Query using the following Query hook function, which is defined in [billing/react/index.d.ts](./index.d.ts):

```javascript
useGetSubscriptionsByUser(dc: DataConnect, vars: GetSubscriptionsByUserVariables, options?: useDataConnectQueryOptions<GetSubscriptionsByUserData>): UseDataConnectQueryResult<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetSubscriptionsByUser(vars: GetSubscriptionsByUserVariables, options?: useDataConnectQueryOptions<GetSubscriptionsByUserData>): UseDataConnectQueryResult<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;
```

### Variables
The `GetSubscriptionsByUser` Query requires an argument of type `GetSubscriptionsByUserVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetSubscriptionsByUserVariables {
  userId: string;
}
```
### Return Type
Recall that calling the `GetSubscriptionsByUser` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetSubscriptionsByUser` Query is of type `GetSubscriptionsByUserData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetSubscriptionsByUserData {
  billingSubscriptions: ({
    id: string;
    userId: string;
    listingId?: string | null;
    planId: string;
    planName?: string | null;
    listingCap?: number | null;
    status: string;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: TimestampString | null;
    cancelAtPeriodEnd?: boolean | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & BillingSubscription_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetSubscriptionsByUser`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetSubscriptionsByUserVariables } from '@dataconnect/generated-timberequip-billing';
import { useGetSubscriptionsByUser } from '@dataconnect/generated-timberequip-billing/react'

export default function GetSubscriptionsByUserComponent() {
  // The `useGetSubscriptionsByUser` Query hook requires an argument of type `GetSubscriptionsByUserVariables`:
  const getSubscriptionsByUserVars: GetSubscriptionsByUserVariables = {
    userId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetSubscriptionsByUser(getSubscriptionsByUserVars);
  // Variables can be defined inline as well.
  const query = useGetSubscriptionsByUser({ userId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetSubscriptionsByUser(dataConnect, getSubscriptionsByUserVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetSubscriptionsByUser(getSubscriptionsByUserVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetSubscriptionsByUser(dataConnect, getSubscriptionsByUserVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.billingSubscriptions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetActiveSubscriptionForListing
You can execute the `GetActiveSubscriptionForListing` Query using the following Query hook function, which is defined in [billing/react/index.d.ts](./index.d.ts):

```javascript
useGetActiveSubscriptionForListing(dc: DataConnect, vars: GetActiveSubscriptionForListingVariables, options?: useDataConnectQueryOptions<GetActiveSubscriptionForListingData>): UseDataConnectQueryResult<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetActiveSubscriptionForListing(vars: GetActiveSubscriptionForListingVariables, options?: useDataConnectQueryOptions<GetActiveSubscriptionForListingData>): UseDataConnectQueryResult<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;
```

### Variables
The `GetActiveSubscriptionForListing` Query requires an argument of type `GetActiveSubscriptionForListingVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetActiveSubscriptionForListingVariables {
  listingId: string;
}
```
### Return Type
Recall that calling the `GetActiveSubscriptionForListing` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetActiveSubscriptionForListing` Query is of type `GetActiveSubscriptionForListingData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetActiveSubscriptionForListingData {
  billingSubscriptions: ({
    id: string;
    userId: string;
    planId: string;
    status: string;
    currentPeriodEnd?: TimestampString | null;
    cancelAtPeriodEnd?: boolean | null;
  } & BillingSubscription_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetActiveSubscriptionForListing`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetActiveSubscriptionForListingVariables } from '@dataconnect/generated-timberequip-billing';
import { useGetActiveSubscriptionForListing } from '@dataconnect/generated-timberequip-billing/react'

export default function GetActiveSubscriptionForListingComponent() {
  // The `useGetActiveSubscriptionForListing` Query hook requires an argument of type `GetActiveSubscriptionForListingVariables`:
  const getActiveSubscriptionForListingVars: GetActiveSubscriptionForListingVariables = {
    listingId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetActiveSubscriptionForListing(getActiveSubscriptionForListingVars);
  // Variables can be defined inline as well.
  const query = useGetActiveSubscriptionForListing({ listingId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetActiveSubscriptionForListing(dataConnect, getActiveSubscriptionForListingVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetActiveSubscriptionForListing(getActiveSubscriptionForListingVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetActiveSubscriptionForListing(dataConnect, getActiveSubscriptionForListingVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.billingSubscriptions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetSubscriptionByStripeId
You can execute the `GetSubscriptionByStripeId` Query using the following Query hook function, which is defined in [billing/react/index.d.ts](./index.d.ts):

```javascript
useGetSubscriptionByStripeId(dc: DataConnect, vars: GetSubscriptionByStripeIdVariables, options?: useDataConnectQueryOptions<GetSubscriptionByStripeIdData>): UseDataConnectQueryResult<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetSubscriptionByStripeId(vars: GetSubscriptionByStripeIdVariables, options?: useDataConnectQueryOptions<GetSubscriptionByStripeIdData>): UseDataConnectQueryResult<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;
```

### Variables
The `GetSubscriptionByStripeId` Query requires an argument of type `GetSubscriptionByStripeIdVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetSubscriptionByStripeIdVariables {
  stripeId: string;
}
```
### Return Type
Recall that calling the `GetSubscriptionByStripeId` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetSubscriptionByStripeId` Query is of type `GetSubscriptionByStripeIdData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetSubscriptionByStripeIdData {
  billingSubscriptions: ({
    id: string;
    userId: string;
    listingId?: string | null;
    planId: string;
    status: string;
    currentPeriodEnd?: TimestampString | null;
    cancelAtPeriodEnd?: boolean | null;
  } & BillingSubscription_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetSubscriptionByStripeId`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetSubscriptionByStripeIdVariables } from '@dataconnect/generated-timberequip-billing';
import { useGetSubscriptionByStripeId } from '@dataconnect/generated-timberequip-billing/react'

export default function GetSubscriptionByStripeIdComponent() {
  // The `useGetSubscriptionByStripeId` Query hook requires an argument of type `GetSubscriptionByStripeIdVariables`:
  const getSubscriptionByStripeIdVars: GetSubscriptionByStripeIdVariables = {
    stripeId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetSubscriptionByStripeId(getSubscriptionByStripeIdVars);
  // Variables can be defined inline as well.
  const query = useGetSubscriptionByStripeId({ stripeId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetSubscriptionByStripeId(dataConnect, getSubscriptionByStripeIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetSubscriptionByStripeId(getSubscriptionByStripeIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetSubscriptionByStripeId(dataConnect, getSubscriptionByStripeIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.billingSubscriptions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetInvoicesByUser
You can execute the `GetInvoicesByUser` Query using the following Query hook function, which is defined in [billing/react/index.d.ts](./index.d.ts):

```javascript
useGetInvoicesByUser(dc: DataConnect, vars: GetInvoicesByUserVariables, options?: useDataConnectQueryOptions<GetInvoicesByUserData>): UseDataConnectQueryResult<GetInvoicesByUserData, GetInvoicesByUserVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetInvoicesByUser(vars: GetInvoicesByUserVariables, options?: useDataConnectQueryOptions<GetInvoicesByUserData>): UseDataConnectQueryResult<GetInvoicesByUserData, GetInvoicesByUserVariables>;
```

### Variables
The `GetInvoicesByUser` Query requires an argument of type `GetInvoicesByUserVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetInvoicesByUserVariables {
  userId: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `GetInvoicesByUser` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetInvoicesByUser` Query is of type `GetInvoicesByUserData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetInvoicesByUserData {
  invoices: ({
    id: string;
    userId: string;
    listingId?: string | null;
    stripeInvoiceId?: string | null;
    amount: number;
    currency?: string | null;
    status: string;
    items?: unknown | null;
    source?: string | null;
    paidAt?: TimestampString | null;
    createdAt: TimestampString;
  } & Invoice_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetInvoicesByUser`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetInvoicesByUserVariables } from '@dataconnect/generated-timberequip-billing';
import { useGetInvoicesByUser } from '@dataconnect/generated-timberequip-billing/react'

export default function GetInvoicesByUserComponent() {
  // The `useGetInvoicesByUser` Query hook requires an argument of type `GetInvoicesByUserVariables`:
  const getInvoicesByUserVars: GetInvoicesByUserVariables = {
    userId: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetInvoicesByUser(getInvoicesByUserVars);
  // Variables can be defined inline as well.
  const query = useGetInvoicesByUser({ userId: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetInvoicesByUser(dataConnect, getInvoicesByUserVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetInvoicesByUser(getInvoicesByUserVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetInvoicesByUser(dataConnect, getInvoicesByUserVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.invoices);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetSellerApplicationsByUser
You can execute the `GetSellerApplicationsByUser` Query using the following Query hook function, which is defined in [billing/react/index.d.ts](./index.d.ts):

```javascript
useGetSellerApplicationsByUser(dc: DataConnect, vars: GetSellerApplicationsByUserVariables, options?: useDataConnectQueryOptions<GetSellerApplicationsByUserData>): UseDataConnectQueryResult<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetSellerApplicationsByUser(vars: GetSellerApplicationsByUserVariables, options?: useDataConnectQueryOptions<GetSellerApplicationsByUserData>): UseDataConnectQueryResult<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;
```

### Variables
The `GetSellerApplicationsByUser` Query requires an argument of type `GetSellerApplicationsByUserVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetSellerApplicationsByUserVariables {
  userId: string;
}
```
### Return Type
Recall that calling the `GetSellerApplicationsByUser` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetSellerApplicationsByUser` Query is of type `GetSellerApplicationsByUserData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetSellerApplicationsByUserData {
  sellerProgramApplications: ({
    id: string;
    userId: string;
    planId?: string | null;
    status?: string | null;
    legalFullName?: string | null;
    companyName?: string | null;
    statementLabel?: string | null;
    legalScope?: string | null;
    legalTermsVersion?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & SellerProgramApplication_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetSellerApplicationsByUser`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetSellerApplicationsByUserVariables } from '@dataconnect/generated-timberequip-billing';
import { useGetSellerApplicationsByUser } from '@dataconnect/generated-timberequip-billing/react'

export default function GetSellerApplicationsByUserComponent() {
  // The `useGetSellerApplicationsByUser` Query hook requires an argument of type `GetSellerApplicationsByUserVariables`:
  const getSellerApplicationsByUserVars: GetSellerApplicationsByUserVariables = {
    userId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetSellerApplicationsByUser(getSellerApplicationsByUserVars);
  // Variables can be defined inline as well.
  const query = useGetSellerApplicationsByUser({ userId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetSellerApplicationsByUser(dataConnect, getSellerApplicationsByUserVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetSellerApplicationsByUser(getSellerApplicationsByUserVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetSellerApplicationsByUser(dataConnect, getSellerApplicationsByUserVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.sellerProgramApplications);
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

Below are examples of how to use the `billing` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## UpsertSubscription
You can execute the `UpsertSubscription` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [billing/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertSubscription(options?: useDataConnectMutationOptions<UpsertSubscriptionData, FirebaseError, UpsertSubscriptionVariables>): UseDataConnectMutationResult<UpsertSubscriptionData, UpsertSubscriptionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertSubscription(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertSubscriptionData, FirebaseError, UpsertSubscriptionVariables>): UseDataConnectMutationResult<UpsertSubscriptionData, UpsertSubscriptionVariables>;
```

### Variables
The `UpsertSubscription` Mutation requires an argument of type `UpsertSubscriptionVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertSubscriptionVariables {
  id: string;
  userId: string;
  listingId?: string | null;
  planId: string;
  planName?: string | null;
  listingCap?: number | null;
  status: string;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: TimestampString | null;
  cancelAtPeriodEnd?: boolean | null;
}
```
### Return Type
Recall that calling the `UpsertSubscription` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertSubscription` Mutation is of type `UpsertSubscriptionData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertSubscriptionData {
  billingSubscription_upsert: BillingSubscription_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertSubscription`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertSubscriptionVariables } from '@dataconnect/generated-timberequip-billing';
import { useUpsertSubscription } from '@dataconnect/generated-timberequip-billing/react'

export default function UpsertSubscriptionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertSubscription();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertSubscription(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertSubscription(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertSubscription(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertSubscription` Mutation requires an argument of type `UpsertSubscriptionVariables`:
  const upsertSubscriptionVars: UpsertSubscriptionVariables = {
    id: ..., 
    userId: ..., 
    listingId: ..., // optional
    planId: ..., 
    planName: ..., // optional
    listingCap: ..., // optional
    status: ..., 
    stripeSubscriptionId: ..., // optional
    currentPeriodEnd: ..., // optional
    cancelAtPeriodEnd: ..., // optional
  };
  mutation.mutate(upsertSubscriptionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., userId: ..., listingId: ..., planId: ..., planName: ..., listingCap: ..., status: ..., stripeSubscriptionId: ..., currentPeriodEnd: ..., cancelAtPeriodEnd: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertSubscriptionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.billingSubscription_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertInvoice
You can execute the `UpsertInvoice` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [billing/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertInvoice(options?: useDataConnectMutationOptions<UpsertInvoiceData, FirebaseError, UpsertInvoiceVariables>): UseDataConnectMutationResult<UpsertInvoiceData, UpsertInvoiceVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertInvoice(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertInvoiceData, FirebaseError, UpsertInvoiceVariables>): UseDataConnectMutationResult<UpsertInvoiceData, UpsertInvoiceVariables>;
```

### Variables
The `UpsertInvoice` Mutation requires an argument of type `UpsertInvoiceVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertInvoiceVariables {
  id: string;
  userId: string;
  listingId?: string | null;
  stripeInvoiceId?: string | null;
  stripeCheckoutSessionId?: string | null;
  amount: number;
  currency?: string | null;
  status: string;
  items?: unknown | null;
  source?: string | null;
  paidAt?: TimestampString | null;
}
```
### Return Type
Recall that calling the `UpsertInvoice` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertInvoice` Mutation is of type `UpsertInvoiceData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertInvoiceData {
  invoice_upsert: Invoice_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertInvoice`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertInvoiceVariables } from '@dataconnect/generated-timberequip-billing';
import { useUpsertInvoice } from '@dataconnect/generated-timberequip-billing/react'

export default function UpsertInvoiceComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertInvoice();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertInvoice(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertInvoice(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertInvoice(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertInvoice` Mutation requires an argument of type `UpsertInvoiceVariables`:
  const upsertInvoiceVars: UpsertInvoiceVariables = {
    id: ..., 
    userId: ..., 
    listingId: ..., // optional
    stripeInvoiceId: ..., // optional
    stripeCheckoutSessionId: ..., // optional
    amount: ..., 
    currency: ..., // optional
    status: ..., 
    items: ..., // optional
    source: ..., // optional
    paidAt: ..., // optional
  };
  mutation.mutate(upsertInvoiceVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., userId: ..., listingId: ..., stripeInvoiceId: ..., stripeCheckoutSessionId: ..., amount: ..., currency: ..., status: ..., items: ..., source: ..., paidAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertInvoiceVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.invoice_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertSellerApplication
You can execute the `UpsertSellerApplication` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [billing/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertSellerApplication(options?: useDataConnectMutationOptions<UpsertSellerApplicationData, FirebaseError, UpsertSellerApplicationVariables>): UseDataConnectMutationResult<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertSellerApplication(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertSellerApplicationData, FirebaseError, UpsertSellerApplicationVariables>): UseDataConnectMutationResult<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;
```

### Variables
The `UpsertSellerApplication` Mutation requires an argument of type `UpsertSellerApplicationVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertSellerApplicationVariables {
  id: string;
  userId: string;
  planId?: string | null;
  status?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  legalFullName?: string | null;
  legalTitle?: string | null;
  companyName?: string | null;
  billingEmail?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  country?: string | null;
  taxIdOrVat?: string | null;
  notes?: string | null;
  statementLabel?: string | null;
  legalScope?: string | null;
  legalTermsVersion?: string | null;
  legalAcceptedAtIso?: string | null;
  acceptedTerms?: boolean | null;
  acceptedPrivacy?: boolean | null;
  acceptedRecurringBilling?: boolean | null;
  acceptedVisibilityPolicy?: boolean | null;
  acceptedAuthority?: boolean | null;
  source?: string | null;
}
```
### Return Type
Recall that calling the `UpsertSellerApplication` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertSellerApplication` Mutation is of type `UpsertSellerApplicationData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertSellerApplicationData {
  sellerProgramApplication_upsert: SellerProgramApplication_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertSellerApplication`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertSellerApplicationVariables } from '@dataconnect/generated-timberequip-billing';
import { useUpsertSellerApplication } from '@dataconnect/generated-timberequip-billing/react'

export default function UpsertSellerApplicationComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertSellerApplication();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertSellerApplication(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertSellerApplication(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertSellerApplication(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertSellerApplication` Mutation requires an argument of type `UpsertSellerApplicationVariables`:
  const upsertSellerApplicationVars: UpsertSellerApplicationVariables = {
    id: ..., 
    userId: ..., 
    planId: ..., // optional
    status: ..., // optional
    stripeCustomerId: ..., // optional
    stripeSubscriptionId: ..., // optional
    legalFullName: ..., // optional
    legalTitle: ..., // optional
    companyName: ..., // optional
    billingEmail: ..., // optional
    phoneNumber: ..., // optional
    website: ..., // optional
    country: ..., // optional
    taxIdOrVat: ..., // optional
    notes: ..., // optional
    statementLabel: ..., // optional
    legalScope: ..., // optional
    legalTermsVersion: ..., // optional
    legalAcceptedAtIso: ..., // optional
    acceptedTerms: ..., // optional
    acceptedPrivacy: ..., // optional
    acceptedRecurringBilling: ..., // optional
    acceptedVisibilityPolicy: ..., // optional
    acceptedAuthority: ..., // optional
    source: ..., // optional
  };
  mutation.mutate(upsertSellerApplicationVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., userId: ..., planId: ..., status: ..., stripeCustomerId: ..., stripeSubscriptionId: ..., legalFullName: ..., legalTitle: ..., companyName: ..., billingEmail: ..., phoneNumber: ..., website: ..., country: ..., taxIdOrVat: ..., notes: ..., statementLabel: ..., legalScope: ..., legalTermsVersion: ..., legalAcceptedAtIso: ..., acceptedTerms: ..., acceptedPrivacy: ..., acceptedRecurringBilling: ..., acceptedVisibilityPolicy: ..., acceptedAuthority: ..., source: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertSellerApplicationVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.sellerProgramApplication_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateSubscriptionStatus
You can execute the `UpdateSubscriptionStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [billing/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateSubscriptionStatus(options?: useDataConnectMutationOptions<UpdateSubscriptionStatusData, FirebaseError, UpdateSubscriptionStatusVariables>): UseDataConnectMutationResult<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateSubscriptionStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateSubscriptionStatusData, FirebaseError, UpdateSubscriptionStatusVariables>): UseDataConnectMutationResult<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;
```

### Variables
The `UpdateSubscriptionStatus` Mutation requires an argument of type `UpdateSubscriptionStatusVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateSubscriptionStatusVariables {
  id: string;
  status: string;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodEnd?: TimestampString | null;
}
```
### Return Type
Recall that calling the `UpdateSubscriptionStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateSubscriptionStatus` Mutation is of type `UpdateSubscriptionStatusData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateSubscriptionStatusData {
  billingSubscription_update?: BillingSubscription_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateSubscriptionStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateSubscriptionStatusVariables } from '@dataconnect/generated-timberequip-billing';
import { useUpdateSubscriptionStatus } from '@dataconnect/generated-timberequip-billing/react'

export default function UpdateSubscriptionStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateSubscriptionStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateSubscriptionStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateSubscriptionStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateSubscriptionStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateSubscriptionStatus` Mutation requires an argument of type `UpdateSubscriptionStatusVariables`:
  const updateSubscriptionStatusVars: UpdateSubscriptionStatusVariables = {
    id: ..., 
    status: ..., 
    cancelAtPeriodEnd: ..., // optional
    currentPeriodEnd: ..., // optional
  };
  mutation.mutate(updateSubscriptionStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., cancelAtPeriodEnd: ..., currentPeriodEnd: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateSubscriptionStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.billingSubscription_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateInvoiceStatus
You can execute the `UpdateInvoiceStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [billing/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateInvoiceStatus(options?: useDataConnectMutationOptions<UpdateInvoiceStatusData, FirebaseError, UpdateInvoiceStatusVariables>): UseDataConnectMutationResult<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateInvoiceStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateInvoiceStatusData, FirebaseError, UpdateInvoiceStatusVariables>): UseDataConnectMutationResult<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;
```

### Variables
The `UpdateInvoiceStatus` Mutation requires an argument of type `UpdateInvoiceStatusVariables`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateInvoiceStatusVariables {
  id: string;
  status: string;
  paidAt?: TimestampString | null;
}
```
### Return Type
Recall that calling the `UpdateInvoiceStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateInvoiceStatus` Mutation is of type `UpdateInvoiceStatusData`, which is defined in [billing/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateInvoiceStatusData {
  invoice_update?: Invoice_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateInvoiceStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateInvoiceStatusVariables } from '@dataconnect/generated-timberequip-billing';
import { useUpdateInvoiceStatus } from '@dataconnect/generated-timberequip-billing/react'

export default function UpdateInvoiceStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateInvoiceStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateInvoiceStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateInvoiceStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateInvoiceStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateInvoiceStatus` Mutation requires an argument of type `UpdateInvoiceStatusVariables`:
  const updateInvoiceStatusVars: UpdateInvoiceStatusVariables = {
    id: ..., 
    status: ..., 
    paidAt: ..., // optional
  };
  mutation.mutate(updateInvoiceStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., status: ..., paidAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateInvoiceStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.invoice_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

