# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `listing-governance`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`listing-governance/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetListingGovernance*](#getlistinggovernance)
  - [*ListLifecycleQueue*](#listlifecyclequeue)
  - [*ListListingTransitions*](#listlistingtransitions)
  - [*ListOpenListingAnomalies*](#listopenlistinganomalies)
  - [*FindListingByFirestoreId*](#findlistingbyfirestoreid)
- [**Mutations**](#mutations)
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
  - [*InsertListingShadow*](#insertlistingshadow)
  - [*UpdateListingShadow*](#updatelistingshadow)
  - [*DeleteListingShadow*](#deletelistingshadow)
  - [*RecordListingStateTransition*](#recordlistingstatetransition)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `listing-governance`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-listing-governance` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-listing-governance';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-listing-governance';

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

Below are examples of how to use the `listing-governance` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetListingGovernance
You can execute the `GetListingGovernance` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
getListingGovernance(vars: GetListingGovernanceVariables, options?: ExecuteQueryOptions): QueryPromise<GetListingGovernanceData, GetListingGovernanceVariables>;

interface GetListingGovernanceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetListingGovernanceVariables): QueryRef<GetListingGovernanceData, GetListingGovernanceVariables>;
}
export const getListingGovernanceRef: GetListingGovernanceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getListingGovernance(dc: DataConnect, vars: GetListingGovernanceVariables, options?: ExecuteQueryOptions): QueryPromise<GetListingGovernanceData, GetListingGovernanceVariables>;

interface GetListingGovernanceRef {
  ...
  (dc: DataConnect, vars: GetListingGovernanceVariables): QueryRef<GetListingGovernanceData, GetListingGovernanceVariables>;
}
export const getListingGovernanceRef: GetListingGovernanceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getListingGovernanceRef:
```typescript
const name = getListingGovernanceRef.operationName;
console.log(name);
```

### Variables
The `GetListingGovernance` query requires an argument of type `GetListingGovernanceVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetListingGovernanceVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetListingGovernance` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetListingGovernanceData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetListingGovernance`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getListingGovernance, GetListingGovernanceVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `GetListingGovernance` query requires an argument of type `GetListingGovernanceVariables`:
const getListingGovernanceVars: GetListingGovernanceVariables = {
  id: ..., 
};

// Call the `getListingGovernance()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getListingGovernance(getListingGovernanceVars);
// Variables can be defined inline as well.
const { data } = await getListingGovernance({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getListingGovernance(dataConnect, getListingGovernanceVars);

console.log(data.listing);

// Or, you can use the `Promise` API.
getListingGovernance(getListingGovernanceVars).then((response) => {
  const data = response.data;
  console.log(data.listing);
});
```

### Using `GetListingGovernance`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getListingGovernanceRef, GetListingGovernanceVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `GetListingGovernance` query requires an argument of type `GetListingGovernanceVariables`:
const getListingGovernanceVars: GetListingGovernanceVariables = {
  id: ..., 
};

// Call the `getListingGovernanceRef()` function to get a reference to the query.
const ref = getListingGovernanceRef(getListingGovernanceVars);
// Variables can be defined inline as well.
const ref = getListingGovernanceRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getListingGovernanceRef(dataConnect, getListingGovernanceVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.listing);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.listing);
});
```

## ListLifecycleQueue
You can execute the `ListLifecycleQueue` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
listLifecycleQueue(vars: ListLifecycleQueueVariables, options?: ExecuteQueryOptions): QueryPromise<ListLifecycleQueueData, ListLifecycleQueueVariables>;

interface ListLifecycleQueueRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListLifecycleQueueVariables): QueryRef<ListLifecycleQueueData, ListLifecycleQueueVariables>;
}
export const listLifecycleQueueRef: ListLifecycleQueueRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listLifecycleQueue(dc: DataConnect, vars: ListLifecycleQueueVariables, options?: ExecuteQueryOptions): QueryPromise<ListLifecycleQueueData, ListLifecycleQueueVariables>;

interface ListLifecycleQueueRef {
  ...
  (dc: DataConnect, vars: ListLifecycleQueueVariables): QueryRef<ListLifecycleQueueData, ListLifecycleQueueVariables>;
}
export const listLifecycleQueueRef: ListLifecycleQueueRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listLifecycleQueueRef:
```typescript
const name = listLifecycleQueueRef.operationName;
console.log(name);
```

### Variables
The `ListLifecycleQueue` query requires an argument of type `ListLifecycleQueueVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListLifecycleQueueVariables {
  lifecycleStates: string[];
  limit?: number;
}
```
### Return Type
Recall that executing the `ListLifecycleQueue` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListLifecycleQueueData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListLifecycleQueue`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listLifecycleQueue, ListLifecycleQueueVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ListLifecycleQueue` query requires an argument of type `ListLifecycleQueueVariables`:
const listLifecycleQueueVars: ListLifecycleQueueVariables = {
  lifecycleStates: ..., 
  limit: ..., // optional
};

// Call the `listLifecycleQueue()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listLifecycleQueue(listLifecycleQueueVars);
// Variables can be defined inline as well.
const { data } = await listLifecycleQueue({ lifecycleStates: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listLifecycleQueue(dataConnect, listLifecycleQueueVars);

console.log(data.listings);

// Or, you can use the `Promise` API.
listLifecycleQueue(listLifecycleQueueVars).then((response) => {
  const data = response.data;
  console.log(data.listings);
});
```

### Using `ListLifecycleQueue`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listLifecycleQueueRef, ListLifecycleQueueVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ListLifecycleQueue` query requires an argument of type `ListLifecycleQueueVariables`:
const listLifecycleQueueVars: ListLifecycleQueueVariables = {
  lifecycleStates: ..., 
  limit: ..., // optional
};

// Call the `listLifecycleQueueRef()` function to get a reference to the query.
const ref = listLifecycleQueueRef(listLifecycleQueueVars);
// Variables can be defined inline as well.
const ref = listLifecycleQueueRef({ lifecycleStates: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listLifecycleQueueRef(dataConnect, listLifecycleQueueVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.listings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.listings);
});
```

## ListListingTransitions
You can execute the `ListListingTransitions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
listListingTransitions(vars: ListListingTransitionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListListingTransitionsData, ListListingTransitionsVariables>;

interface ListListingTransitionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListListingTransitionsVariables): QueryRef<ListListingTransitionsData, ListListingTransitionsVariables>;
}
export const listListingTransitionsRef: ListListingTransitionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listListingTransitions(dc: DataConnect, vars: ListListingTransitionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListListingTransitionsData, ListListingTransitionsVariables>;

interface ListListingTransitionsRef {
  ...
  (dc: DataConnect, vars: ListListingTransitionsVariables): QueryRef<ListListingTransitionsData, ListListingTransitionsVariables>;
}
export const listListingTransitionsRef: ListListingTransitionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listListingTransitionsRef:
```typescript
const name = listListingTransitionsRef.operationName;
console.log(name);
```

### Variables
The `ListListingTransitions` query requires an argument of type `ListListingTransitionsVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListListingTransitionsVariables {
  listingId: UUIDString;
  limit?: number;
}
```
### Return Type
Recall that executing the `ListListingTransitions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListListingTransitionsData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListListingTransitions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listListingTransitions, ListListingTransitionsVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ListListingTransitions` query requires an argument of type `ListListingTransitionsVariables`:
const listListingTransitionsVars: ListListingTransitionsVariables = {
  listingId: ..., 
  limit: ..., // optional
};

// Call the `listListingTransitions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listListingTransitions(listListingTransitionsVars);
// Variables can be defined inline as well.
const { data } = await listListingTransitions({ listingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listListingTransitions(dataConnect, listListingTransitionsVars);

console.log(data.listingStateTransitions);

// Or, you can use the `Promise` API.
listListingTransitions(listListingTransitionsVars).then((response) => {
  const data = response.data;
  console.log(data.listingStateTransitions);
});
```

### Using `ListListingTransitions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listListingTransitionsRef, ListListingTransitionsVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ListListingTransitions` query requires an argument of type `ListListingTransitionsVariables`:
const listListingTransitionsVars: ListListingTransitionsVariables = {
  listingId: ..., 
  limit: ..., // optional
};

// Call the `listListingTransitionsRef()` function to get a reference to the query.
const ref = listListingTransitionsRef(listListingTransitionsVars);
// Variables can be defined inline as well.
const ref = listListingTransitionsRef({ listingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listListingTransitionsRef(dataConnect, listListingTransitionsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.listingStateTransitions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.listingStateTransitions);
});
```

## ListOpenListingAnomalies
You can execute the `ListOpenListingAnomalies` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
listOpenListingAnomalies(vars: ListOpenListingAnomaliesVariables, options?: ExecuteQueryOptions): QueryPromise<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;

interface ListOpenListingAnomaliesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListOpenListingAnomaliesVariables): QueryRef<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;
}
export const listOpenListingAnomaliesRef: ListOpenListingAnomaliesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listOpenListingAnomalies(dc: DataConnect, vars: ListOpenListingAnomaliesVariables, options?: ExecuteQueryOptions): QueryPromise<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;

interface ListOpenListingAnomaliesRef {
  ...
  (dc: DataConnect, vars: ListOpenListingAnomaliesVariables): QueryRef<ListOpenListingAnomaliesData, ListOpenListingAnomaliesVariables>;
}
export const listOpenListingAnomaliesRef: ListOpenListingAnomaliesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listOpenListingAnomaliesRef:
```typescript
const name = listOpenListingAnomaliesRef.operationName;
console.log(name);
```

### Variables
The `ListOpenListingAnomalies` query requires an argument of type `ListOpenListingAnomaliesVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListOpenListingAnomaliesVariables {
  listingId: UUIDString;
  limit?: number;
}
```
### Return Type
Recall that executing the `ListOpenListingAnomalies` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListOpenListingAnomaliesData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListOpenListingAnomalies`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listOpenListingAnomalies, ListOpenListingAnomaliesVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ListOpenListingAnomalies` query requires an argument of type `ListOpenListingAnomaliesVariables`:
const listOpenListingAnomaliesVars: ListOpenListingAnomaliesVariables = {
  listingId: ..., 
  limit: ..., // optional
};

// Call the `listOpenListingAnomalies()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listOpenListingAnomalies(listOpenListingAnomaliesVars);
// Variables can be defined inline as well.
const { data } = await listOpenListingAnomalies({ listingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listOpenListingAnomalies(dataConnect, listOpenListingAnomaliesVars);

console.log(data.listingAnomalies);

// Or, you can use the `Promise` API.
listOpenListingAnomalies(listOpenListingAnomaliesVars).then((response) => {
  const data = response.data;
  console.log(data.listingAnomalies);
});
```

### Using `ListOpenListingAnomalies`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listOpenListingAnomaliesRef, ListOpenListingAnomaliesVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ListOpenListingAnomalies` query requires an argument of type `ListOpenListingAnomaliesVariables`:
const listOpenListingAnomaliesVars: ListOpenListingAnomaliesVariables = {
  listingId: ..., 
  limit: ..., // optional
};

// Call the `listOpenListingAnomaliesRef()` function to get a reference to the query.
const ref = listOpenListingAnomaliesRef(listOpenListingAnomaliesVars);
// Variables can be defined inline as well.
const ref = listOpenListingAnomaliesRef({ listingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listOpenListingAnomaliesRef(dataConnect, listOpenListingAnomaliesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.listingAnomalies);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.listingAnomalies);
});
```

## FindListingByFirestoreId
You can execute the `FindListingByFirestoreId` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
findListingByFirestoreId(vars: FindListingByFirestoreIdVariables, options?: ExecuteQueryOptions): QueryPromise<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;

interface FindListingByFirestoreIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: FindListingByFirestoreIdVariables): QueryRef<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;
}
export const findListingByFirestoreIdRef: FindListingByFirestoreIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
findListingByFirestoreId(dc: DataConnect, vars: FindListingByFirestoreIdVariables, options?: ExecuteQueryOptions): QueryPromise<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;

interface FindListingByFirestoreIdRef {
  ...
  (dc: DataConnect, vars: FindListingByFirestoreIdVariables): QueryRef<FindListingByFirestoreIdData, FindListingByFirestoreIdVariables>;
}
export const findListingByFirestoreIdRef: FindListingByFirestoreIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the findListingByFirestoreIdRef:
```typescript
const name = findListingByFirestoreIdRef.operationName;
console.log(name);
```

### Variables
The `FindListingByFirestoreId` query requires an argument of type `FindListingByFirestoreIdVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface FindListingByFirestoreIdVariables {
  legacyFirestoreId: string;
}
```
### Return Type
Recall that executing the `FindListingByFirestoreId` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `FindListingByFirestoreIdData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `FindListingByFirestoreId`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, findListingByFirestoreId, FindListingByFirestoreIdVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `FindListingByFirestoreId` query requires an argument of type `FindListingByFirestoreIdVariables`:
const findListingByFirestoreIdVars: FindListingByFirestoreIdVariables = {
  legacyFirestoreId: ..., 
};

// Call the `findListingByFirestoreId()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await findListingByFirestoreId(findListingByFirestoreIdVars);
// Variables can be defined inline as well.
const { data } = await findListingByFirestoreId({ legacyFirestoreId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await findListingByFirestoreId(dataConnect, findListingByFirestoreIdVars);

console.log(data.listings);

// Or, you can use the `Promise` API.
findListingByFirestoreId(findListingByFirestoreIdVars).then((response) => {
  const data = response.data;
  console.log(data.listings);
});
```

### Using `FindListingByFirestoreId`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, findListingByFirestoreIdRef, FindListingByFirestoreIdVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `FindListingByFirestoreId` query requires an argument of type `FindListingByFirestoreIdVariables`:
const findListingByFirestoreIdVars: FindListingByFirestoreIdVariables = {
  legacyFirestoreId: ..., 
};

// Call the `findListingByFirestoreIdRef()` function to get a reference to the query.
const ref = findListingByFirestoreIdRef(findListingByFirestoreIdVars);
// Variables can be defined inline as well.
const ref = findListingByFirestoreIdRef({ legacyFirestoreId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = findListingByFirestoreIdRef(dataConnect, findListingByFirestoreIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.listings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.listings);
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

Below are examples of how to use the `listing-governance` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## SubmitListing
You can execute the `SubmitListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
submitListing(vars: SubmitListingVariables): MutationPromise<SubmitListingData, SubmitListingVariables>;

interface SubmitListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitListingVariables): MutationRef<SubmitListingData, SubmitListingVariables>;
}
export const submitListingRef: SubmitListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
submitListing(dc: DataConnect, vars: SubmitListingVariables): MutationPromise<SubmitListingData, SubmitListingVariables>;

interface SubmitListingRef {
  ...
  (dc: DataConnect, vars: SubmitListingVariables): MutationRef<SubmitListingData, SubmitListingVariables>;
}
export const submitListingRef: SubmitListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the submitListingRef:
```typescript
const name = submitListingRef.operationName;
console.log(name);
```

### Variables
The `SubmitListing` mutation requires an argument of type `SubmitListingVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SubmitListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that executing the `SubmitListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SubmitListingData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SubmitListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `SubmitListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, submitListing, SubmitListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `SubmitListing` mutation requires an argument of type `SubmitListingVariables`:
const submitListingVars: SubmitListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonNote: ..., // optional
};

// Call the `submitListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await submitListing(submitListingVars);
// Variables can be defined inline as well.
const { data } = await submitListing({ id: ..., actorId: ..., requestId: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await submitListing(dataConnect, submitListingVars);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
submitListing(submitListingVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

### Using `SubmitListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, submitListingRef, SubmitListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `SubmitListing` mutation requires an argument of type `SubmitListingVariables`:
const submitListingVars: SubmitListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonNote: ..., // optional
};

// Call the `submitListingRef()` function to get a reference to the mutation.
const ref = submitListingRef(submitListingVars);
// Variables can be defined inline as well.
const ref = submitListingRef({ id: ..., actorId: ..., requestId: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = submitListingRef(dataConnect, submitListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

## ApproveListing
You can execute the `ApproveListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
approveListing(vars: ApproveListingVariables): MutationPromise<ApproveListingData, ApproveListingVariables>;

interface ApproveListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ApproveListingVariables): MutationRef<ApproveListingData, ApproveListingVariables>;
}
export const approveListingRef: ApproveListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
approveListing(dc: DataConnect, vars: ApproveListingVariables): MutationPromise<ApproveListingData, ApproveListingVariables>;

interface ApproveListingRef {
  ...
  (dc: DataConnect, vars: ApproveListingVariables): MutationRef<ApproveListingData, ApproveListingVariables>;
}
export const approveListingRef: ApproveListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the approveListingRef:
```typescript
const name = approveListingRef.operationName;
console.log(name);
```

### Variables
The `ApproveListing` mutation requires an argument of type `ApproveListingVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ApproveListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that executing the `ApproveListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ApproveListingData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ApproveListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `ApproveListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, approveListing, ApproveListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ApproveListing` mutation requires an argument of type `ApproveListingVariables`:
const approveListingVars: ApproveListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., // optional
  reasonNote: ..., // optional
};

// Call the `approveListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await approveListing(approveListingVars);
// Variables can be defined inline as well.
const { data } = await approveListing({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await approveListing(dataConnect, approveListingVars);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
approveListing(approveListingVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

### Using `ApproveListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, approveListingRef, ApproveListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ApproveListing` mutation requires an argument of type `ApproveListingVariables`:
const approveListingVars: ApproveListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., // optional
  reasonNote: ..., // optional
};

// Call the `approveListingRef()` function to get a reference to the mutation.
const ref = approveListingRef(approveListingVars);
// Variables can be defined inline as well.
const ref = approveListingRef({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = approveListingRef(dataConnect, approveListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

## RejectListing
You can execute the `RejectListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
rejectListing(vars: RejectListingVariables): MutationPromise<RejectListingData, RejectListingVariables>;

interface RejectListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RejectListingVariables): MutationRef<RejectListingData, RejectListingVariables>;
}
export const rejectListingRef: RejectListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
rejectListing(dc: DataConnect, vars: RejectListingVariables): MutationPromise<RejectListingData, RejectListingVariables>;

interface RejectListingRef {
  ...
  (dc: DataConnect, vars: RejectListingVariables): MutationRef<RejectListingData, RejectListingVariables>;
}
export const rejectListingRef: RejectListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the rejectListingRef:
```typescript
const name = rejectListingRef.operationName;
console.log(name);
```

### Variables
The `RejectListing` mutation requires an argument of type `RejectListingVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RejectListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode: string;
  reasonNote: string;
}
```
### Return Type
Recall that executing the `RejectListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RejectListingData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RejectListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `RejectListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, rejectListing, RejectListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `RejectListing` mutation requires an argument of type `RejectListingVariables`:
const rejectListingVars: RejectListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., 
  reasonNote: ..., 
};

// Call the `rejectListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await rejectListing(rejectListingVars);
// Variables can be defined inline as well.
const { data } = await rejectListing({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await rejectListing(dataConnect, rejectListingVars);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
rejectListing(rejectListingVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

### Using `RejectListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, rejectListingRef, RejectListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `RejectListing` mutation requires an argument of type `RejectListingVariables`:
const rejectListingVars: RejectListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., 
  reasonNote: ..., 
};

// Call the `rejectListingRef()` function to get a reference to the mutation.
const ref = rejectListingRef(rejectListingVars);
// Variables can be defined inline as well.
const ref = rejectListingRef({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = rejectListingRef(dataConnect, rejectListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

## ConfirmListingPayment
You can execute the `ConfirmListingPayment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
confirmListingPayment(vars: ConfirmListingPaymentVariables): MutationPromise<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;

interface ConfirmListingPaymentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ConfirmListingPaymentVariables): MutationRef<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;
}
export const confirmListingPaymentRef: ConfirmListingPaymentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
confirmListingPayment(dc: DataConnect, vars: ConfirmListingPaymentVariables): MutationPromise<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;

interface ConfirmListingPaymentRef {
  ...
  (dc: DataConnect, vars: ConfirmListingPaymentVariables): MutationRef<ConfirmListingPaymentData, ConfirmListingPaymentVariables>;
}
export const confirmListingPaymentRef: ConfirmListingPaymentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the confirmListingPaymentRef:
```typescript
const name = confirmListingPaymentRef.operationName;
console.log(name);
```

### Variables
The `ConfirmListingPayment` mutation requires an argument of type `ConfirmListingPaymentVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ConfirmListingPaymentVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
}
```
### Return Type
Recall that executing the `ConfirmListingPayment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ConfirmListingPaymentData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ConfirmListingPaymentData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `ConfirmListingPayment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, confirmListingPayment, ConfirmListingPaymentVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ConfirmListingPayment` mutation requires an argument of type `ConfirmListingPaymentVariables`:
const confirmListingPaymentVars: ConfirmListingPaymentVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., // optional
};

// Call the `confirmListingPayment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await confirmListingPayment(confirmListingPaymentVars);
// Variables can be defined inline as well.
const { data } = await confirmListingPayment({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await confirmListingPayment(dataConnect, confirmListingPaymentVars);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
confirmListingPayment(confirmListingPaymentVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

### Using `ConfirmListingPayment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, confirmListingPaymentRef, ConfirmListingPaymentVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ConfirmListingPayment` mutation requires an argument of type `ConfirmListingPaymentVariables`:
const confirmListingPaymentVars: ConfirmListingPaymentVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., // optional
};

// Call the `confirmListingPaymentRef()` function to get a reference to the mutation.
const ref = confirmListingPaymentRef(confirmListingPaymentVars);
// Variables can be defined inline as well.
const ref = confirmListingPaymentRef({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = confirmListingPaymentRef(dataConnect, confirmListingPaymentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

## PublishListing
You can execute the `PublishListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
publishListing(vars: PublishListingVariables): MutationPromise<PublishListingData, PublishListingVariables>;

interface PublishListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PublishListingVariables): MutationRef<PublishListingData, PublishListingVariables>;
}
export const publishListingRef: PublishListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
publishListing(dc: DataConnect, vars: PublishListingVariables): MutationPromise<PublishListingData, PublishListingVariables>;

interface PublishListingRef {
  ...
  (dc: DataConnect, vars: PublishListingVariables): MutationRef<PublishListingData, PublishListingVariables>;
}
export const publishListingRef: PublishListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the publishListingRef:
```typescript
const name = publishListingRef.operationName;
console.log(name);
```

### Variables
The `PublishListing` mutation requires an argument of type `PublishListingVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface PublishListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
}
```
### Return Type
Recall that executing the `PublishListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PublishListingData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PublishListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `PublishListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, publishListing, PublishListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `PublishListing` mutation requires an argument of type `PublishListingVariables`:
const publishListingVars: PublishListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
};

// Call the `publishListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await publishListing(publishListingVars);
// Variables can be defined inline as well.
const { data } = await publishListing({ id: ..., actorId: ..., requestId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await publishListing(dataConnect, publishListingVars);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
publishListing(publishListingVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

### Using `PublishListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, publishListingRef, PublishListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `PublishListing` mutation requires an argument of type `PublishListingVariables`:
const publishListingVars: PublishListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
};

// Call the `publishListingRef()` function to get a reference to the mutation.
const ref = publishListingRef(publishListingVars);
// Variables can be defined inline as well.
const ref = publishListingRef({ id: ..., actorId: ..., requestId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = publishListingRef(dataConnect, publishListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

## ExpireListing
You can execute the `ExpireListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
expireListing(vars: ExpireListingVariables): MutationPromise<ExpireListingData, ExpireListingVariables>;

interface ExpireListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ExpireListingVariables): MutationRef<ExpireListingData, ExpireListingVariables>;
}
export const expireListingRef: ExpireListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
expireListing(dc: DataConnect, vars: ExpireListingVariables): MutationPromise<ExpireListingData, ExpireListingVariables>;

interface ExpireListingRef {
  ...
  (dc: DataConnect, vars: ExpireListingVariables): MutationRef<ExpireListingData, ExpireListingVariables>;
}
export const expireListingRef: ExpireListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the expireListingRef:
```typescript
const name = expireListingRef.operationName;
console.log(name);
```

### Variables
The `ExpireListing` mutation requires an argument of type `ExpireListingVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ExpireListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
}
```
### Return Type
Recall that executing the `ExpireListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ExpireListingData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ExpireListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `ExpireListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, expireListing, ExpireListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ExpireListing` mutation requires an argument of type `ExpireListingVariables`:
const expireListingVars: ExpireListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., // optional
};

// Call the `expireListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await expireListing(expireListingVars);
// Variables can be defined inline as well.
const { data } = await expireListing({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await expireListing(dataConnect, expireListingVars);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
expireListing(expireListingVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

### Using `ExpireListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, expireListingRef, ExpireListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ExpireListing` mutation requires an argument of type `ExpireListingVariables`:
const expireListingVars: ExpireListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., // optional
};

// Call the `expireListingRef()` function to get a reference to the mutation.
const ref = expireListingRef(expireListingVars);
// Variables can be defined inline as well.
const ref = expireListingRef({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = expireListingRef(dataConnect, expireListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

## RelistListing
You can execute the `RelistListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
relistListing(vars: RelistListingVariables): MutationPromise<RelistListingData, RelistListingVariables>;

interface RelistListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RelistListingVariables): MutationRef<RelistListingData, RelistListingVariables>;
}
export const relistListingRef: RelistListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
relistListing(dc: DataConnect, vars: RelistListingVariables): MutationPromise<RelistListingData, RelistListingVariables>;

interface RelistListingRef {
  ...
  (dc: DataConnect, vars: RelistListingVariables): MutationRef<RelistListingData, RelistListingVariables>;
}
export const relistListingRef: RelistListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the relistListingRef:
```typescript
const name = relistListingRef.operationName;
console.log(name);
```

### Variables
The `RelistListing` mutation requires an argument of type `RelistListingVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RelistListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that executing the `RelistListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RelistListingData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RelistListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `RelistListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, relistListing, RelistListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `RelistListing` mutation requires an argument of type `RelistListingVariables`:
const relistListingVars: RelistListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonNote: ..., // optional
};

// Call the `relistListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await relistListing(relistListingVars);
// Variables can be defined inline as well.
const { data } = await relistListing({ id: ..., actorId: ..., requestId: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await relistListing(dataConnect, relistListingVars);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
relistListing(relistListingVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

### Using `RelistListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, relistListingRef, RelistListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `RelistListing` mutation requires an argument of type `RelistListingVariables`:
const relistListingVars: RelistListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonNote: ..., // optional
};

// Call the `relistListingRef()` function to get a reference to the mutation.
const ref = relistListingRef(relistListingVars);
// Variables can be defined inline as well.
const ref = relistListingRef({ id: ..., actorId: ..., requestId: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = relistListingRef(dataConnect, relistListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

## MarkListingSold
You can execute the `MarkListingSold` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
markListingSold(vars: MarkListingSoldVariables): MutationPromise<MarkListingSoldData, MarkListingSoldVariables>;

interface MarkListingSoldRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkListingSoldVariables): MutationRef<MarkListingSoldData, MarkListingSoldVariables>;
}
export const markListingSoldRef: MarkListingSoldRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
markListingSold(dc: DataConnect, vars: MarkListingSoldVariables): MutationPromise<MarkListingSoldData, MarkListingSoldVariables>;

interface MarkListingSoldRef {
  ...
  (dc: DataConnect, vars: MarkListingSoldVariables): MutationRef<MarkListingSoldData, MarkListingSoldVariables>;
}
export const markListingSoldRef: MarkListingSoldRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the markListingSoldRef:
```typescript
const name = markListingSoldRef.operationName;
console.log(name);
```

### Variables
The `MarkListingSold` mutation requires an argument of type `MarkListingSoldVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MarkListingSoldVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that executing the `MarkListingSold` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MarkListingSoldData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface MarkListingSoldData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `MarkListingSold`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, markListingSold, MarkListingSoldVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `MarkListingSold` mutation requires an argument of type `MarkListingSoldVariables`:
const markListingSoldVars: MarkListingSoldVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonNote: ..., // optional
};

// Call the `markListingSold()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await markListingSold(markListingSoldVars);
// Variables can be defined inline as well.
const { data } = await markListingSold({ id: ..., actorId: ..., requestId: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await markListingSold(dataConnect, markListingSoldVars);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
markListingSold(markListingSoldVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

### Using `MarkListingSold`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, markListingSoldRef, MarkListingSoldVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `MarkListingSold` mutation requires an argument of type `MarkListingSoldVariables`:
const markListingSoldVars: MarkListingSoldVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonNote: ..., // optional
};

// Call the `markListingSoldRef()` function to get a reference to the mutation.
const ref = markListingSoldRef(markListingSoldVars);
// Variables can be defined inline as well.
const ref = markListingSoldRef({ id: ..., actorId: ..., requestId: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = markListingSoldRef(dataConnect, markListingSoldVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

## ArchiveListing
You can execute the `ArchiveListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
archiveListing(vars: ArchiveListingVariables): MutationPromise<ArchiveListingData, ArchiveListingVariables>;

interface ArchiveListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveListingVariables): MutationRef<ArchiveListingData, ArchiveListingVariables>;
}
export const archiveListingRef: ArchiveListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
archiveListing(dc: DataConnect, vars: ArchiveListingVariables): MutationPromise<ArchiveListingData, ArchiveListingVariables>;

interface ArchiveListingRef {
  ...
  (dc: DataConnect, vars: ArchiveListingVariables): MutationRef<ArchiveListingData, ArchiveListingVariables>;
}
export const archiveListingRef: ArchiveListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the archiveListingRef:
```typescript
const name = archiveListingRef.operationName;
console.log(name);
```

### Variables
The `ArchiveListing` mutation requires an argument of type `ArchiveListingVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ArchiveListingVariables {
  id: UUIDString;
  actorId?: string | null;
  requestId?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
}
```
### Return Type
Recall that executing the `ArchiveListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ArchiveListingData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ArchiveListingData {
  query?: {
  };
    listing_update?: Listing_Key | null;
    listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `ArchiveListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, archiveListing, ArchiveListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ArchiveListing` mutation requires an argument of type `ArchiveListingVariables`:
const archiveListingVars: ArchiveListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., // optional
  reasonNote: ..., // optional
};

// Call the `archiveListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await archiveListing(archiveListingVars);
// Variables can be defined inline as well.
const { data } = await archiveListing({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await archiveListing(dataConnect, archiveListingVars);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
archiveListing(archiveListingVars).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

### Using `ArchiveListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, archiveListingRef, ArchiveListingVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ArchiveListing` mutation requires an argument of type `ArchiveListingVariables`:
const archiveListingVars: ArchiveListingVariables = {
  id: ..., 
  actorId: ..., // optional
  requestId: ..., // optional
  reasonCode: ..., // optional
  reasonNote: ..., // optional
};

// Call the `archiveListingRef()` function to get a reference to the mutation.
const ref = archiveListingRef(archiveListingVars);
// Variables can be defined inline as well.
const ref = archiveListingRef({ id: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = archiveListingRef(dataConnect, archiveListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.query);
console.log(data.listing_update);
console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.query);
  console.log(data.listing_update);
  console.log(data.listingStateTransition_insert);
});
```

## ResolveListingAnomaly
You can execute the `ResolveListingAnomaly` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
resolveListingAnomaly(vars: ResolveListingAnomalyVariables): MutationPromise<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;

interface ResolveListingAnomalyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ResolveListingAnomalyVariables): MutationRef<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;
}
export const resolveListingAnomalyRef: ResolveListingAnomalyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
resolveListingAnomaly(dc: DataConnect, vars: ResolveListingAnomalyVariables): MutationPromise<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;

interface ResolveListingAnomalyRef {
  ...
  (dc: DataConnect, vars: ResolveListingAnomalyVariables): MutationRef<ResolveListingAnomalyData, ResolveListingAnomalyVariables>;
}
export const resolveListingAnomalyRef: ResolveListingAnomalyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the resolveListingAnomalyRef:
```typescript
const name = resolveListingAnomalyRef.operationName;
console.log(name);
```

### Variables
The `ResolveListingAnomaly` mutation requires an argument of type `ResolveListingAnomalyVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ResolveListingAnomalyVariables {
  id: UUIDString;
  resolutionNote: string;
}
```
### Return Type
Recall that executing the `ResolveListingAnomaly` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ResolveListingAnomalyData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ResolveListingAnomalyData {
  listingAnomaly_update?: ListingAnomaly_Key | null;
}
```
### Using `ResolveListingAnomaly`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, resolveListingAnomaly, ResolveListingAnomalyVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ResolveListingAnomaly` mutation requires an argument of type `ResolveListingAnomalyVariables`:
const resolveListingAnomalyVars: ResolveListingAnomalyVariables = {
  id: ..., 
  resolutionNote: ..., 
};

// Call the `resolveListingAnomaly()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await resolveListingAnomaly(resolveListingAnomalyVars);
// Variables can be defined inline as well.
const { data } = await resolveListingAnomaly({ id: ..., resolutionNote: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await resolveListingAnomaly(dataConnect, resolveListingAnomalyVars);

console.log(data.listingAnomaly_update);

// Or, you can use the `Promise` API.
resolveListingAnomaly(resolveListingAnomalyVars).then((response) => {
  const data = response.data;
  console.log(data.listingAnomaly_update);
});
```

### Using `ResolveListingAnomaly`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, resolveListingAnomalyRef, ResolveListingAnomalyVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `ResolveListingAnomaly` mutation requires an argument of type `ResolveListingAnomalyVariables`:
const resolveListingAnomalyVars: ResolveListingAnomalyVariables = {
  id: ..., 
  resolutionNote: ..., 
};

// Call the `resolveListingAnomalyRef()` function to get a reference to the mutation.
const ref = resolveListingAnomalyRef(resolveListingAnomalyVars);
// Variables can be defined inline as well.
const ref = resolveListingAnomalyRef({ id: ..., resolutionNote: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = resolveListingAnomalyRef(dataConnect, resolveListingAnomalyVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.listingAnomaly_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.listingAnomaly_update);
});
```

## InsertListingShadow
You can execute the `InsertListingShadow` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
insertListingShadow(vars: InsertListingShadowVariables): MutationPromise<InsertListingShadowData, InsertListingShadowVariables>;

interface InsertListingShadowRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertListingShadowVariables): MutationRef<InsertListingShadowData, InsertListingShadowVariables>;
}
export const insertListingShadowRef: InsertListingShadowRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertListingShadow(dc: DataConnect, vars: InsertListingShadowVariables): MutationPromise<InsertListingShadowData, InsertListingShadowVariables>;

interface InsertListingShadowRef {
  ...
  (dc: DataConnect, vars: InsertListingShadowVariables): MutationRef<InsertListingShadowData, InsertListingShadowVariables>;
}
export const insertListingShadowRef: InsertListingShadowRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertListingShadowRef:
```typescript
const name = insertListingShadowRef.operationName;
console.log(name);
```

### Variables
The `InsertListingShadow` mutation requires an argument of type `InsertListingShadowVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `InsertListingShadow` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertListingShadowData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertListingShadowData {
  listing_insert: Listing_Key;
}
```
### Using `InsertListingShadow`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertListingShadow, InsertListingShadowVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `InsertListingShadow` mutation requires an argument of type `InsertListingShadowVariables`:
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

// Call the `insertListingShadow()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertListingShadow(insertListingShadowVars);
// Variables can be defined inline as well.
const { data } = await insertListingShadow({ legacyFirestoreId: ..., sellerPartyId: ..., title: ..., categoryKey: ..., subcategoryKey: ..., manufacturerKey: ..., modelKey: ..., locationText: ..., priceAmount: ..., currencyCode: ..., lifecycleState: ..., reviewState: ..., paymentState: ..., inventoryState: ..., visibilityState: ..., primaryImageUrl: ..., publishedAt: ..., expiresAt: ..., soldAt: ..., sourceSystem: ..., externalSourceName: ..., externalSourceId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertListingShadow(dataConnect, insertListingShadowVars);

console.log(data.listing_insert);

// Or, you can use the `Promise` API.
insertListingShadow(insertListingShadowVars).then((response) => {
  const data = response.data;
  console.log(data.listing_insert);
});
```

### Using `InsertListingShadow`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertListingShadowRef, InsertListingShadowVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `InsertListingShadow` mutation requires an argument of type `InsertListingShadowVariables`:
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

// Call the `insertListingShadowRef()` function to get a reference to the mutation.
const ref = insertListingShadowRef(insertListingShadowVars);
// Variables can be defined inline as well.
const ref = insertListingShadowRef({ legacyFirestoreId: ..., sellerPartyId: ..., title: ..., categoryKey: ..., subcategoryKey: ..., manufacturerKey: ..., modelKey: ..., locationText: ..., priceAmount: ..., currencyCode: ..., lifecycleState: ..., reviewState: ..., paymentState: ..., inventoryState: ..., visibilityState: ..., primaryImageUrl: ..., publishedAt: ..., expiresAt: ..., soldAt: ..., sourceSystem: ..., externalSourceName: ..., externalSourceId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertListingShadowRef(dataConnect, insertListingShadowVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.listing_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.listing_insert);
});
```

## UpdateListingShadow
You can execute the `UpdateListingShadow` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
updateListingShadow(vars: UpdateListingShadowVariables): MutationPromise<UpdateListingShadowData, UpdateListingShadowVariables>;

interface UpdateListingShadowRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateListingShadowVariables): MutationRef<UpdateListingShadowData, UpdateListingShadowVariables>;
}
export const updateListingShadowRef: UpdateListingShadowRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateListingShadow(dc: DataConnect, vars: UpdateListingShadowVariables): MutationPromise<UpdateListingShadowData, UpdateListingShadowVariables>;

interface UpdateListingShadowRef {
  ...
  (dc: DataConnect, vars: UpdateListingShadowVariables): MutationRef<UpdateListingShadowData, UpdateListingShadowVariables>;
}
export const updateListingShadowRef: UpdateListingShadowRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateListingShadowRef:
```typescript
const name = updateListingShadowRef.operationName;
console.log(name);
```

### Variables
The `UpdateListingShadow` mutation requires an argument of type `UpdateListingShadowVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateListingShadow` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateListingShadowData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateListingShadowData {
  listing_update?: Listing_Key | null;
}
```
### Using `UpdateListingShadow`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateListingShadow, UpdateListingShadowVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `UpdateListingShadow` mutation requires an argument of type `UpdateListingShadowVariables`:
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

// Call the `updateListingShadow()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateListingShadow(updateListingShadowVars);
// Variables can be defined inline as well.
const { data } = await updateListingShadow({ id: ..., sellerPartyId: ..., title: ..., categoryKey: ..., subcategoryKey: ..., manufacturerKey: ..., modelKey: ..., locationText: ..., priceAmount: ..., currencyCode: ..., lifecycleState: ..., reviewState: ..., paymentState: ..., inventoryState: ..., visibilityState: ..., primaryImageUrl: ..., publishedAt: ..., expiresAt: ..., soldAt: ..., externalSourceName: ..., externalSourceId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateListingShadow(dataConnect, updateListingShadowVars);

console.log(data.listing_update);

// Or, you can use the `Promise` API.
updateListingShadow(updateListingShadowVars).then((response) => {
  const data = response.data;
  console.log(data.listing_update);
});
```

### Using `UpdateListingShadow`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateListingShadowRef, UpdateListingShadowVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `UpdateListingShadow` mutation requires an argument of type `UpdateListingShadowVariables`:
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

// Call the `updateListingShadowRef()` function to get a reference to the mutation.
const ref = updateListingShadowRef(updateListingShadowVars);
// Variables can be defined inline as well.
const ref = updateListingShadowRef({ id: ..., sellerPartyId: ..., title: ..., categoryKey: ..., subcategoryKey: ..., manufacturerKey: ..., modelKey: ..., locationText: ..., priceAmount: ..., currencyCode: ..., lifecycleState: ..., reviewState: ..., paymentState: ..., inventoryState: ..., visibilityState: ..., primaryImageUrl: ..., publishedAt: ..., expiresAt: ..., soldAt: ..., externalSourceName: ..., externalSourceId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateListingShadowRef(dataConnect, updateListingShadowVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.listing_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.listing_update);
});
```

## DeleteListingShadow
You can execute the `DeleteListingShadow` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
deleteListingShadow(vars: DeleteListingShadowVariables): MutationPromise<DeleteListingShadowData, DeleteListingShadowVariables>;

interface DeleteListingShadowRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteListingShadowVariables): MutationRef<DeleteListingShadowData, DeleteListingShadowVariables>;
}
export const deleteListingShadowRef: DeleteListingShadowRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteListingShadow(dc: DataConnect, vars: DeleteListingShadowVariables): MutationPromise<DeleteListingShadowData, DeleteListingShadowVariables>;

interface DeleteListingShadowRef {
  ...
  (dc: DataConnect, vars: DeleteListingShadowVariables): MutationRef<DeleteListingShadowData, DeleteListingShadowVariables>;
}
export const deleteListingShadowRef: DeleteListingShadowRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteListingShadowRef:
```typescript
const name = deleteListingShadowRef.operationName;
console.log(name);
```

### Variables
The `DeleteListingShadow` mutation requires an argument of type `DeleteListingShadowVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteListingShadowVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteListingShadow` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteListingShadowData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteListingShadowData {
  listing_delete?: Listing_Key | null;
}
```
### Using `DeleteListingShadow`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteListingShadow, DeleteListingShadowVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `DeleteListingShadow` mutation requires an argument of type `DeleteListingShadowVariables`:
const deleteListingShadowVars: DeleteListingShadowVariables = {
  id: ..., 
};

// Call the `deleteListingShadow()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteListingShadow(deleteListingShadowVars);
// Variables can be defined inline as well.
const { data } = await deleteListingShadow({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteListingShadow(dataConnect, deleteListingShadowVars);

console.log(data.listing_delete);

// Or, you can use the `Promise` API.
deleteListingShadow(deleteListingShadowVars).then((response) => {
  const data = response.data;
  console.log(data.listing_delete);
});
```

### Using `DeleteListingShadow`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteListingShadowRef, DeleteListingShadowVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `DeleteListingShadow` mutation requires an argument of type `DeleteListingShadowVariables`:
const deleteListingShadowVars: DeleteListingShadowVariables = {
  id: ..., 
};

// Call the `deleteListingShadowRef()` function to get a reference to the mutation.
const ref = deleteListingShadowRef(deleteListingShadowVars);
// Variables can be defined inline as well.
const ref = deleteListingShadowRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteListingShadowRef(dataConnect, deleteListingShadowVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.listing_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.listing_delete);
});
```

## RecordListingStateTransition
You can execute the `RecordListingStateTransition` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [listing-governance/index.d.ts](./index.d.ts):
```typescript
recordListingStateTransition(vars: RecordListingStateTransitionVariables): MutationPromise<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;

interface RecordListingStateTransitionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RecordListingStateTransitionVariables): MutationRef<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;
}
export const recordListingStateTransitionRef: RecordListingStateTransitionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
recordListingStateTransition(dc: DataConnect, vars: RecordListingStateTransitionVariables): MutationPromise<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;

interface RecordListingStateTransitionRef {
  ...
  (dc: DataConnect, vars: RecordListingStateTransitionVariables): MutationRef<RecordListingStateTransitionData, RecordListingStateTransitionVariables>;
}
export const recordListingStateTransitionRef: RecordListingStateTransitionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the recordListingStateTransitionRef:
```typescript
const name = recordListingStateTransitionRef.operationName;
console.log(name);
```

### Variables
The `RecordListingStateTransition` mutation requires an argument of type `RecordListingStateTransitionVariables`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `RecordListingStateTransition` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RecordListingStateTransitionData`, which is defined in [listing-governance/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RecordListingStateTransitionData {
  listingStateTransition_insert: ListingStateTransition_Key;
}
```
### Using `RecordListingStateTransition`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, recordListingStateTransition, RecordListingStateTransitionVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `RecordListingStateTransition` mutation requires an argument of type `RecordListingStateTransitionVariables`:
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

// Call the `recordListingStateTransition()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await recordListingStateTransition(recordListingStateTransitionVars);
// Variables can be defined inline as well.
const { data } = await recordListingStateTransition({ listingId: ..., transitionAction: ..., previousState: ..., nextState: ..., previousReviewState: ..., nextReviewState: ..., previousPaymentState: ..., nextPaymentState: ..., previousInventoryState: ..., nextInventoryState: ..., previousVisibilityState: ..., nextVisibilityState: ..., actorType: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await recordListingStateTransition(dataConnect, recordListingStateTransitionVars);

console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
recordListingStateTransition(recordListingStateTransitionVars).then((response) => {
  const data = response.data;
  console.log(data.listingStateTransition_insert);
});
```

### Using `RecordListingStateTransition`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, recordListingStateTransitionRef, RecordListingStateTransitionVariables } from '@dataconnect/generated-timberequip-listing-governance';

// The `RecordListingStateTransition` mutation requires an argument of type `RecordListingStateTransitionVariables`:
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

// Call the `recordListingStateTransitionRef()` function to get a reference to the mutation.
const ref = recordListingStateTransitionRef(recordListingStateTransitionVars);
// Variables can be defined inline as well.
const ref = recordListingStateTransitionRef({ listingId: ..., transitionAction: ..., previousState: ..., nextState: ..., previousReviewState: ..., nextReviewState: ..., previousPaymentState: ..., nextPaymentState: ..., previousInventoryState: ..., nextInventoryState: ..., previousVisibilityState: ..., nextVisibilityState: ..., actorType: ..., actorId: ..., requestId: ..., reasonCode: ..., reasonNote: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = recordListingStateTransitionRef(dataConnect, recordListingStateTransitionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.listingStateTransition_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.listingStateTransition_insert);
});
```

