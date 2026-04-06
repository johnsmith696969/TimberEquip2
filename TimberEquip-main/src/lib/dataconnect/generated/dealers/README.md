# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `dealers`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dealers/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `dealers`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-dealers` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-dealers';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-dealers';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `dealers` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetDealerFeedProfileById
You can execute the `GetDealerFeedProfileById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
getDealerFeedProfileById(vars: GetDealerFeedProfileByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;

interface GetDealerFeedProfileByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDealerFeedProfileByIdVariables): QueryRef<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;
}
export const getDealerFeedProfileByIdRef: GetDealerFeedProfileByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getDealerFeedProfileById(dc: DataConnect, vars: GetDealerFeedProfileByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;

interface GetDealerFeedProfileByIdRef {
  ...
  (dc: DataConnect, vars: GetDealerFeedProfileByIdVariables): QueryRef<GetDealerFeedProfileByIdData, GetDealerFeedProfileByIdVariables>;
}
export const getDealerFeedProfileByIdRef: GetDealerFeedProfileByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getDealerFeedProfileByIdRef:
```typescript
const name = getDealerFeedProfileByIdRef.operationName;
console.log(name);
```

### Variables
The `GetDealerFeedProfileById` query requires an argument of type `GetDealerFeedProfileByIdVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetDealerFeedProfileByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetDealerFeedProfileById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetDealerFeedProfileByIdData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetDealerFeedProfileById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getDealerFeedProfileById, GetDealerFeedProfileByIdVariables } from '@dataconnect/generated-timberequip-dealers';

// The `GetDealerFeedProfileById` query requires an argument of type `GetDealerFeedProfileByIdVariables`:
const getDealerFeedProfileByIdVars: GetDealerFeedProfileByIdVariables = {
  id: ..., 
};

// Call the `getDealerFeedProfileById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getDealerFeedProfileById(getDealerFeedProfileByIdVars);
// Variables can be defined inline as well.
const { data } = await getDealerFeedProfileById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getDealerFeedProfileById(dataConnect, getDealerFeedProfileByIdVars);

console.log(data.dealerFeedProfile);

// Or, you can use the `Promise` API.
getDealerFeedProfileById(getDealerFeedProfileByIdVars).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfile);
});
```

### Using `GetDealerFeedProfileById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getDealerFeedProfileByIdRef, GetDealerFeedProfileByIdVariables } from '@dataconnect/generated-timberequip-dealers';

// The `GetDealerFeedProfileById` query requires an argument of type `GetDealerFeedProfileByIdVariables`:
const getDealerFeedProfileByIdVars: GetDealerFeedProfileByIdVariables = {
  id: ..., 
};

// Call the `getDealerFeedProfileByIdRef()` function to get a reference to the query.
const ref = getDealerFeedProfileByIdRef(getDealerFeedProfileByIdVars);
// Variables can be defined inline as well.
const ref = getDealerFeedProfileByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getDealerFeedProfileByIdRef(dataConnect, getDealerFeedProfileByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerFeedProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfile);
});
```

## ListDealerFeedProfilesBySeller
You can execute the `ListDealerFeedProfilesBySeller` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
listDealerFeedProfilesBySeller(vars: ListDealerFeedProfilesBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;

interface ListDealerFeedProfilesBySellerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDealerFeedProfilesBySellerVariables): QueryRef<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;
}
export const listDealerFeedProfilesBySellerRef: ListDealerFeedProfilesBySellerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDealerFeedProfilesBySeller(dc: DataConnect, vars: ListDealerFeedProfilesBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;

interface ListDealerFeedProfilesBySellerRef {
  ...
  (dc: DataConnect, vars: ListDealerFeedProfilesBySellerVariables): QueryRef<ListDealerFeedProfilesBySellerData, ListDealerFeedProfilesBySellerVariables>;
}
export const listDealerFeedProfilesBySellerRef: ListDealerFeedProfilesBySellerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDealerFeedProfilesBySellerRef:
```typescript
const name = listDealerFeedProfilesBySellerRef.operationName;
console.log(name);
```

### Variables
The `ListDealerFeedProfilesBySeller` query requires an argument of type `ListDealerFeedProfilesBySellerVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListDealerFeedProfilesBySellerVariables {
  sellerUid: string;
}
```
### Return Type
Recall that executing the `ListDealerFeedProfilesBySeller` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDealerFeedProfilesBySellerData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListDealerFeedProfilesBySeller`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDealerFeedProfilesBySeller, ListDealerFeedProfilesBySellerVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListDealerFeedProfilesBySeller` query requires an argument of type `ListDealerFeedProfilesBySellerVariables`:
const listDealerFeedProfilesBySellerVars: ListDealerFeedProfilesBySellerVariables = {
  sellerUid: ..., 
};

// Call the `listDealerFeedProfilesBySeller()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDealerFeedProfilesBySeller(listDealerFeedProfilesBySellerVars);
// Variables can be defined inline as well.
const { data } = await listDealerFeedProfilesBySeller({ sellerUid: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDealerFeedProfilesBySeller(dataConnect, listDealerFeedProfilesBySellerVars);

console.log(data.dealerFeedProfiles);

// Or, you can use the `Promise` API.
listDealerFeedProfilesBySeller(listDealerFeedProfilesBySellerVars).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfiles);
});
```

### Using `ListDealerFeedProfilesBySeller`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDealerFeedProfilesBySellerRef, ListDealerFeedProfilesBySellerVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListDealerFeedProfilesBySeller` query requires an argument of type `ListDealerFeedProfilesBySellerVariables`:
const listDealerFeedProfilesBySellerVars: ListDealerFeedProfilesBySellerVariables = {
  sellerUid: ..., 
};

// Call the `listDealerFeedProfilesBySellerRef()` function to get a reference to the query.
const ref = listDealerFeedProfilesBySellerRef(listDealerFeedProfilesBySellerVars);
// Variables can be defined inline as well.
const ref = listDealerFeedProfilesBySellerRef({ sellerUid: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDealerFeedProfilesBySellerRef(dataConnect, listDealerFeedProfilesBySellerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerFeedProfiles);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfiles);
});
```

## ListDealerFeedProfilesByStatus
You can execute the `ListDealerFeedProfilesByStatus` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
listDealerFeedProfilesByStatus(vars: ListDealerFeedProfilesByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;

interface ListDealerFeedProfilesByStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDealerFeedProfilesByStatusVariables): QueryRef<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;
}
export const listDealerFeedProfilesByStatusRef: ListDealerFeedProfilesByStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDealerFeedProfilesByStatus(dc: DataConnect, vars: ListDealerFeedProfilesByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;

interface ListDealerFeedProfilesByStatusRef {
  ...
  (dc: DataConnect, vars: ListDealerFeedProfilesByStatusVariables): QueryRef<ListDealerFeedProfilesByStatusData, ListDealerFeedProfilesByStatusVariables>;
}
export const listDealerFeedProfilesByStatusRef: ListDealerFeedProfilesByStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDealerFeedProfilesByStatusRef:
```typescript
const name = listDealerFeedProfilesByStatusRef.operationName;
console.log(name);
```

### Variables
The `ListDealerFeedProfilesByStatus` query requires an argument of type `ListDealerFeedProfilesByStatusVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListDealerFeedProfilesByStatusVariables {
  status: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListDealerFeedProfilesByStatus` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDealerFeedProfilesByStatusData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListDealerFeedProfilesByStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDealerFeedProfilesByStatus, ListDealerFeedProfilesByStatusVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListDealerFeedProfilesByStatus` query requires an argument of type `ListDealerFeedProfilesByStatusVariables`:
const listDealerFeedProfilesByStatusVars: ListDealerFeedProfilesByStatusVariables = {
  status: ..., 
  limit: ..., // optional
};

// Call the `listDealerFeedProfilesByStatus()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDealerFeedProfilesByStatus(listDealerFeedProfilesByStatusVars);
// Variables can be defined inline as well.
const { data } = await listDealerFeedProfilesByStatus({ status: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDealerFeedProfilesByStatus(dataConnect, listDealerFeedProfilesByStatusVars);

console.log(data.dealerFeedProfiles);

// Or, you can use the `Promise` API.
listDealerFeedProfilesByStatus(listDealerFeedProfilesByStatusVars).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfiles);
});
```

### Using `ListDealerFeedProfilesByStatus`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDealerFeedProfilesByStatusRef, ListDealerFeedProfilesByStatusVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListDealerFeedProfilesByStatus` query requires an argument of type `ListDealerFeedProfilesByStatusVariables`:
const listDealerFeedProfilesByStatusVars: ListDealerFeedProfilesByStatusVariables = {
  status: ..., 
  limit: ..., // optional
};

// Call the `listDealerFeedProfilesByStatusRef()` function to get a reference to the query.
const ref = listDealerFeedProfilesByStatusRef(listDealerFeedProfilesByStatusVars);
// Variables can be defined inline as well.
const ref = listDealerFeedProfilesByStatusRef({ status: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDealerFeedProfilesByStatusRef(dataConnect, listDealerFeedProfilesByStatusVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerFeedProfiles);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfiles);
});
```

## ListDealerListingsByFeed
You can execute the `ListDealerListingsByFeed` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
listDealerListingsByFeed(vars: ListDealerListingsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;

interface ListDealerListingsByFeedRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDealerListingsByFeedVariables): QueryRef<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;
}
export const listDealerListingsByFeedRef: ListDealerListingsByFeedRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDealerListingsByFeed(dc: DataConnect, vars: ListDealerListingsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;

interface ListDealerListingsByFeedRef {
  ...
  (dc: DataConnect, vars: ListDealerListingsByFeedVariables): QueryRef<ListDealerListingsByFeedData, ListDealerListingsByFeedVariables>;
}
export const listDealerListingsByFeedRef: ListDealerListingsByFeedRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDealerListingsByFeedRef:
```typescript
const name = listDealerListingsByFeedRef.operationName;
console.log(name);
```

### Variables
The `ListDealerListingsByFeed` query requires an argument of type `ListDealerListingsByFeedVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListDealerListingsByFeedVariables {
  dealerFeedId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListDealerListingsByFeed` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDealerListingsByFeedData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListDealerListingsByFeed`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDealerListingsByFeed, ListDealerListingsByFeedVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListDealerListingsByFeed` query requires an argument of type `ListDealerListingsByFeedVariables`:
const listDealerListingsByFeedVars: ListDealerListingsByFeedVariables = {
  dealerFeedId: ..., 
  limit: ..., // optional
};

// Call the `listDealerListingsByFeed()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDealerListingsByFeed(listDealerListingsByFeedVars);
// Variables can be defined inline as well.
const { data } = await listDealerListingsByFeed({ dealerFeedId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDealerListingsByFeed(dataConnect, listDealerListingsByFeedVars);

console.log(data.dealerListings);

// Or, you can use the `Promise` API.
listDealerListingsByFeed(listDealerListingsByFeedVars).then((response) => {
  const data = response.data;
  console.log(data.dealerListings);
});
```

### Using `ListDealerListingsByFeed`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDealerListingsByFeedRef, ListDealerListingsByFeedVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListDealerListingsByFeed` query requires an argument of type `ListDealerListingsByFeedVariables`:
const listDealerListingsByFeedVars: ListDealerListingsByFeedVariables = {
  dealerFeedId: ..., 
  limit: ..., // optional
};

// Call the `listDealerListingsByFeedRef()` function to get a reference to the query.
const ref = listDealerListingsByFeedRef(listDealerListingsByFeedVars);
// Variables can be defined inline as well.
const ref = listDealerListingsByFeedRef({ dealerFeedId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDealerListingsByFeedRef(dataConnect, listDealerListingsByFeedVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerListings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerListings);
});
```

## ListDealerListingsBySeller
You can execute the `ListDealerListingsBySeller` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
listDealerListingsBySeller(vars: ListDealerListingsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;

interface ListDealerListingsBySellerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDealerListingsBySellerVariables): QueryRef<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;
}
export const listDealerListingsBySellerRef: ListDealerListingsBySellerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDealerListingsBySeller(dc: DataConnect, vars: ListDealerListingsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;

interface ListDealerListingsBySellerRef {
  ...
  (dc: DataConnect, vars: ListDealerListingsBySellerVariables): QueryRef<ListDealerListingsBySellerData, ListDealerListingsBySellerVariables>;
}
export const listDealerListingsBySellerRef: ListDealerListingsBySellerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDealerListingsBySellerRef:
```typescript
const name = listDealerListingsBySellerRef.operationName;
console.log(name);
```

### Variables
The `ListDealerListingsBySeller` query requires an argument of type `ListDealerListingsBySellerVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListDealerListingsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListDealerListingsBySeller` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDealerListingsBySellerData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListDealerListingsBySeller`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDealerListingsBySeller, ListDealerListingsBySellerVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListDealerListingsBySeller` query requires an argument of type `ListDealerListingsBySellerVariables`:
const listDealerListingsBySellerVars: ListDealerListingsBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listDealerListingsBySeller()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDealerListingsBySeller(listDealerListingsBySellerVars);
// Variables can be defined inline as well.
const { data } = await listDealerListingsBySeller({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDealerListingsBySeller(dataConnect, listDealerListingsBySellerVars);

console.log(data.dealerListings);

// Or, you can use the `Promise` API.
listDealerListingsBySeller(listDealerListingsBySellerVars).then((response) => {
  const data = response.data;
  console.log(data.dealerListings);
});
```

### Using `ListDealerListingsBySeller`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDealerListingsBySellerRef, ListDealerListingsBySellerVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListDealerListingsBySeller` query requires an argument of type `ListDealerListingsBySellerVariables`:
const listDealerListingsBySellerVars: ListDealerListingsBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listDealerListingsBySellerRef()` function to get a reference to the query.
const ref = listDealerListingsBySellerRef(listDealerListingsBySellerVars);
// Variables can be defined inline as well.
const ref = listDealerListingsBySellerRef({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDealerListingsBySellerRef(dataConnect, listDealerListingsBySellerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerListings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerListings);
});
```

## GetDealerListingByHash
You can execute the `GetDealerListingByHash` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
getDealerListingByHash(vars: GetDealerListingByHashVariables, options?: ExecuteQueryOptions): QueryPromise<GetDealerListingByHashData, GetDealerListingByHashVariables>;

interface GetDealerListingByHashRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDealerListingByHashVariables): QueryRef<GetDealerListingByHashData, GetDealerListingByHashVariables>;
}
export const getDealerListingByHashRef: GetDealerListingByHashRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getDealerListingByHash(dc: DataConnect, vars: GetDealerListingByHashVariables, options?: ExecuteQueryOptions): QueryPromise<GetDealerListingByHashData, GetDealerListingByHashVariables>;

interface GetDealerListingByHashRef {
  ...
  (dc: DataConnect, vars: GetDealerListingByHashVariables): QueryRef<GetDealerListingByHashData, GetDealerListingByHashVariables>;
}
export const getDealerListingByHashRef: GetDealerListingByHashRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getDealerListingByHashRef:
```typescript
const name = getDealerListingByHashRef.operationName;
console.log(name);
```

### Variables
The `GetDealerListingByHash` query requires an argument of type `GetDealerListingByHashVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetDealerListingByHashVariables {
  equipmentHash: string;
}
```
### Return Type
Recall that executing the `GetDealerListingByHash` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetDealerListingByHashData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetDealerListingByHash`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getDealerListingByHash, GetDealerListingByHashVariables } from '@dataconnect/generated-timberequip-dealers';

// The `GetDealerListingByHash` query requires an argument of type `GetDealerListingByHashVariables`:
const getDealerListingByHashVars: GetDealerListingByHashVariables = {
  equipmentHash: ..., 
};

// Call the `getDealerListingByHash()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getDealerListingByHash(getDealerListingByHashVars);
// Variables can be defined inline as well.
const { data } = await getDealerListingByHash({ equipmentHash: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getDealerListingByHash(dataConnect, getDealerListingByHashVars);

console.log(data.dealerListings);

// Or, you can use the `Promise` API.
getDealerListingByHash(getDealerListingByHashVars).then((response) => {
  const data = response.data;
  console.log(data.dealerListings);
});
```

### Using `GetDealerListingByHash`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getDealerListingByHashRef, GetDealerListingByHashVariables } from '@dataconnect/generated-timberequip-dealers';

// The `GetDealerListingByHash` query requires an argument of type `GetDealerListingByHashVariables`:
const getDealerListingByHashVars: GetDealerListingByHashVariables = {
  equipmentHash: ..., 
};

// Call the `getDealerListingByHashRef()` function to get a reference to the query.
const ref = getDealerListingByHashRef(getDealerListingByHashVars);
// Variables can be defined inline as well.
const ref = getDealerListingByHashRef({ equipmentHash: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getDealerListingByHashRef(dataConnect, getDealerListingByHashVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerListings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerListings);
});
```

## ListIngestLogsByFeed
You can execute the `ListIngestLogsByFeed` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
listIngestLogsByFeed(vars: ListIngestLogsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;

interface ListIngestLogsByFeedRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListIngestLogsByFeedVariables): QueryRef<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;
}
export const listIngestLogsByFeedRef: ListIngestLogsByFeedRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listIngestLogsByFeed(dc: DataConnect, vars: ListIngestLogsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;

interface ListIngestLogsByFeedRef {
  ...
  (dc: DataConnect, vars: ListIngestLogsByFeedVariables): QueryRef<ListIngestLogsByFeedData, ListIngestLogsByFeedVariables>;
}
export const listIngestLogsByFeedRef: ListIngestLogsByFeedRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listIngestLogsByFeedRef:
```typescript
const name = listIngestLogsByFeedRef.operationName;
console.log(name);
```

### Variables
The `ListIngestLogsByFeed` query requires an argument of type `ListIngestLogsByFeedVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListIngestLogsByFeedVariables {
  feedId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListIngestLogsByFeed` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListIngestLogsByFeedData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListIngestLogsByFeed`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listIngestLogsByFeed, ListIngestLogsByFeedVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListIngestLogsByFeed` query requires an argument of type `ListIngestLogsByFeedVariables`:
const listIngestLogsByFeedVars: ListIngestLogsByFeedVariables = {
  feedId: ..., 
  limit: ..., // optional
};

// Call the `listIngestLogsByFeed()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listIngestLogsByFeed(listIngestLogsByFeedVars);
// Variables can be defined inline as well.
const { data } = await listIngestLogsByFeed({ feedId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listIngestLogsByFeed(dataConnect, listIngestLogsByFeedVars);

console.log(data.dealerFeedIngestLogs);

// Or, you can use the `Promise` API.
listIngestLogsByFeed(listIngestLogsByFeedVars).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedIngestLogs);
});
```

### Using `ListIngestLogsByFeed`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listIngestLogsByFeedRef, ListIngestLogsByFeedVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListIngestLogsByFeed` query requires an argument of type `ListIngestLogsByFeedVariables`:
const listIngestLogsByFeedVars: ListIngestLogsByFeedVariables = {
  feedId: ..., 
  limit: ..., // optional
};

// Call the `listIngestLogsByFeedRef()` function to get a reference to the query.
const ref = listIngestLogsByFeedRef(listIngestLogsByFeedVars);
// Variables can be defined inline as well.
const ref = listIngestLogsByFeedRef({ feedId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listIngestLogsByFeedRef(dataConnect, listIngestLogsByFeedVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerFeedIngestLogs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedIngestLogs);
});
```

## ListIngestLogsBySeller
You can execute the `ListIngestLogsBySeller` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
listIngestLogsBySeller(vars: ListIngestLogsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;

interface ListIngestLogsBySellerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListIngestLogsBySellerVariables): QueryRef<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;
}
export const listIngestLogsBySellerRef: ListIngestLogsBySellerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listIngestLogsBySeller(dc: DataConnect, vars: ListIngestLogsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;

interface ListIngestLogsBySellerRef {
  ...
  (dc: DataConnect, vars: ListIngestLogsBySellerVariables): QueryRef<ListIngestLogsBySellerData, ListIngestLogsBySellerVariables>;
}
export const listIngestLogsBySellerRef: ListIngestLogsBySellerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listIngestLogsBySellerRef:
```typescript
const name = listIngestLogsBySellerRef.operationName;
console.log(name);
```

### Variables
The `ListIngestLogsBySeller` query requires an argument of type `ListIngestLogsBySellerVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListIngestLogsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListIngestLogsBySeller` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListIngestLogsBySellerData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListIngestLogsBySeller`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listIngestLogsBySeller, ListIngestLogsBySellerVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListIngestLogsBySeller` query requires an argument of type `ListIngestLogsBySellerVariables`:
const listIngestLogsBySellerVars: ListIngestLogsBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listIngestLogsBySeller()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listIngestLogsBySeller(listIngestLogsBySellerVars);
// Variables can be defined inline as well.
const { data } = await listIngestLogsBySeller({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listIngestLogsBySeller(dataConnect, listIngestLogsBySellerVars);

console.log(data.dealerFeedIngestLogs);

// Or, you can use the `Promise` API.
listIngestLogsBySeller(listIngestLogsBySellerVars).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedIngestLogs);
});
```

### Using `ListIngestLogsBySeller`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listIngestLogsBySellerRef, ListIngestLogsBySellerVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListIngestLogsBySeller` query requires an argument of type `ListIngestLogsBySellerVariables`:
const listIngestLogsBySellerVars: ListIngestLogsBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listIngestLogsBySellerRef()` function to get a reference to the query.
const ref = listIngestLogsBySellerRef(listIngestLogsBySellerVars);
// Variables can be defined inline as well.
const ref = listIngestLogsBySellerRef({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listIngestLogsBySellerRef(dataConnect, listIngestLogsBySellerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerFeedIngestLogs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedIngestLogs);
});
```

## ListAuditLogsByFeed
You can execute the `ListAuditLogsByFeed` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
listAuditLogsByFeed(vars: ListAuditLogsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;

interface ListAuditLogsByFeedRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListAuditLogsByFeedVariables): QueryRef<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;
}
export const listAuditLogsByFeedRef: ListAuditLogsByFeedRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAuditLogsByFeed(dc: DataConnect, vars: ListAuditLogsByFeedVariables, options?: ExecuteQueryOptions): QueryPromise<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;

interface ListAuditLogsByFeedRef {
  ...
  (dc: DataConnect, vars: ListAuditLogsByFeedVariables): QueryRef<ListAuditLogsByFeedData, ListAuditLogsByFeedVariables>;
}
export const listAuditLogsByFeedRef: ListAuditLogsByFeedRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAuditLogsByFeedRef:
```typescript
const name = listAuditLogsByFeedRef.operationName;
console.log(name);
```

### Variables
The `ListAuditLogsByFeed` query requires an argument of type `ListAuditLogsByFeedVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListAuditLogsByFeedVariables {
  dealerFeedId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListAuditLogsByFeed` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAuditLogsByFeedData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListAuditLogsByFeed`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAuditLogsByFeed, ListAuditLogsByFeedVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListAuditLogsByFeed` query requires an argument of type `ListAuditLogsByFeedVariables`:
const listAuditLogsByFeedVars: ListAuditLogsByFeedVariables = {
  dealerFeedId: ..., 
  limit: ..., // optional
};

// Call the `listAuditLogsByFeed()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAuditLogsByFeed(listAuditLogsByFeedVars);
// Variables can be defined inline as well.
const { data } = await listAuditLogsByFeed({ dealerFeedId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAuditLogsByFeed(dataConnect, listAuditLogsByFeedVars);

console.log(data.dealerAuditLogs);

// Or, you can use the `Promise` API.
listAuditLogsByFeed(listAuditLogsByFeedVars).then((response) => {
  const data = response.data;
  console.log(data.dealerAuditLogs);
});
```

### Using `ListAuditLogsByFeed`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAuditLogsByFeedRef, ListAuditLogsByFeedVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListAuditLogsByFeed` query requires an argument of type `ListAuditLogsByFeedVariables`:
const listAuditLogsByFeedVars: ListAuditLogsByFeedVariables = {
  dealerFeedId: ..., 
  limit: ..., // optional
};

// Call the `listAuditLogsByFeedRef()` function to get a reference to the query.
const ref = listAuditLogsByFeedRef(listAuditLogsByFeedVars);
// Variables can be defined inline as well.
const ref = listAuditLogsByFeedRef({ dealerFeedId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAuditLogsByFeedRef(dataConnect, listAuditLogsByFeedVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerAuditLogs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerAuditLogs);
});
```

## ListWebhooksByDealer
You can execute the `ListWebhooksByDealer` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
listWebhooksByDealer(vars: ListWebhooksByDealerVariables, options?: ExecuteQueryOptions): QueryPromise<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;

interface ListWebhooksByDealerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListWebhooksByDealerVariables): QueryRef<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;
}
export const listWebhooksByDealerRef: ListWebhooksByDealerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listWebhooksByDealer(dc: DataConnect, vars: ListWebhooksByDealerVariables, options?: ExecuteQueryOptions): QueryPromise<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;

interface ListWebhooksByDealerRef {
  ...
  (dc: DataConnect, vars: ListWebhooksByDealerVariables): QueryRef<ListWebhooksByDealerData, ListWebhooksByDealerVariables>;
}
export const listWebhooksByDealerRef: ListWebhooksByDealerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listWebhooksByDealerRef:
```typescript
const name = listWebhooksByDealerRef.operationName;
console.log(name);
```

### Variables
The `ListWebhooksByDealer` query requires an argument of type `ListWebhooksByDealerVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListWebhooksByDealerVariables {
  dealerUid: string;
}
```
### Return Type
Recall that executing the `ListWebhooksByDealer` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListWebhooksByDealerData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListWebhooksByDealer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listWebhooksByDealer, ListWebhooksByDealerVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListWebhooksByDealer` query requires an argument of type `ListWebhooksByDealerVariables`:
const listWebhooksByDealerVars: ListWebhooksByDealerVariables = {
  dealerUid: ..., 
};

// Call the `listWebhooksByDealer()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listWebhooksByDealer(listWebhooksByDealerVars);
// Variables can be defined inline as well.
const { data } = await listWebhooksByDealer({ dealerUid: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listWebhooksByDealer(dataConnect, listWebhooksByDealerVars);

console.log(data.dealerWebhookSubscriptions);

// Or, you can use the `Promise` API.
listWebhooksByDealer(listWebhooksByDealerVars).then((response) => {
  const data = response.data;
  console.log(data.dealerWebhookSubscriptions);
});
```

### Using `ListWebhooksByDealer`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listWebhooksByDealerRef, ListWebhooksByDealerVariables } from '@dataconnect/generated-timberequip-dealers';

// The `ListWebhooksByDealer` query requires an argument of type `ListWebhooksByDealerVariables`:
const listWebhooksByDealerVars: ListWebhooksByDealerVariables = {
  dealerUid: ..., 
};

// Call the `listWebhooksByDealerRef()` function to get a reference to the query.
const ref = listWebhooksByDealerRef(listWebhooksByDealerVars);
// Variables can be defined inline as well.
const ref = listWebhooksByDealerRef({ dealerUid: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listWebhooksByDealerRef(dataConnect, listWebhooksByDealerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerWebhookSubscriptions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerWebhookSubscriptions);
});
```

## GetWidgetConfig
You can execute the `GetWidgetConfig` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
getWidgetConfig(vars: GetWidgetConfigVariables, options?: ExecuteQueryOptions): QueryPromise<GetWidgetConfigData, GetWidgetConfigVariables>;

interface GetWidgetConfigRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetWidgetConfigVariables): QueryRef<GetWidgetConfigData, GetWidgetConfigVariables>;
}
export const getWidgetConfigRef: GetWidgetConfigRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getWidgetConfig(dc: DataConnect, vars: GetWidgetConfigVariables, options?: ExecuteQueryOptions): QueryPromise<GetWidgetConfigData, GetWidgetConfigVariables>;

interface GetWidgetConfigRef {
  ...
  (dc: DataConnect, vars: GetWidgetConfigVariables): QueryRef<GetWidgetConfigData, GetWidgetConfigVariables>;
}
export const getWidgetConfigRef: GetWidgetConfigRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getWidgetConfigRef:
```typescript
const name = getWidgetConfigRef.operationName;
console.log(name);
```

### Variables
The `GetWidgetConfig` query requires an argument of type `GetWidgetConfigVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetWidgetConfigVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetWidgetConfig` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetWidgetConfigData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetWidgetConfig`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getWidgetConfig, GetWidgetConfigVariables } from '@dataconnect/generated-timberequip-dealers';

// The `GetWidgetConfig` query requires an argument of type `GetWidgetConfigVariables`:
const getWidgetConfigVars: GetWidgetConfigVariables = {
  id: ..., 
};

// Call the `getWidgetConfig()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getWidgetConfig(getWidgetConfigVars);
// Variables can be defined inline as well.
const { data } = await getWidgetConfig({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getWidgetConfig(dataConnect, getWidgetConfigVars);

console.log(data.dealerWidgetConfig);

// Or, you can use the `Promise` API.
getWidgetConfig(getWidgetConfigVars).then((response) => {
  const data = response.data;
  console.log(data.dealerWidgetConfig);
});
```

### Using `GetWidgetConfig`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getWidgetConfigRef, GetWidgetConfigVariables } from '@dataconnect/generated-timberequip-dealers';

// The `GetWidgetConfig` query requires an argument of type `GetWidgetConfigVariables`:
const getWidgetConfigVars: GetWidgetConfigVariables = {
  id: ..., 
};

// Call the `getWidgetConfigRef()` function to get a reference to the query.
const ref = getWidgetConfigRef(getWidgetConfigVars);
// Variables can be defined inline as well.
const ref = getWidgetConfigRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getWidgetConfigRef(dataConnect, getWidgetConfigVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dealerWidgetConfig);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerWidgetConfig);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `dealers` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertDealerFeedProfile
You can execute the `UpsertDealerFeedProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
upsertDealerFeedProfile(vars: UpsertDealerFeedProfileVariables): MutationPromise<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;

interface UpsertDealerFeedProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDealerFeedProfileVariables): MutationRef<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;
}
export const upsertDealerFeedProfileRef: UpsertDealerFeedProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertDealerFeedProfile(dc: DataConnect, vars: UpsertDealerFeedProfileVariables): MutationPromise<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;

interface UpsertDealerFeedProfileRef {
  ...
  (dc: DataConnect, vars: UpsertDealerFeedProfileVariables): MutationRef<UpsertDealerFeedProfileData, UpsertDealerFeedProfileVariables>;
}
export const upsertDealerFeedProfileRef: UpsertDealerFeedProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertDealerFeedProfileRef:
```typescript
const name = upsertDealerFeedProfileRef.operationName;
console.log(name);
```

### Variables
The `UpsertDealerFeedProfile` mutation requires an argument of type `UpsertDealerFeedProfileVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertDealerFeedProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertDealerFeedProfileData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertDealerFeedProfileData {
  dealerFeedProfile_upsert: DealerFeedProfile_Key;
}
```
### Using `UpsertDealerFeedProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertDealerFeedProfile, UpsertDealerFeedProfileVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpsertDealerFeedProfile` mutation requires an argument of type `UpsertDealerFeedProfileVariables`:
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

// Call the `upsertDealerFeedProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertDealerFeedProfile(upsertDealerFeedProfileVars);
// Variables can be defined inline as well.
const { data } = await upsertDealerFeedProfile({ id: ..., sellerUid: ..., dealerName: ..., dealerEmail: ..., sourceName: ..., sourceType: ..., rawInput: ..., feedUrl: ..., apiEndpoint: ..., status: ..., syncMode: ..., syncFrequency: ..., nightlySyncEnabled: ..., autoPublish: ..., fieldMapping: ..., apiKeyPreview: ..., totalListingsSynced: ..., totalListingsActive: ..., totalListingsCreated: ..., totalListingsUpdated: ..., totalListingsDeleted: ..., lastSyncAt: ..., nextSyncAt: ..., lastSyncStatus: ..., lastSyncMessage: ..., lastResolvedType: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertDealerFeedProfile(dataConnect, upsertDealerFeedProfileVars);

console.log(data.dealerFeedProfile_upsert);

// Or, you can use the `Promise` API.
upsertDealerFeedProfile(upsertDealerFeedProfileVars).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfile_upsert);
});
```

### Using `UpsertDealerFeedProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertDealerFeedProfileRef, UpsertDealerFeedProfileVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpsertDealerFeedProfile` mutation requires an argument of type `UpsertDealerFeedProfileVariables`:
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

// Call the `upsertDealerFeedProfileRef()` function to get a reference to the mutation.
const ref = upsertDealerFeedProfileRef(upsertDealerFeedProfileVars);
// Variables can be defined inline as well.
const ref = upsertDealerFeedProfileRef({ id: ..., sellerUid: ..., dealerName: ..., dealerEmail: ..., sourceName: ..., sourceType: ..., rawInput: ..., feedUrl: ..., apiEndpoint: ..., status: ..., syncMode: ..., syncFrequency: ..., nightlySyncEnabled: ..., autoPublish: ..., fieldMapping: ..., apiKeyPreview: ..., totalListingsSynced: ..., totalListingsActive: ..., totalListingsCreated: ..., totalListingsUpdated: ..., totalListingsDeleted: ..., lastSyncAt: ..., nextSyncAt: ..., lastSyncStatus: ..., lastSyncMessage: ..., lastResolvedType: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertDealerFeedProfileRef(dataConnect, upsertDealerFeedProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dealerFeedProfile_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfile_upsert);
});
```

## UpdateDealerFeedProfileSyncStats
You can execute the `UpdateDealerFeedProfileSyncStats` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
updateDealerFeedProfileSyncStats(vars: UpdateDealerFeedProfileSyncStatsVariables): MutationPromise<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;

interface UpdateDealerFeedProfileSyncStatsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDealerFeedProfileSyncStatsVariables): MutationRef<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;
}
export const updateDealerFeedProfileSyncStatsRef: UpdateDealerFeedProfileSyncStatsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateDealerFeedProfileSyncStats(dc: DataConnect, vars: UpdateDealerFeedProfileSyncStatsVariables): MutationPromise<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;

interface UpdateDealerFeedProfileSyncStatsRef {
  ...
  (dc: DataConnect, vars: UpdateDealerFeedProfileSyncStatsVariables): MutationRef<UpdateDealerFeedProfileSyncStatsData, UpdateDealerFeedProfileSyncStatsVariables>;
}
export const updateDealerFeedProfileSyncStatsRef: UpdateDealerFeedProfileSyncStatsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateDealerFeedProfileSyncStatsRef:
```typescript
const name = updateDealerFeedProfileSyncStatsRef.operationName;
console.log(name);
```

### Variables
The `UpdateDealerFeedProfileSyncStats` mutation requires an argument of type `UpdateDealerFeedProfileSyncStatsVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateDealerFeedProfileSyncStats` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateDealerFeedProfileSyncStatsData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateDealerFeedProfileSyncStatsData {
  dealerFeedProfile_update?: DealerFeedProfile_Key | null;
}
```
### Using `UpdateDealerFeedProfileSyncStats`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateDealerFeedProfileSyncStats, UpdateDealerFeedProfileSyncStatsVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpdateDealerFeedProfileSyncStats` mutation requires an argument of type `UpdateDealerFeedProfileSyncStatsVariables`:
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

// Call the `updateDealerFeedProfileSyncStats()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateDealerFeedProfileSyncStats(updateDealerFeedProfileSyncStatsVars);
// Variables can be defined inline as well.
const { data } = await updateDealerFeedProfileSyncStats({ id: ..., totalListingsSynced: ..., totalListingsActive: ..., totalListingsCreated: ..., totalListingsUpdated: ..., totalListingsDeleted: ..., lastSyncAt: ..., lastSyncStatus: ..., lastSyncMessage: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateDealerFeedProfileSyncStats(dataConnect, updateDealerFeedProfileSyncStatsVars);

console.log(data.dealerFeedProfile_update);

// Or, you can use the `Promise` API.
updateDealerFeedProfileSyncStats(updateDealerFeedProfileSyncStatsVars).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfile_update);
});
```

### Using `UpdateDealerFeedProfileSyncStats`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateDealerFeedProfileSyncStatsRef, UpdateDealerFeedProfileSyncStatsVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpdateDealerFeedProfileSyncStats` mutation requires an argument of type `UpdateDealerFeedProfileSyncStatsVariables`:
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

// Call the `updateDealerFeedProfileSyncStatsRef()` function to get a reference to the mutation.
const ref = updateDealerFeedProfileSyncStatsRef(updateDealerFeedProfileSyncStatsVars);
// Variables can be defined inline as well.
const ref = updateDealerFeedProfileSyncStatsRef({ id: ..., totalListingsSynced: ..., totalListingsActive: ..., totalListingsCreated: ..., totalListingsUpdated: ..., totalListingsDeleted: ..., lastSyncAt: ..., lastSyncStatus: ..., lastSyncMessage: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateDealerFeedProfileSyncStatsRef(dataConnect, updateDealerFeedProfileSyncStatsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dealerFeedProfile_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedProfile_update);
});
```

## UpsertDealerListing
You can execute the `UpsertDealerListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
upsertDealerListing(vars: UpsertDealerListingVariables): MutationPromise<UpsertDealerListingData, UpsertDealerListingVariables>;

interface UpsertDealerListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDealerListingVariables): MutationRef<UpsertDealerListingData, UpsertDealerListingVariables>;
}
export const upsertDealerListingRef: UpsertDealerListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertDealerListing(dc: DataConnect, vars: UpsertDealerListingVariables): MutationPromise<UpsertDealerListingData, UpsertDealerListingVariables>;

interface UpsertDealerListingRef {
  ...
  (dc: DataConnect, vars: UpsertDealerListingVariables): MutationRef<UpsertDealerListingData, UpsertDealerListingVariables>;
}
export const upsertDealerListingRef: UpsertDealerListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertDealerListingRef:
```typescript
const name = upsertDealerListingRef.operationName;
console.log(name);
```

### Variables
The `UpsertDealerListing` mutation requires an argument of type `UpsertDealerListingVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertDealerListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertDealerListingData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertDealerListingData {
  dealerListing_upsert: DealerListing_Key;
}
```
### Using `UpsertDealerListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertDealerListing, UpsertDealerListingVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpsertDealerListing` mutation requires an argument of type `UpsertDealerListingVariables`:
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

// Call the `upsertDealerListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertDealerListing(upsertDealerListingVars);
// Variables can be defined inline as well.
const { data } = await upsertDealerListing({ id: ..., dealerFeedId: ..., sellerUid: ..., externalListingId: ..., timberequipListingId: ..., equipmentHash: ..., status: ..., dealerSourceUrl: ..., dataSource: ..., externalData: ..., mappedData: ..., syncedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertDealerListing(dataConnect, upsertDealerListingVars);

console.log(data.dealerListing_upsert);

// Or, you can use the `Promise` API.
upsertDealerListing(upsertDealerListingVars).then((response) => {
  const data = response.data;
  console.log(data.dealerListing_upsert);
});
```

### Using `UpsertDealerListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertDealerListingRef, UpsertDealerListingVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpsertDealerListing` mutation requires an argument of type `UpsertDealerListingVariables`:
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

// Call the `upsertDealerListingRef()` function to get a reference to the mutation.
const ref = upsertDealerListingRef(upsertDealerListingVars);
// Variables can be defined inline as well.
const ref = upsertDealerListingRef({ id: ..., dealerFeedId: ..., sellerUid: ..., externalListingId: ..., timberequipListingId: ..., equipmentHash: ..., status: ..., dealerSourceUrl: ..., dataSource: ..., externalData: ..., mappedData: ..., syncedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertDealerListingRef(dataConnect, upsertDealerListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dealerListing_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerListing_upsert);
});
```

## InsertDealerFeedIngestLog
You can execute the `InsertDealerFeedIngestLog` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
insertDealerFeedIngestLog(vars: InsertDealerFeedIngestLogVariables): MutationPromise<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;

interface InsertDealerFeedIngestLogRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertDealerFeedIngestLogVariables): MutationRef<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;
}
export const insertDealerFeedIngestLogRef: InsertDealerFeedIngestLogRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertDealerFeedIngestLog(dc: DataConnect, vars: InsertDealerFeedIngestLogVariables): MutationPromise<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;

interface InsertDealerFeedIngestLogRef {
  ...
  (dc: DataConnect, vars: InsertDealerFeedIngestLogVariables): MutationRef<InsertDealerFeedIngestLogData, InsertDealerFeedIngestLogVariables>;
}
export const insertDealerFeedIngestLogRef: InsertDealerFeedIngestLogRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertDealerFeedIngestLogRef:
```typescript
const name = insertDealerFeedIngestLogRef.operationName;
console.log(name);
```

### Variables
The `InsertDealerFeedIngestLog` mutation requires an argument of type `InsertDealerFeedIngestLogVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `InsertDealerFeedIngestLog` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertDealerFeedIngestLogData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertDealerFeedIngestLogData {
  dealerFeedIngestLog_insert: DealerFeedIngestLog_Key;
}
```
### Using `InsertDealerFeedIngestLog`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertDealerFeedIngestLog, InsertDealerFeedIngestLogVariables } from '@dataconnect/generated-timberequip-dealers';

// The `InsertDealerFeedIngestLog` mutation requires an argument of type `InsertDealerFeedIngestLogVariables`:
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

// Call the `insertDealerFeedIngestLog()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertDealerFeedIngestLog(insertDealerFeedIngestLogVars);
// Variables can be defined inline as well.
const { data } = await insertDealerFeedIngestLog({ id: ..., feedId: ..., sellerUid: ..., actorUid: ..., actorRole: ..., sourceName: ..., totalReceived: ..., processed: ..., created: ..., updated: ..., upserted: ..., skipped: ..., archived: ..., errorCount: ..., errors: ..., dryRun: ..., syncContext: ..., processedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertDealerFeedIngestLog(dataConnect, insertDealerFeedIngestLogVars);

console.log(data.dealerFeedIngestLog_insert);

// Or, you can use the `Promise` API.
insertDealerFeedIngestLog(insertDealerFeedIngestLogVars).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedIngestLog_insert);
});
```

### Using `InsertDealerFeedIngestLog`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertDealerFeedIngestLogRef, InsertDealerFeedIngestLogVariables } from '@dataconnect/generated-timberequip-dealers';

// The `InsertDealerFeedIngestLog` mutation requires an argument of type `InsertDealerFeedIngestLogVariables`:
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

// Call the `insertDealerFeedIngestLogRef()` function to get a reference to the mutation.
const ref = insertDealerFeedIngestLogRef(insertDealerFeedIngestLogVars);
// Variables can be defined inline as well.
const ref = insertDealerFeedIngestLogRef({ id: ..., feedId: ..., sellerUid: ..., actorUid: ..., actorRole: ..., sourceName: ..., totalReceived: ..., processed: ..., created: ..., updated: ..., upserted: ..., skipped: ..., archived: ..., errorCount: ..., errors: ..., dryRun: ..., syncContext: ..., processedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertDealerFeedIngestLogRef(dataConnect, insertDealerFeedIngestLogVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dealerFeedIngestLog_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerFeedIngestLog_insert);
});
```

## InsertDealerAuditLog
You can execute the `InsertDealerAuditLog` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
insertDealerAuditLog(vars: InsertDealerAuditLogVariables): MutationPromise<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;

interface InsertDealerAuditLogRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertDealerAuditLogVariables): MutationRef<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;
}
export const insertDealerAuditLogRef: InsertDealerAuditLogRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertDealerAuditLog(dc: DataConnect, vars: InsertDealerAuditLogVariables): MutationPromise<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;

interface InsertDealerAuditLogRef {
  ...
  (dc: DataConnect, vars: InsertDealerAuditLogVariables): MutationRef<InsertDealerAuditLogData, InsertDealerAuditLogVariables>;
}
export const insertDealerAuditLogRef: InsertDealerAuditLogRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertDealerAuditLogRef:
```typescript
const name = insertDealerAuditLogRef.operationName;
console.log(name);
```

### Variables
The `InsertDealerAuditLog` mutation requires an argument of type `InsertDealerAuditLogVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `InsertDealerAuditLog` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertDealerAuditLogData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertDealerAuditLogData {
  dealerAuditLog_insert: DealerAuditLog_Key;
}
```
### Using `InsertDealerAuditLog`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertDealerAuditLog, InsertDealerAuditLogVariables } from '@dataconnect/generated-timberequip-dealers';

// The `InsertDealerAuditLog` mutation requires an argument of type `InsertDealerAuditLogVariables`:
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

// Call the `insertDealerAuditLog()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertDealerAuditLog(insertDealerAuditLogVars);
// Variables can be defined inline as well.
const { data } = await insertDealerAuditLog({ id: ..., dealerFeedId: ..., sellerUid: ..., action: ..., details: ..., errorMessage: ..., itemsProcessed: ..., itemsSucceeded: ..., itemsFailed: ..., metadata: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertDealerAuditLog(dataConnect, insertDealerAuditLogVars);

console.log(data.dealerAuditLog_insert);

// Or, you can use the `Promise` API.
insertDealerAuditLog(insertDealerAuditLogVars).then((response) => {
  const data = response.data;
  console.log(data.dealerAuditLog_insert);
});
```

### Using `InsertDealerAuditLog`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertDealerAuditLogRef, InsertDealerAuditLogVariables } from '@dataconnect/generated-timberequip-dealers';

// The `InsertDealerAuditLog` mutation requires an argument of type `InsertDealerAuditLogVariables`:
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

// Call the `insertDealerAuditLogRef()` function to get a reference to the mutation.
const ref = insertDealerAuditLogRef(insertDealerAuditLogVars);
// Variables can be defined inline as well.
const ref = insertDealerAuditLogRef({ id: ..., dealerFeedId: ..., sellerUid: ..., action: ..., details: ..., errorMessage: ..., itemsProcessed: ..., itemsSucceeded: ..., itemsFailed: ..., metadata: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertDealerAuditLogRef(dataConnect, insertDealerAuditLogVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dealerAuditLog_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerAuditLog_insert);
});
```

## UpsertDealerWebhookSubscription
You can execute the `UpsertDealerWebhookSubscription` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
upsertDealerWebhookSubscription(vars: UpsertDealerWebhookSubscriptionVariables): MutationPromise<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;

interface UpsertDealerWebhookSubscriptionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDealerWebhookSubscriptionVariables): MutationRef<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;
}
export const upsertDealerWebhookSubscriptionRef: UpsertDealerWebhookSubscriptionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertDealerWebhookSubscription(dc: DataConnect, vars: UpsertDealerWebhookSubscriptionVariables): MutationPromise<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;

interface UpsertDealerWebhookSubscriptionRef {
  ...
  (dc: DataConnect, vars: UpsertDealerWebhookSubscriptionVariables): MutationRef<UpsertDealerWebhookSubscriptionData, UpsertDealerWebhookSubscriptionVariables>;
}
export const upsertDealerWebhookSubscriptionRef: UpsertDealerWebhookSubscriptionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertDealerWebhookSubscriptionRef:
```typescript
const name = upsertDealerWebhookSubscriptionRef.operationName;
console.log(name);
```

### Variables
The `UpsertDealerWebhookSubscription` mutation requires an argument of type `UpsertDealerWebhookSubscriptionVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertDealerWebhookSubscription` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertDealerWebhookSubscriptionData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertDealerWebhookSubscriptionData {
  dealerWebhookSubscription_upsert: DealerWebhookSubscription_Key;
}
```
### Using `UpsertDealerWebhookSubscription`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertDealerWebhookSubscription, UpsertDealerWebhookSubscriptionVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpsertDealerWebhookSubscription` mutation requires an argument of type `UpsertDealerWebhookSubscriptionVariables`:
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

// Call the `upsertDealerWebhookSubscription()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertDealerWebhookSubscription(upsertDealerWebhookSubscriptionVars);
// Variables can be defined inline as well.
const { data } = await upsertDealerWebhookSubscription({ id: ..., dealerUid: ..., callbackUrl: ..., events: ..., active: ..., secretMasked: ..., failureCount: ..., lastDeliveryAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertDealerWebhookSubscription(dataConnect, upsertDealerWebhookSubscriptionVars);

console.log(data.dealerWebhookSubscription_upsert);

// Or, you can use the `Promise` API.
upsertDealerWebhookSubscription(upsertDealerWebhookSubscriptionVars).then((response) => {
  const data = response.data;
  console.log(data.dealerWebhookSubscription_upsert);
});
```

### Using `UpsertDealerWebhookSubscription`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertDealerWebhookSubscriptionRef, UpsertDealerWebhookSubscriptionVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpsertDealerWebhookSubscription` mutation requires an argument of type `UpsertDealerWebhookSubscriptionVariables`:
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

// Call the `upsertDealerWebhookSubscriptionRef()` function to get a reference to the mutation.
const ref = upsertDealerWebhookSubscriptionRef(upsertDealerWebhookSubscriptionVars);
// Variables can be defined inline as well.
const ref = upsertDealerWebhookSubscriptionRef({ id: ..., dealerUid: ..., callbackUrl: ..., events: ..., active: ..., secretMasked: ..., failureCount: ..., lastDeliveryAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertDealerWebhookSubscriptionRef(dataConnect, upsertDealerWebhookSubscriptionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dealerWebhookSubscription_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerWebhookSubscription_upsert);
});
```

## UpsertDealerWidgetConfig
You can execute the `UpsertDealerWidgetConfig` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dealers/index.d.ts](./index.d.ts):
```typescript
upsertDealerWidgetConfig(vars: UpsertDealerWidgetConfigVariables): MutationPromise<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;

interface UpsertDealerWidgetConfigRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertDealerWidgetConfigVariables): MutationRef<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;
}
export const upsertDealerWidgetConfigRef: UpsertDealerWidgetConfigRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertDealerWidgetConfig(dc: DataConnect, vars: UpsertDealerWidgetConfigVariables): MutationPromise<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;

interface UpsertDealerWidgetConfigRef {
  ...
  (dc: DataConnect, vars: UpsertDealerWidgetConfigVariables): MutationRef<UpsertDealerWidgetConfigData, UpsertDealerWidgetConfigVariables>;
}
export const upsertDealerWidgetConfigRef: UpsertDealerWidgetConfigRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertDealerWidgetConfigRef:
```typescript
const name = upsertDealerWidgetConfigRef.operationName;
console.log(name);
```

### Variables
The `UpsertDealerWidgetConfig` mutation requires an argument of type `UpsertDealerWidgetConfigVariables`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertDealerWidgetConfig` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertDealerWidgetConfigData`, which is defined in [dealers/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertDealerWidgetConfigData {
  dealerWidgetConfig_upsert: DealerWidgetConfig_Key;
}
```
### Using `UpsertDealerWidgetConfig`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertDealerWidgetConfig, UpsertDealerWidgetConfigVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpsertDealerWidgetConfig` mutation requires an argument of type `UpsertDealerWidgetConfigVariables`:
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

// Call the `upsertDealerWidgetConfig()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertDealerWidgetConfig(upsertDealerWidgetConfigVars);
// Variables can be defined inline as well.
const { data } = await upsertDealerWidgetConfig({ id: ..., cardStyle: ..., accentColor: ..., fontFamily: ..., darkMode: ..., showInquiry: ..., showCall: ..., showDetails: ..., pageSize: ..., customCss: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertDealerWidgetConfig(dataConnect, upsertDealerWidgetConfigVars);

console.log(data.dealerWidgetConfig_upsert);

// Or, you can use the `Promise` API.
upsertDealerWidgetConfig(upsertDealerWidgetConfigVars).then((response) => {
  const data = response.data;
  console.log(data.dealerWidgetConfig_upsert);
});
```

### Using `UpsertDealerWidgetConfig`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertDealerWidgetConfigRef, UpsertDealerWidgetConfigVariables } from '@dataconnect/generated-timberequip-dealers';

// The `UpsertDealerWidgetConfig` mutation requires an argument of type `UpsertDealerWidgetConfigVariables`:
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

// Call the `upsertDealerWidgetConfigRef()` function to get a reference to the mutation.
const ref = upsertDealerWidgetConfigRef(upsertDealerWidgetConfigVars);
// Variables can be defined inline as well.
const ref = upsertDealerWidgetConfigRef({ id: ..., cardStyle: ..., accentColor: ..., fontFamily: ..., darkMode: ..., showInquiry: ..., showCall: ..., showDetails: ..., pageSize: ..., customCss: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertDealerWidgetConfigRef(dataConnect, upsertDealerWidgetConfigVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.dealerWidgetConfig_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.dealerWidgetConfig_upsert);
});
```

