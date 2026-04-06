# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `marketplace`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`marketplace/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-marketplace/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetUserById*](#getuserbyid)
  - [*GetUserByEmail*](#getuserbyemail)
  - [*ListUsersByRole*](#listusersbyrole)
  - [*GetStorefrontBySlug*](#getstorefrontbyslug)
  - [*GetStorefrontByUserId*](#getstorefrontbyuserid)
  - [*ListActiveStorefronts*](#listactivestorefronts)
- [**Mutations**](#mutations)
  - [*UpsertUser*](#upsertuser)
  - [*UpsertStorefront*](#upsertstorefront)
  - [*DeleteUser*](#deleteuser)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `marketplace`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

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
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `marketplace`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-marketplace';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-marketplace';

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

Below are examples of how to use the `marketplace` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetUserById
You can execute the `GetUserById` Query using the following Query hook function, which is defined in [marketplace/react/index.d.ts](./index.d.ts):

```javascript
useGetUserById(dc: DataConnect, vars: GetUserByIdVariables, options?: useDataConnectQueryOptions<GetUserByIdData>): UseDataConnectQueryResult<GetUserByIdData, GetUserByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetUserById(vars: GetUserByIdVariables, options?: useDataConnectQueryOptions<GetUserByIdData>): UseDataConnectQueryResult<GetUserByIdData, GetUserByIdVariables>;
```

### Variables
The `GetUserById` Query requires an argument of type `GetUserByIdVariables`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetUserByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetUserById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetUserById` Query is of type `GetUserByIdData`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetUserByIdData {
  user?: {
    id: string;
    email: string;
    displayName?: string | null;
    phoneNumber?: string | null;
    role: string;
    emailVerified?: boolean | null;
    photoUrl?: string | null;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    company?: string | null;
    businessName?: string | null;
    accountStatus?: string | null;
    storefrontEnabled?: boolean | null;
    storefrontSlug?: string | null;
    storefrontName?: string | null;
    mfaEnabled?: boolean | null;
    favorites?: unknown | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & User_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetUserById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetUserByIdVariables } from '@dataconnect/generated-timberequip-marketplace';
import { useGetUserById } from '@dataconnect/generated-timberequip-marketplace/react'

export default function GetUserByIdComponent() {
  // The `useGetUserById` Query hook requires an argument of type `GetUserByIdVariables`:
  const getUserByIdVars: GetUserByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetUserById(getUserByIdVars);
  // Variables can be defined inline as well.
  const query = useGetUserById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetUserById(dataConnect, getUserByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetUserById(getUserByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetUserById(dataConnect, getUserByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.user);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetUserByEmail
You can execute the `GetUserByEmail` Query using the following Query hook function, which is defined in [marketplace/react/index.d.ts](./index.d.ts):

```javascript
useGetUserByEmail(dc: DataConnect, vars: GetUserByEmailVariables, options?: useDataConnectQueryOptions<GetUserByEmailData>): UseDataConnectQueryResult<GetUserByEmailData, GetUserByEmailVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetUserByEmail(vars: GetUserByEmailVariables, options?: useDataConnectQueryOptions<GetUserByEmailData>): UseDataConnectQueryResult<GetUserByEmailData, GetUserByEmailVariables>;
```

### Variables
The `GetUserByEmail` Query requires an argument of type `GetUserByEmailVariables`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetUserByEmailVariables {
  email: string;
}
```
### Return Type
Recall that calling the `GetUserByEmail` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetUserByEmail` Query is of type `GetUserByEmailData`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetUserByEmailData {
  users: ({
    id: string;
    email: string;
    displayName?: string | null;
    role: string;
    accountStatus?: string | null;
    storefrontEnabled?: boolean | null;
    storefrontSlug?: string | null;
  } & User_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetUserByEmail`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetUserByEmailVariables } from '@dataconnect/generated-timberequip-marketplace';
import { useGetUserByEmail } from '@dataconnect/generated-timberequip-marketplace/react'

export default function GetUserByEmailComponent() {
  // The `useGetUserByEmail` Query hook requires an argument of type `GetUserByEmailVariables`:
  const getUserByEmailVars: GetUserByEmailVariables = {
    email: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetUserByEmail(getUserByEmailVars);
  // Variables can be defined inline as well.
  const query = useGetUserByEmail({ email: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetUserByEmail(dataConnect, getUserByEmailVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetUserByEmail(getUserByEmailVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetUserByEmail(dataConnect, getUserByEmailVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.users);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListUsersByRole
You can execute the `ListUsersByRole` Query using the following Query hook function, which is defined in [marketplace/react/index.d.ts](./index.d.ts):

```javascript
useListUsersByRole(dc: DataConnect, vars: ListUsersByRoleVariables, options?: useDataConnectQueryOptions<ListUsersByRoleData>): UseDataConnectQueryResult<ListUsersByRoleData, ListUsersByRoleVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListUsersByRole(vars: ListUsersByRoleVariables, options?: useDataConnectQueryOptions<ListUsersByRoleData>): UseDataConnectQueryResult<ListUsersByRoleData, ListUsersByRoleVariables>;
```

### Variables
The `ListUsersByRole` Query requires an argument of type `ListUsersByRoleVariables`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListUsersByRoleVariables {
  role: string;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListUsersByRole` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListUsersByRole` Query is of type `ListUsersByRoleData`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListUsersByRoleData {
  users: ({
    id: string;
    email: string;
    displayName?: string | null;
    role: string;
    accountStatus?: string | null;
    storefrontEnabled?: boolean | null;
    createdAt: TimestampString;
  } & User_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListUsersByRole`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListUsersByRoleVariables } from '@dataconnect/generated-timberequip-marketplace';
import { useListUsersByRole } from '@dataconnect/generated-timberequip-marketplace/react'

export default function ListUsersByRoleComponent() {
  // The `useListUsersByRole` Query hook requires an argument of type `ListUsersByRoleVariables`:
  const listUsersByRoleVars: ListUsersByRoleVariables = {
    role: ..., 
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListUsersByRole(listUsersByRoleVars);
  // Variables can be defined inline as well.
  const query = useListUsersByRole({ role: ..., limit: ..., offset: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListUsersByRole(dataConnect, listUsersByRoleVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListUsersByRole(listUsersByRoleVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListUsersByRole(dataConnect, listUsersByRoleVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.users);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetStorefrontBySlug
You can execute the `GetStorefrontBySlug` Query using the following Query hook function, which is defined in [marketplace/react/index.d.ts](./index.d.ts):

```javascript
useGetStorefrontBySlug(dc: DataConnect, vars: GetStorefrontBySlugVariables, options?: useDataConnectQueryOptions<GetStorefrontBySlugData>): UseDataConnectQueryResult<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetStorefrontBySlug(vars: GetStorefrontBySlugVariables, options?: useDataConnectQueryOptions<GetStorefrontBySlugData>): UseDataConnectQueryResult<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;
```

### Variables
The `GetStorefrontBySlug` Query requires an argument of type `GetStorefrontBySlugVariables`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetStorefrontBySlugVariables {
  slug: string;
}
```
### Return Type
Recall that calling the `GetStorefrontBySlug` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetStorefrontBySlug` Query is of type `GetStorefrontBySlugData`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetStorefrontBySlugData {
  storefronts: ({
    id: string;
    userId: string;
    storefrontSlug?: string | null;
    canonicalPath?: string | null;
    storefrontName?: string | null;
    storefrontTagline?: string | null;
    storefrontDescription?: string | null;
    logoUrl?: string | null;
    coverPhotoUrl?: string | null;
    businessName?: string | null;
    city?: string | null;
    state?: string | null;
    location?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    serviceAreaScopes?: unknown | null;
    serviceAreaStates?: unknown | null;
    servicesOfferedCategories?: unknown | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  } & Storefront_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetStorefrontBySlug`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetStorefrontBySlugVariables } from '@dataconnect/generated-timberequip-marketplace';
import { useGetStorefrontBySlug } from '@dataconnect/generated-timberequip-marketplace/react'

export default function GetStorefrontBySlugComponent() {
  // The `useGetStorefrontBySlug` Query hook requires an argument of type `GetStorefrontBySlugVariables`:
  const getStorefrontBySlugVars: GetStorefrontBySlugVariables = {
    slug: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetStorefrontBySlug(getStorefrontBySlugVars);
  // Variables can be defined inline as well.
  const query = useGetStorefrontBySlug({ slug: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetStorefrontBySlug(dataConnect, getStorefrontBySlugVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetStorefrontBySlug(getStorefrontBySlugVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetStorefrontBySlug(dataConnect, getStorefrontBySlugVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.storefronts);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetStorefrontByUserId
You can execute the `GetStorefrontByUserId` Query using the following Query hook function, which is defined in [marketplace/react/index.d.ts](./index.d.ts):

```javascript
useGetStorefrontByUserId(dc: DataConnect, vars: GetStorefrontByUserIdVariables, options?: useDataConnectQueryOptions<GetStorefrontByUserIdData>): UseDataConnectQueryResult<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetStorefrontByUserId(vars: GetStorefrontByUserIdVariables, options?: useDataConnectQueryOptions<GetStorefrontByUserIdData>): UseDataConnectQueryResult<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;
```

### Variables
The `GetStorefrontByUserId` Query requires an argument of type `GetStorefrontByUserIdVariables`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetStorefrontByUserIdVariables {
  userId: string;
}
```
### Return Type
Recall that calling the `GetStorefrontByUserId` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetStorefrontByUserId` Query is of type `GetStorefrontByUserIdData`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetStorefrontByUserIdData {
  storefronts: ({
    id: string;
    userId: string;
    storefrontEnabled?: boolean | null;
    storefrontSlug?: string | null;
    storefrontName?: string | null;
    storefrontTagline?: string | null;
    storefrontDescription?: string | null;
    businessName?: string | null;
    location?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & Storefront_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetStorefrontByUserId`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetStorefrontByUserIdVariables } from '@dataconnect/generated-timberequip-marketplace';
import { useGetStorefrontByUserId } from '@dataconnect/generated-timberequip-marketplace/react'

export default function GetStorefrontByUserIdComponent() {
  // The `useGetStorefrontByUserId` Query hook requires an argument of type `GetStorefrontByUserIdVariables`:
  const getStorefrontByUserIdVars: GetStorefrontByUserIdVariables = {
    userId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetStorefrontByUserId(getStorefrontByUserIdVars);
  // Variables can be defined inline as well.
  const query = useGetStorefrontByUserId({ userId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetStorefrontByUserId(dataConnect, getStorefrontByUserIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetStorefrontByUserId(getStorefrontByUserIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetStorefrontByUserId(dataConnect, getStorefrontByUserIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.storefronts);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListActiveStorefronts
You can execute the `ListActiveStorefronts` Query using the following Query hook function, which is defined in [marketplace/react/index.d.ts](./index.d.ts):

```javascript
useListActiveStorefronts(dc: DataConnect, vars?: ListActiveStorefrontsVariables, options?: useDataConnectQueryOptions<ListActiveStorefrontsData>): UseDataConnectQueryResult<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListActiveStorefronts(vars?: ListActiveStorefrontsVariables, options?: useDataConnectQueryOptions<ListActiveStorefrontsData>): UseDataConnectQueryResult<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;
```

### Variables
The `ListActiveStorefronts` Query has an optional argument of type `ListActiveStorefrontsVariables`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListActiveStorefrontsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListActiveStorefronts` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListActiveStorefronts` Query is of type `ListActiveStorefrontsData`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListActiveStorefrontsData {
  storefronts: ({
    id: string;
    userId: string;
    storefrontSlug?: string | null;
    storefrontName?: string | null;
    businessName?: string | null;
    city?: string | null;
    state?: string | null;
    logoUrl?: string | null;
    servicesOfferedCategories?: unknown | null;
  } & Storefront_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListActiveStorefronts`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListActiveStorefrontsVariables } from '@dataconnect/generated-timberequip-marketplace';
import { useListActiveStorefronts } from '@dataconnect/generated-timberequip-marketplace/react'

export default function ListActiveStorefrontsComponent() {
  // The `useListActiveStorefronts` Query hook has an optional argument of type `ListActiveStorefrontsVariables`:
  const listActiveStorefrontsVars: ListActiveStorefrontsVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListActiveStorefronts(listActiveStorefrontsVars);
  // Variables can be defined inline as well.
  const query = useListActiveStorefronts({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListActiveStorefrontsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListActiveStorefronts();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListActiveStorefronts(dataConnect, listActiveStorefrontsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListActiveStorefronts(listActiveStorefrontsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListActiveStorefronts(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListActiveStorefronts(dataConnect, listActiveStorefrontsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.storefronts);
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

Below are examples of how to use the `marketplace` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## UpsertUser
You can execute the `UpsertUser` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [marketplace/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertUser(options?: useDataConnectMutationOptions<UpsertUserData, FirebaseError, UpsertUserVariables>): UseDataConnectMutationResult<UpsertUserData, UpsertUserVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertUserData, FirebaseError, UpsertUserVariables>): UseDataConnectMutationResult<UpsertUserData, UpsertUserVariables>;
```

### Variables
The `UpsertUser` Mutation requires an argument of type `UpsertUserVariables`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertUserVariables {
  id: string;
  email: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  role: string;
  emailVerified?: boolean | null;
  photoUrl?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  company?: string | null;
  businessName?: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  county?: string | null;
  postalCode?: string | null;
  country?: string | null;
  website?: string | null;
  accountStatus?: string | null;
  parentAccountUid?: string | null;
  accountAccessSource?: string | null;
  mfaEnabled?: boolean | null;
  mfaMethod?: string | null;
  mfaPhoneNumber?: string | null;
  mfaEnrolledAt?: TimestampString | null;
  favorites?: unknown | null;
  storefrontEnabled?: boolean | null;
  storefrontSlug?: string | null;
  storefrontName?: string | null;
  storefrontTagline?: string | null;
  storefrontDescription?: string | null;
  storefrontLogoUrl?: string | null;
  coverPhotoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: unknown | null;
  metadataJson?: unknown | null;
}
```
### Return Type
Recall that calling the `UpsertUser` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertUser` Mutation is of type `UpsertUserData`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertUserData {
  user_upsert: User_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertUser`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertUserVariables } from '@dataconnect/generated-timberequip-marketplace';
import { useUpsertUser } from '@dataconnect/generated-timberequip-marketplace/react'

export default function UpsertUserComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertUser();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertUser(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertUser(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertUser(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertUser` Mutation requires an argument of type `UpsertUserVariables`:
  const upsertUserVars: UpsertUserVariables = {
    id: ..., 
    email: ..., 
    displayName: ..., // optional
    phoneNumber: ..., // optional
    bio: ..., // optional
    role: ..., 
    emailVerified: ..., // optional
    photoUrl: ..., // optional
    location: ..., // optional
    latitude: ..., // optional
    longitude: ..., // optional
    company: ..., // optional
    businessName: ..., // optional
    street1: ..., // optional
    street2: ..., // optional
    city: ..., // optional
    state: ..., // optional
    county: ..., // optional
    postalCode: ..., // optional
    country: ..., // optional
    website: ..., // optional
    accountStatus: ..., // optional
    parentAccountUid: ..., // optional
    accountAccessSource: ..., // optional
    mfaEnabled: ..., // optional
    mfaMethod: ..., // optional
    mfaPhoneNumber: ..., // optional
    mfaEnrolledAt: ..., // optional
    favorites: ..., // optional
    storefrontEnabled: ..., // optional
    storefrontSlug: ..., // optional
    storefrontName: ..., // optional
    storefrontTagline: ..., // optional
    storefrontDescription: ..., // optional
    storefrontLogoUrl: ..., // optional
    coverPhotoUrl: ..., // optional
    seoTitle: ..., // optional
    seoDescription: ..., // optional
    seoKeywords: ..., // optional
    metadataJson: ..., // optional
  };
  mutation.mutate(upsertUserVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., email: ..., displayName: ..., phoneNumber: ..., bio: ..., role: ..., emailVerified: ..., photoUrl: ..., location: ..., latitude: ..., longitude: ..., company: ..., businessName: ..., street1: ..., street2: ..., city: ..., state: ..., county: ..., postalCode: ..., country: ..., website: ..., accountStatus: ..., parentAccountUid: ..., accountAccessSource: ..., mfaEnabled: ..., mfaMethod: ..., mfaPhoneNumber: ..., mfaEnrolledAt: ..., favorites: ..., storefrontEnabled: ..., storefrontSlug: ..., storefrontName: ..., storefrontTagline: ..., storefrontDescription: ..., storefrontLogoUrl: ..., coverPhotoUrl: ..., seoTitle: ..., seoDescription: ..., seoKeywords: ..., metadataJson: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertUserVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.user_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertStorefront
You can execute the `UpsertStorefront` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [marketplace/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertStorefront(options?: useDataConnectMutationOptions<UpsertStorefrontData, FirebaseError, UpsertStorefrontVariables>): UseDataConnectMutationResult<UpsertStorefrontData, UpsertStorefrontVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertStorefront(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertStorefrontData, FirebaseError, UpsertStorefrontVariables>): UseDataConnectMutationResult<UpsertStorefrontData, UpsertStorefrontVariables>;
```

### Variables
The `UpsertStorefront` Mutation requires an argument of type `UpsertStorefrontVariables`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertStorefrontVariables {
  id: string;
  userId: string;
  storefrontEnabled?: boolean | null;
  storefrontSlug?: string | null;
  canonicalPath?: string | null;
  storefrontName?: string | null;
  storefrontTagline?: string | null;
  storefrontDescription?: string | null;
  logoUrl?: string | null;
  coverPhotoUrl?: string | null;
  businessName?: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  county?: string | null;
  postalCode?: string | null;
  country?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  serviceAreaScopes?: unknown | null;
  serviceAreaStates?: unknown | null;
  serviceAreaCounties?: unknown | null;
  servicesOfferedCategories?: unknown | null;
  servicesOfferedSubcategories?: unknown | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: unknown | null;
}
```
### Return Type
Recall that calling the `UpsertStorefront` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertStorefront` Mutation is of type `UpsertStorefrontData`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertStorefrontData {
  storefront_upsert: Storefront_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertStorefront`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertStorefrontVariables } from '@dataconnect/generated-timberequip-marketplace';
import { useUpsertStorefront } from '@dataconnect/generated-timberequip-marketplace/react'

export default function UpsertStorefrontComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertStorefront();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertStorefront(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertStorefront(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertStorefront(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertStorefront` Mutation requires an argument of type `UpsertStorefrontVariables`:
  const upsertStorefrontVars: UpsertStorefrontVariables = {
    id: ..., 
    userId: ..., 
    storefrontEnabled: ..., // optional
    storefrontSlug: ..., // optional
    canonicalPath: ..., // optional
    storefrontName: ..., // optional
    storefrontTagline: ..., // optional
    storefrontDescription: ..., // optional
    logoUrl: ..., // optional
    coverPhotoUrl: ..., // optional
    businessName: ..., // optional
    street1: ..., // optional
    street2: ..., // optional
    city: ..., // optional
    state: ..., // optional
    county: ..., // optional
    postalCode: ..., // optional
    country: ..., // optional
    location: ..., // optional
    latitude: ..., // optional
    longitude: ..., // optional
    phone: ..., // optional
    email: ..., // optional
    website: ..., // optional
    serviceAreaScopes: ..., // optional
    serviceAreaStates: ..., // optional
    serviceAreaCounties: ..., // optional
    servicesOfferedCategories: ..., // optional
    servicesOfferedSubcategories: ..., // optional
    seoTitle: ..., // optional
    seoDescription: ..., // optional
    seoKeywords: ..., // optional
  };
  mutation.mutate(upsertStorefrontVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., userId: ..., storefrontEnabled: ..., storefrontSlug: ..., canonicalPath: ..., storefrontName: ..., storefrontTagline: ..., storefrontDescription: ..., logoUrl: ..., coverPhotoUrl: ..., businessName: ..., street1: ..., street2: ..., city: ..., state: ..., county: ..., postalCode: ..., country: ..., location: ..., latitude: ..., longitude: ..., phone: ..., email: ..., website: ..., serviceAreaScopes: ..., serviceAreaStates: ..., serviceAreaCounties: ..., servicesOfferedCategories: ..., servicesOfferedSubcategories: ..., seoTitle: ..., seoDescription: ..., seoKeywords: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertStorefrontVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.storefront_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteUser
You can execute the `DeleteUser` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [marketplace/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteUser(options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, DeleteUserVariables>): UseDataConnectMutationResult<DeleteUserData, DeleteUserVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteUser(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, DeleteUserVariables>): UseDataConnectMutationResult<DeleteUserData, DeleteUserVariables>;
```

### Variables
The `DeleteUser` Mutation requires an argument of type `DeleteUserVariables`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteUserVariables {
  id: string;
}
```
### Return Type
Recall that calling the `DeleteUser` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteUser` Mutation is of type `DeleteUserData`, which is defined in [marketplace/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteUserData {
  user_delete?: User_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteUser`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteUserVariables } from '@dataconnect/generated-timberequip-marketplace';
import { useDeleteUser } from '@dataconnect/generated-timberequip-marketplace/react'

export default function DeleteUserComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteUser();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteUser(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteUser(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteUser(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteUser` Mutation requires an argument of type `DeleteUserVariables`:
  const deleteUserVars: DeleteUserVariables = {
    id: ..., 
  };
  mutation.mutate(deleteUserVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteUserVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.user_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

