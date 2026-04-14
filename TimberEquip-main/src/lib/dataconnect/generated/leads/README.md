# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `leads`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`leads/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `leads`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-leads` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-leads';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-leads';

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

Below are examples of how to use the `leads` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetInquiryById
You can execute the `GetInquiryById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
getInquiryById(vars: GetInquiryByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetInquiryByIdData, GetInquiryByIdVariables>;

interface GetInquiryByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetInquiryByIdVariables): QueryRef<GetInquiryByIdData, GetInquiryByIdVariables>;
}
export const getInquiryByIdRef: GetInquiryByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getInquiryById(dc: DataConnect, vars: GetInquiryByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetInquiryByIdData, GetInquiryByIdVariables>;

interface GetInquiryByIdRef {
  ...
  (dc: DataConnect, vars: GetInquiryByIdVariables): QueryRef<GetInquiryByIdData, GetInquiryByIdVariables>;
}
export const getInquiryByIdRef: GetInquiryByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getInquiryByIdRef:
```typescript
const name = getInquiryByIdRef.operationName;
console.log(name);
```

### Variables
The `GetInquiryById` query requires an argument of type `GetInquiryByIdVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetInquiryByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetInquiryById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetInquiryByIdData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetInquiryById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getInquiryById, GetInquiryByIdVariables } from '@dataconnect/generated-timberequip-leads';

// The `GetInquiryById` query requires an argument of type `GetInquiryByIdVariables`:
const getInquiryByIdVars: GetInquiryByIdVariables = {
  id: ..., 
};

// Call the `getInquiryById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getInquiryById(getInquiryByIdVars);
// Variables can be defined inline as well.
const { data } = await getInquiryById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getInquiryById(dataConnect, getInquiryByIdVars);

console.log(data.inquiry);

// Or, you can use the `Promise` API.
getInquiryById(getInquiryByIdVars).then((response) => {
  const data = response.data;
  console.log(data.inquiry);
});
```

### Using `GetInquiryById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getInquiryByIdRef, GetInquiryByIdVariables } from '@dataconnect/generated-timberequip-leads';

// The `GetInquiryById` query requires an argument of type `GetInquiryByIdVariables`:
const getInquiryByIdVars: GetInquiryByIdVariables = {
  id: ..., 
};

// Call the `getInquiryByIdRef()` function to get a reference to the query.
const ref = getInquiryByIdRef(getInquiryByIdVars);
// Variables can be defined inline as well.
const ref = getInquiryByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getInquiryByIdRef(dataConnect, getInquiryByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.inquiry);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiry);
});
```

## ListInquiriesBySeller
You can execute the `ListInquiriesBySeller` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
listInquiriesBySeller(vars: ListInquiriesBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;

interface ListInquiriesBySellerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInquiriesBySellerVariables): QueryRef<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;
}
export const listInquiriesBySellerRef: ListInquiriesBySellerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listInquiriesBySeller(dc: DataConnect, vars: ListInquiriesBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;

interface ListInquiriesBySellerRef {
  ...
  (dc: DataConnect, vars: ListInquiriesBySellerVariables): QueryRef<ListInquiriesBySellerData, ListInquiriesBySellerVariables>;
}
export const listInquiriesBySellerRef: ListInquiriesBySellerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listInquiriesBySellerRef:
```typescript
const name = listInquiriesBySellerRef.operationName;
console.log(name);
```

### Variables
The `ListInquiriesBySeller` query requires an argument of type `ListInquiriesBySellerVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListInquiriesBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListInquiriesBySeller` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListInquiriesBySellerData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListInquiriesBySeller`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listInquiriesBySeller, ListInquiriesBySellerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListInquiriesBySeller` query requires an argument of type `ListInquiriesBySellerVariables`:
const listInquiriesBySellerVars: ListInquiriesBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listInquiriesBySeller()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listInquiriesBySeller(listInquiriesBySellerVars);
// Variables can be defined inline as well.
const { data } = await listInquiriesBySeller({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listInquiriesBySeller(dataConnect, listInquiriesBySellerVars);

console.log(data.inquiries);

// Or, you can use the `Promise` API.
listInquiriesBySeller(listInquiriesBySellerVars).then((response) => {
  const data = response.data;
  console.log(data.inquiries);
});
```

### Using `ListInquiriesBySeller`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listInquiriesBySellerRef, ListInquiriesBySellerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListInquiriesBySeller` query requires an argument of type `ListInquiriesBySellerVariables`:
const listInquiriesBySellerVars: ListInquiriesBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listInquiriesBySellerRef()` function to get a reference to the query.
const ref = listInquiriesBySellerRef(listInquiriesBySellerVars);
// Variables can be defined inline as well.
const ref = listInquiriesBySellerRef({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listInquiriesBySellerRef(dataConnect, listInquiriesBySellerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.inquiries);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiries);
});
```

## ListInquiriesByBuyer
You can execute the `ListInquiriesByBuyer` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
listInquiriesByBuyer(vars: ListInquiriesByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;

interface ListInquiriesByBuyerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInquiriesByBuyerVariables): QueryRef<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;
}
export const listInquiriesByBuyerRef: ListInquiriesByBuyerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listInquiriesByBuyer(dc: DataConnect, vars: ListInquiriesByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;

interface ListInquiriesByBuyerRef {
  ...
  (dc: DataConnect, vars: ListInquiriesByBuyerVariables): QueryRef<ListInquiriesByBuyerData, ListInquiriesByBuyerVariables>;
}
export const listInquiriesByBuyerRef: ListInquiriesByBuyerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listInquiriesByBuyerRef:
```typescript
const name = listInquiriesByBuyerRef.operationName;
console.log(name);
```

### Variables
The `ListInquiriesByBuyer` query requires an argument of type `ListInquiriesByBuyerVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListInquiriesByBuyerVariables {
  buyerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListInquiriesByBuyer` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListInquiriesByBuyerData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListInquiriesByBuyer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listInquiriesByBuyer, ListInquiriesByBuyerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListInquiriesByBuyer` query requires an argument of type `ListInquiriesByBuyerVariables`:
const listInquiriesByBuyerVars: ListInquiriesByBuyerVariables = {
  buyerUid: ..., 
  limit: ..., // optional
};

// Call the `listInquiriesByBuyer()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listInquiriesByBuyer(listInquiriesByBuyerVars);
// Variables can be defined inline as well.
const { data } = await listInquiriesByBuyer({ buyerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listInquiriesByBuyer(dataConnect, listInquiriesByBuyerVars);

console.log(data.inquiries);

// Or, you can use the `Promise` API.
listInquiriesByBuyer(listInquiriesByBuyerVars).then((response) => {
  const data = response.data;
  console.log(data.inquiries);
});
```

### Using `ListInquiriesByBuyer`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listInquiriesByBuyerRef, ListInquiriesByBuyerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListInquiriesByBuyer` query requires an argument of type `ListInquiriesByBuyerVariables`:
const listInquiriesByBuyerVars: ListInquiriesByBuyerVariables = {
  buyerUid: ..., 
  limit: ..., // optional
};

// Call the `listInquiriesByBuyerRef()` function to get a reference to the query.
const ref = listInquiriesByBuyerRef(listInquiriesByBuyerVars);
// Variables can be defined inline as well.
const ref = listInquiriesByBuyerRef({ buyerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listInquiriesByBuyerRef(dataConnect, listInquiriesByBuyerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.inquiries);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiries);
});
```

## ListInquiriesByListing
You can execute the `ListInquiriesByListing` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
listInquiriesByListing(vars: ListInquiriesByListingVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByListingData, ListInquiriesByListingVariables>;

interface ListInquiriesByListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInquiriesByListingVariables): QueryRef<ListInquiriesByListingData, ListInquiriesByListingVariables>;
}
export const listInquiriesByListingRef: ListInquiriesByListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listInquiriesByListing(dc: DataConnect, vars: ListInquiriesByListingVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByListingData, ListInquiriesByListingVariables>;

interface ListInquiriesByListingRef {
  ...
  (dc: DataConnect, vars: ListInquiriesByListingVariables): QueryRef<ListInquiriesByListingData, ListInquiriesByListingVariables>;
}
export const listInquiriesByListingRef: ListInquiriesByListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listInquiriesByListingRef:
```typescript
const name = listInquiriesByListingRef.operationName;
console.log(name);
```

### Variables
The `ListInquiriesByListing` query requires an argument of type `ListInquiriesByListingVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListInquiriesByListingVariables {
  listingId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListInquiriesByListing` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListInquiriesByListingData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListInquiriesByListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listInquiriesByListing, ListInquiriesByListingVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListInquiriesByListing` query requires an argument of type `ListInquiriesByListingVariables`:
const listInquiriesByListingVars: ListInquiriesByListingVariables = {
  listingId: ..., 
  limit: ..., // optional
};

// Call the `listInquiriesByListing()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listInquiriesByListing(listInquiriesByListingVars);
// Variables can be defined inline as well.
const { data } = await listInquiriesByListing({ listingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listInquiriesByListing(dataConnect, listInquiriesByListingVars);

console.log(data.inquiries);

// Or, you can use the `Promise` API.
listInquiriesByListing(listInquiriesByListingVars).then((response) => {
  const data = response.data;
  console.log(data.inquiries);
});
```

### Using `ListInquiriesByListing`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listInquiriesByListingRef, ListInquiriesByListingVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListInquiriesByListing` query requires an argument of type `ListInquiriesByListingVariables`:
const listInquiriesByListingVars: ListInquiriesByListingVariables = {
  listingId: ..., 
  limit: ..., // optional
};

// Call the `listInquiriesByListingRef()` function to get a reference to the query.
const ref = listInquiriesByListingRef(listInquiriesByListingVars);
// Variables can be defined inline as well.
const ref = listInquiriesByListingRef({ listingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listInquiriesByListingRef(dataConnect, listInquiriesByListingVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.inquiries);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiries);
});
```

## ListInquiriesByStatus
You can execute the `ListInquiriesByStatus` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
listInquiriesByStatus(vars: ListInquiriesByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;

interface ListInquiriesByStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListInquiriesByStatusVariables): QueryRef<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;
}
export const listInquiriesByStatusRef: ListInquiriesByStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listInquiriesByStatus(dc: DataConnect, vars: ListInquiriesByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;

interface ListInquiriesByStatusRef {
  ...
  (dc: DataConnect, vars: ListInquiriesByStatusVariables): QueryRef<ListInquiriesByStatusData, ListInquiriesByStatusVariables>;
}
export const listInquiriesByStatusRef: ListInquiriesByStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listInquiriesByStatusRef:
```typescript
const name = listInquiriesByStatusRef.operationName;
console.log(name);
```

### Variables
The `ListInquiriesByStatus` query requires an argument of type `ListInquiriesByStatusVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListInquiriesByStatusVariables {
  status: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListInquiriesByStatus` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListInquiriesByStatusData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListInquiriesByStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listInquiriesByStatus, ListInquiriesByStatusVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListInquiriesByStatus` query requires an argument of type `ListInquiriesByStatusVariables`:
const listInquiriesByStatusVars: ListInquiriesByStatusVariables = {
  status: ..., 
  limit: ..., // optional
};

// Call the `listInquiriesByStatus()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listInquiriesByStatus(listInquiriesByStatusVars);
// Variables can be defined inline as well.
const { data } = await listInquiriesByStatus({ status: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listInquiriesByStatus(dataConnect, listInquiriesByStatusVars);

console.log(data.inquiries);

// Or, you can use the `Promise` API.
listInquiriesByStatus(listInquiriesByStatusVars).then((response) => {
  const data = response.data;
  console.log(data.inquiries);
});
```

### Using `ListInquiriesByStatus`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listInquiriesByStatusRef, ListInquiriesByStatusVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListInquiriesByStatus` query requires an argument of type `ListInquiriesByStatusVariables`:
const listInquiriesByStatusVars: ListInquiriesByStatusVariables = {
  status: ..., 
  limit: ..., // optional
};

// Call the `listInquiriesByStatusRef()` function to get a reference to the query.
const ref = listInquiriesByStatusRef(listInquiriesByStatusVars);
// Variables can be defined inline as well.
const ref = listInquiriesByStatusRef({ status: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listInquiriesByStatusRef(dataConnect, listInquiriesByStatusVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.inquiries);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiries);
});
```

## GetFinancingRequestById
You can execute the `GetFinancingRequestById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
getFinancingRequestById(vars: GetFinancingRequestByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;

interface GetFinancingRequestByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetFinancingRequestByIdVariables): QueryRef<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;
}
export const getFinancingRequestByIdRef: GetFinancingRequestByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getFinancingRequestById(dc: DataConnect, vars: GetFinancingRequestByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;

interface GetFinancingRequestByIdRef {
  ...
  (dc: DataConnect, vars: GetFinancingRequestByIdVariables): QueryRef<GetFinancingRequestByIdData, GetFinancingRequestByIdVariables>;
}
export const getFinancingRequestByIdRef: GetFinancingRequestByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getFinancingRequestByIdRef:
```typescript
const name = getFinancingRequestByIdRef.operationName;
console.log(name);
```

### Variables
The `GetFinancingRequestById` query requires an argument of type `GetFinancingRequestByIdVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetFinancingRequestByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetFinancingRequestById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetFinancingRequestByIdData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetFinancingRequestById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getFinancingRequestById, GetFinancingRequestByIdVariables } from '@dataconnect/generated-timberequip-leads';

// The `GetFinancingRequestById` query requires an argument of type `GetFinancingRequestByIdVariables`:
const getFinancingRequestByIdVars: GetFinancingRequestByIdVariables = {
  id: ..., 
};

// Call the `getFinancingRequestById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getFinancingRequestById(getFinancingRequestByIdVars);
// Variables can be defined inline as well.
const { data } = await getFinancingRequestById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getFinancingRequestById(dataConnect, getFinancingRequestByIdVars);

console.log(data.financingRequest);

// Or, you can use the `Promise` API.
getFinancingRequestById(getFinancingRequestByIdVars).then((response) => {
  const data = response.data;
  console.log(data.financingRequest);
});
```

### Using `GetFinancingRequestById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getFinancingRequestByIdRef, GetFinancingRequestByIdVariables } from '@dataconnect/generated-timberequip-leads';

// The `GetFinancingRequestById` query requires an argument of type `GetFinancingRequestByIdVariables`:
const getFinancingRequestByIdVars: GetFinancingRequestByIdVariables = {
  id: ..., 
};

// Call the `getFinancingRequestByIdRef()` function to get a reference to the query.
const ref = getFinancingRequestByIdRef(getFinancingRequestByIdVars);
// Variables can be defined inline as well.
const ref = getFinancingRequestByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getFinancingRequestByIdRef(dataConnect, getFinancingRequestByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.financingRequest);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.financingRequest);
});
```

## ListFinancingRequestsBySeller
You can execute the `ListFinancingRequestsBySeller` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
listFinancingRequestsBySeller(vars: ListFinancingRequestsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;

interface ListFinancingRequestsBySellerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListFinancingRequestsBySellerVariables): QueryRef<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;
}
export const listFinancingRequestsBySellerRef: ListFinancingRequestsBySellerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listFinancingRequestsBySeller(dc: DataConnect, vars: ListFinancingRequestsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;

interface ListFinancingRequestsBySellerRef {
  ...
  (dc: DataConnect, vars: ListFinancingRequestsBySellerVariables): QueryRef<ListFinancingRequestsBySellerData, ListFinancingRequestsBySellerVariables>;
}
export const listFinancingRequestsBySellerRef: ListFinancingRequestsBySellerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listFinancingRequestsBySellerRef:
```typescript
const name = listFinancingRequestsBySellerRef.operationName;
console.log(name);
```

### Variables
The `ListFinancingRequestsBySeller` query requires an argument of type `ListFinancingRequestsBySellerVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListFinancingRequestsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListFinancingRequestsBySeller` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListFinancingRequestsBySellerData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListFinancingRequestsBySeller`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listFinancingRequestsBySeller, ListFinancingRequestsBySellerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListFinancingRequestsBySeller` query requires an argument of type `ListFinancingRequestsBySellerVariables`:
const listFinancingRequestsBySellerVars: ListFinancingRequestsBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listFinancingRequestsBySeller()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listFinancingRequestsBySeller(listFinancingRequestsBySellerVars);
// Variables can be defined inline as well.
const { data } = await listFinancingRequestsBySeller({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listFinancingRequestsBySeller(dataConnect, listFinancingRequestsBySellerVars);

console.log(data.financingRequests);

// Or, you can use the `Promise` API.
listFinancingRequestsBySeller(listFinancingRequestsBySellerVars).then((response) => {
  const data = response.data;
  console.log(data.financingRequests);
});
```

### Using `ListFinancingRequestsBySeller`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listFinancingRequestsBySellerRef, ListFinancingRequestsBySellerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListFinancingRequestsBySeller` query requires an argument of type `ListFinancingRequestsBySellerVariables`:
const listFinancingRequestsBySellerVars: ListFinancingRequestsBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listFinancingRequestsBySellerRef()` function to get a reference to the query.
const ref = listFinancingRequestsBySellerRef(listFinancingRequestsBySellerVars);
// Variables can be defined inline as well.
const ref = listFinancingRequestsBySellerRef({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listFinancingRequestsBySellerRef(dataConnect, listFinancingRequestsBySellerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.financingRequests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.financingRequests);
});
```

## ListFinancingRequestsByBuyer
You can execute the `ListFinancingRequestsByBuyer` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
listFinancingRequestsByBuyer(vars: ListFinancingRequestsByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;

interface ListFinancingRequestsByBuyerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListFinancingRequestsByBuyerVariables): QueryRef<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;
}
export const listFinancingRequestsByBuyerRef: ListFinancingRequestsByBuyerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listFinancingRequestsByBuyer(dc: DataConnect, vars: ListFinancingRequestsByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;

interface ListFinancingRequestsByBuyerRef {
  ...
  (dc: DataConnect, vars: ListFinancingRequestsByBuyerVariables): QueryRef<ListFinancingRequestsByBuyerData, ListFinancingRequestsByBuyerVariables>;
}
export const listFinancingRequestsByBuyerRef: ListFinancingRequestsByBuyerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listFinancingRequestsByBuyerRef:
```typescript
const name = listFinancingRequestsByBuyerRef.operationName;
console.log(name);
```

### Variables
The `ListFinancingRequestsByBuyer` query requires an argument of type `ListFinancingRequestsByBuyerVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListFinancingRequestsByBuyerVariables {
  buyerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListFinancingRequestsByBuyer` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListFinancingRequestsByBuyerData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListFinancingRequestsByBuyer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listFinancingRequestsByBuyer, ListFinancingRequestsByBuyerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListFinancingRequestsByBuyer` query requires an argument of type `ListFinancingRequestsByBuyerVariables`:
const listFinancingRequestsByBuyerVars: ListFinancingRequestsByBuyerVariables = {
  buyerUid: ..., 
  limit: ..., // optional
};

// Call the `listFinancingRequestsByBuyer()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listFinancingRequestsByBuyer(listFinancingRequestsByBuyerVars);
// Variables can be defined inline as well.
const { data } = await listFinancingRequestsByBuyer({ buyerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listFinancingRequestsByBuyer(dataConnect, listFinancingRequestsByBuyerVars);

console.log(data.financingRequests);

// Or, you can use the `Promise` API.
listFinancingRequestsByBuyer(listFinancingRequestsByBuyerVars).then((response) => {
  const data = response.data;
  console.log(data.financingRequests);
});
```

### Using `ListFinancingRequestsByBuyer`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listFinancingRequestsByBuyerRef, ListFinancingRequestsByBuyerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListFinancingRequestsByBuyer` query requires an argument of type `ListFinancingRequestsByBuyerVariables`:
const listFinancingRequestsByBuyerVars: ListFinancingRequestsByBuyerVariables = {
  buyerUid: ..., 
  limit: ..., // optional
};

// Call the `listFinancingRequestsByBuyerRef()` function to get a reference to the query.
const ref = listFinancingRequestsByBuyerRef(listFinancingRequestsByBuyerVars);
// Variables can be defined inline as well.
const ref = listFinancingRequestsByBuyerRef({ buyerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listFinancingRequestsByBuyerRef(dataConnect, listFinancingRequestsByBuyerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.financingRequests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.financingRequests);
});
```

## GetCallLogById
You can execute the `GetCallLogById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
getCallLogById(vars: GetCallLogByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetCallLogByIdData, GetCallLogByIdVariables>;

interface GetCallLogByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCallLogByIdVariables): QueryRef<GetCallLogByIdData, GetCallLogByIdVariables>;
}
export const getCallLogByIdRef: GetCallLogByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCallLogById(dc: DataConnect, vars: GetCallLogByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetCallLogByIdData, GetCallLogByIdVariables>;

interface GetCallLogByIdRef {
  ...
  (dc: DataConnect, vars: GetCallLogByIdVariables): QueryRef<GetCallLogByIdData, GetCallLogByIdVariables>;
}
export const getCallLogByIdRef: GetCallLogByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCallLogByIdRef:
```typescript
const name = getCallLogByIdRef.operationName;
console.log(name);
```

### Variables
The `GetCallLogById` query requires an argument of type `GetCallLogByIdVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCallLogByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetCallLogById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCallLogByIdData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetCallLogById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCallLogById, GetCallLogByIdVariables } from '@dataconnect/generated-timberequip-leads';

// The `GetCallLogById` query requires an argument of type `GetCallLogByIdVariables`:
const getCallLogByIdVars: GetCallLogByIdVariables = {
  id: ..., 
};

// Call the `getCallLogById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCallLogById(getCallLogByIdVars);
// Variables can be defined inline as well.
const { data } = await getCallLogById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCallLogById(dataConnect, getCallLogByIdVars);

console.log(data.callLog);

// Or, you can use the `Promise` API.
getCallLogById(getCallLogByIdVars).then((response) => {
  const data = response.data;
  console.log(data.callLog);
});
```

### Using `GetCallLogById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCallLogByIdRef, GetCallLogByIdVariables } from '@dataconnect/generated-timberequip-leads';

// The `GetCallLogById` query requires an argument of type `GetCallLogByIdVariables`:
const getCallLogByIdVars: GetCallLogByIdVariables = {
  id: ..., 
};

// Call the `getCallLogByIdRef()` function to get a reference to the query.
const ref = getCallLogByIdRef(getCallLogByIdVars);
// Variables can be defined inline as well.
const ref = getCallLogByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCallLogByIdRef(dataConnect, getCallLogByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.callLog);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.callLog);
});
```

## ListCallLogsBySeller
You can execute the `ListCallLogsBySeller` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
listCallLogsBySeller(vars: ListCallLogsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;

interface ListCallLogsBySellerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCallLogsBySellerVariables): QueryRef<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;
}
export const listCallLogsBySellerRef: ListCallLogsBySellerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCallLogsBySeller(dc: DataConnect, vars: ListCallLogsBySellerVariables, options?: ExecuteQueryOptions): QueryPromise<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;

interface ListCallLogsBySellerRef {
  ...
  (dc: DataConnect, vars: ListCallLogsBySellerVariables): QueryRef<ListCallLogsBySellerData, ListCallLogsBySellerVariables>;
}
export const listCallLogsBySellerRef: ListCallLogsBySellerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCallLogsBySellerRef:
```typescript
const name = listCallLogsBySellerRef.operationName;
console.log(name);
```

### Variables
The `ListCallLogsBySeller` query requires an argument of type `ListCallLogsBySellerVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCallLogsBySellerVariables {
  sellerUid: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListCallLogsBySeller` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCallLogsBySellerData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListCallLogsBySeller`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCallLogsBySeller, ListCallLogsBySellerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListCallLogsBySeller` query requires an argument of type `ListCallLogsBySellerVariables`:
const listCallLogsBySellerVars: ListCallLogsBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listCallLogsBySeller()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCallLogsBySeller(listCallLogsBySellerVars);
// Variables can be defined inline as well.
const { data } = await listCallLogsBySeller({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCallLogsBySeller(dataConnect, listCallLogsBySellerVars);

console.log(data.callLogs);

// Or, you can use the `Promise` API.
listCallLogsBySeller(listCallLogsBySellerVars).then((response) => {
  const data = response.data;
  console.log(data.callLogs);
});
```

### Using `ListCallLogsBySeller`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCallLogsBySellerRef, ListCallLogsBySellerVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListCallLogsBySeller` query requires an argument of type `ListCallLogsBySellerVariables`:
const listCallLogsBySellerVars: ListCallLogsBySellerVariables = {
  sellerUid: ..., 
  limit: ..., // optional
};

// Call the `listCallLogsBySellerRef()` function to get a reference to the query.
const ref = listCallLogsBySellerRef(listCallLogsBySellerVars);
// Variables can be defined inline as well.
const ref = listCallLogsBySellerRef({ sellerUid: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCallLogsBySellerRef(dataConnect, listCallLogsBySellerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.callLogs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.callLogs);
});
```

## ListCallLogsByListing
You can execute the `ListCallLogsByListing` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
listCallLogsByListing(vars: ListCallLogsByListingVariables, options?: ExecuteQueryOptions): QueryPromise<ListCallLogsByListingData, ListCallLogsByListingVariables>;

interface ListCallLogsByListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCallLogsByListingVariables): QueryRef<ListCallLogsByListingData, ListCallLogsByListingVariables>;
}
export const listCallLogsByListingRef: ListCallLogsByListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCallLogsByListing(dc: DataConnect, vars: ListCallLogsByListingVariables, options?: ExecuteQueryOptions): QueryPromise<ListCallLogsByListingData, ListCallLogsByListingVariables>;

interface ListCallLogsByListingRef {
  ...
  (dc: DataConnect, vars: ListCallLogsByListingVariables): QueryRef<ListCallLogsByListingData, ListCallLogsByListingVariables>;
}
export const listCallLogsByListingRef: ListCallLogsByListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCallLogsByListingRef:
```typescript
const name = listCallLogsByListingRef.operationName;
console.log(name);
```

### Variables
The `ListCallLogsByListing` query requires an argument of type `ListCallLogsByListingVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCallLogsByListingVariables {
  listingId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListCallLogsByListing` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCallLogsByListingData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListCallLogsByListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCallLogsByListing, ListCallLogsByListingVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListCallLogsByListing` query requires an argument of type `ListCallLogsByListingVariables`:
const listCallLogsByListingVars: ListCallLogsByListingVariables = {
  listingId: ..., 
  limit: ..., // optional
};

// Call the `listCallLogsByListing()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCallLogsByListing(listCallLogsByListingVars);
// Variables can be defined inline as well.
const { data } = await listCallLogsByListing({ listingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCallLogsByListing(dataConnect, listCallLogsByListingVars);

console.log(data.callLogs);

// Or, you can use the `Promise` API.
listCallLogsByListing(listCallLogsByListingVars).then((response) => {
  const data = response.data;
  console.log(data.callLogs);
});
```

### Using `ListCallLogsByListing`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCallLogsByListingRef, ListCallLogsByListingVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListCallLogsByListing` query requires an argument of type `ListCallLogsByListingVariables`:
const listCallLogsByListingVars: ListCallLogsByListingVariables = {
  listingId: ..., 
  limit: ..., // optional
};

// Call the `listCallLogsByListingRef()` function to get a reference to the query.
const ref = listCallLogsByListingRef(listCallLogsByListingVars);
// Variables can be defined inline as well.
const ref = listCallLogsByListingRef({ listingId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCallLogsByListingRef(dataConnect, listCallLogsByListingVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.callLogs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.callLogs);
});
```

## ListContactRequestsByStatus
You can execute the `ListContactRequestsByStatus` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
listContactRequestsByStatus(vars: ListContactRequestsByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;

interface ListContactRequestsByStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListContactRequestsByStatusVariables): QueryRef<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;
}
export const listContactRequestsByStatusRef: ListContactRequestsByStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listContactRequestsByStatus(dc: DataConnect, vars: ListContactRequestsByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;

interface ListContactRequestsByStatusRef {
  ...
  (dc: DataConnect, vars: ListContactRequestsByStatusVariables): QueryRef<ListContactRequestsByStatusData, ListContactRequestsByStatusVariables>;
}
export const listContactRequestsByStatusRef: ListContactRequestsByStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listContactRequestsByStatusRef:
```typescript
const name = listContactRequestsByStatusRef.operationName;
console.log(name);
```

### Variables
The `ListContactRequestsByStatus` query requires an argument of type `ListContactRequestsByStatusVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListContactRequestsByStatusVariables {
  status: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListContactRequestsByStatus` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListContactRequestsByStatusData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListContactRequestsByStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listContactRequestsByStatus, ListContactRequestsByStatusVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListContactRequestsByStatus` query requires an argument of type `ListContactRequestsByStatusVariables`:
const listContactRequestsByStatusVars: ListContactRequestsByStatusVariables = {
  status: ..., 
  limit: ..., // optional
};

// Call the `listContactRequestsByStatus()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listContactRequestsByStatus(listContactRequestsByStatusVars);
// Variables can be defined inline as well.
const { data } = await listContactRequestsByStatus({ status: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listContactRequestsByStatus(dataConnect, listContactRequestsByStatusVars);

console.log(data.contactRequests);

// Or, you can use the `Promise` API.
listContactRequestsByStatus(listContactRequestsByStatusVars).then((response) => {
  const data = response.data;
  console.log(data.contactRequests);
});
```

### Using `ListContactRequestsByStatus`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listContactRequestsByStatusRef, ListContactRequestsByStatusVariables } from '@dataconnect/generated-timberequip-leads';

// The `ListContactRequestsByStatus` query requires an argument of type `ListContactRequestsByStatusVariables`:
const listContactRequestsByStatusVars: ListContactRequestsByStatusVariables = {
  status: ..., 
  limit: ..., // optional
};

// Call the `listContactRequestsByStatusRef()` function to get a reference to the query.
const ref = listContactRequestsByStatusRef(listContactRequestsByStatusVars);
// Variables can be defined inline as well.
const ref = listContactRequestsByStatusRef({ status: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listContactRequestsByStatusRef(dataConnect, listContactRequestsByStatusVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.contactRequests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.contactRequests);
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

Below are examples of how to use the `leads` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertInquiry
You can execute the `UpsertInquiry` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
upsertInquiry(vars: UpsertInquiryVariables): MutationPromise<UpsertInquiryData, UpsertInquiryVariables>;

interface UpsertInquiryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertInquiryVariables): MutationRef<UpsertInquiryData, UpsertInquiryVariables>;
}
export const upsertInquiryRef: UpsertInquiryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertInquiry(dc: DataConnect, vars: UpsertInquiryVariables): MutationPromise<UpsertInquiryData, UpsertInquiryVariables>;

interface UpsertInquiryRef {
  ...
  (dc: DataConnect, vars: UpsertInquiryVariables): MutationRef<UpsertInquiryData, UpsertInquiryVariables>;
}
export const upsertInquiryRef: UpsertInquiryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertInquiryRef:
```typescript
const name = upsertInquiryRef.operationName;
console.log(name);
```

### Variables
The `UpsertInquiry` mutation requires an argument of type `UpsertInquiryVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertInquiry` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertInquiryData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertInquiryData {
  inquiry_upsert: Inquiry_Key;
}
```
### Using `UpsertInquiry`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertInquiry, UpsertInquiryVariables } from '@dataconnect/generated-timberequip-leads';

// The `UpsertInquiry` mutation requires an argument of type `UpsertInquiryVariables`:
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

// Call the `upsertInquiry()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertInquiry(upsertInquiryVars);
// Variables can be defined inline as well.
const { data } = await upsertInquiry({ id: ..., listingId: ..., sellerUid: ..., buyerUid: ..., buyerName: ..., buyerEmail: ..., buyerPhone: ..., message: ..., type: ..., status: ..., assignedToUid: ..., assignedToName: ..., internalNotes: ..., firstResponseAt: ..., responseTimeMinutes: ..., spamScore: ..., spamFlags: ..., contactConsentAccepted: ..., contactConsentVersion: ..., contactConsentScope: ..., contactConsentAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertInquiry(dataConnect, upsertInquiryVars);

console.log(data.inquiry_upsert);

// Or, you can use the `Promise` API.
upsertInquiry(upsertInquiryVars).then((response) => {
  const data = response.data;
  console.log(data.inquiry_upsert);
});
```

### Using `UpsertInquiry`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertInquiryRef, UpsertInquiryVariables } from '@dataconnect/generated-timberequip-leads';

// The `UpsertInquiry` mutation requires an argument of type `UpsertInquiryVariables`:
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

// Call the `upsertInquiryRef()` function to get a reference to the mutation.
const ref = upsertInquiryRef(upsertInquiryVars);
// Variables can be defined inline as well.
const ref = upsertInquiryRef({ id: ..., listingId: ..., sellerUid: ..., buyerUid: ..., buyerName: ..., buyerEmail: ..., buyerPhone: ..., message: ..., type: ..., status: ..., assignedToUid: ..., assignedToName: ..., internalNotes: ..., firstResponseAt: ..., responseTimeMinutes: ..., spamScore: ..., spamFlags: ..., contactConsentAccepted: ..., contactConsentVersion: ..., contactConsentScope: ..., contactConsentAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertInquiryRef(dataConnect, upsertInquiryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.inquiry_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiry_upsert);
});
```

## UpdateInquiryStatus
You can execute the `UpdateInquiryStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
updateInquiryStatus(vars: UpdateInquiryStatusVariables): MutationPromise<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;

interface UpdateInquiryStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInquiryStatusVariables): MutationRef<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;
}
export const updateInquiryStatusRef: UpdateInquiryStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateInquiryStatus(dc: DataConnect, vars: UpdateInquiryStatusVariables): MutationPromise<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;

interface UpdateInquiryStatusRef {
  ...
  (dc: DataConnect, vars: UpdateInquiryStatusVariables): MutationRef<UpdateInquiryStatusData, UpdateInquiryStatusVariables>;
}
export const updateInquiryStatusRef: UpdateInquiryStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateInquiryStatusRef:
```typescript
const name = updateInquiryStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateInquiryStatus` mutation requires an argument of type `UpdateInquiryStatusVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateInquiryStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateInquiryStatusData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateInquiryStatusData {
  inquiry_update?: Inquiry_Key | null;
}
```
### Using `UpdateInquiryStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateInquiryStatus, UpdateInquiryStatusVariables } from '@dataconnect/generated-timberequip-leads';

// The `UpdateInquiryStatus` mutation requires an argument of type `UpdateInquiryStatusVariables`:
const updateInquiryStatusVars: UpdateInquiryStatusVariables = {
  id: ..., 
  status: ..., 
  assignedToUid: ..., // optional
  assignedToName: ..., // optional
  firstResponseAt: ..., // optional
  responseTimeMinutes: ..., // optional
};

// Call the `updateInquiryStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateInquiryStatus(updateInquiryStatusVars);
// Variables can be defined inline as well.
const { data } = await updateInquiryStatus({ id: ..., status: ..., assignedToUid: ..., assignedToName: ..., firstResponseAt: ..., responseTimeMinutes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateInquiryStatus(dataConnect, updateInquiryStatusVars);

console.log(data.inquiry_update);

// Or, you can use the `Promise` API.
updateInquiryStatus(updateInquiryStatusVars).then((response) => {
  const data = response.data;
  console.log(data.inquiry_update);
});
```

### Using `UpdateInquiryStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateInquiryStatusRef, UpdateInquiryStatusVariables } from '@dataconnect/generated-timberequip-leads';

// The `UpdateInquiryStatus` mutation requires an argument of type `UpdateInquiryStatusVariables`:
const updateInquiryStatusVars: UpdateInquiryStatusVariables = {
  id: ..., 
  status: ..., 
  assignedToUid: ..., // optional
  assignedToName: ..., // optional
  firstResponseAt: ..., // optional
  responseTimeMinutes: ..., // optional
};

// Call the `updateInquiryStatusRef()` function to get a reference to the mutation.
const ref = updateInquiryStatusRef(updateInquiryStatusVars);
// Variables can be defined inline as well.
const ref = updateInquiryStatusRef({ id: ..., status: ..., assignedToUid: ..., assignedToName: ..., firstResponseAt: ..., responseTimeMinutes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateInquiryStatusRef(dataConnect, updateInquiryStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.inquiry_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.inquiry_update);
});
```

## UpsertFinancingRequest
You can execute the `UpsertFinancingRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
upsertFinancingRequest(vars: UpsertFinancingRequestVariables): MutationPromise<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;

interface UpsertFinancingRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertFinancingRequestVariables): MutationRef<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;
}
export const upsertFinancingRequestRef: UpsertFinancingRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertFinancingRequest(dc: DataConnect, vars: UpsertFinancingRequestVariables): MutationPromise<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;

interface UpsertFinancingRequestRef {
  ...
  (dc: DataConnect, vars: UpsertFinancingRequestVariables): MutationRef<UpsertFinancingRequestData, UpsertFinancingRequestVariables>;
}
export const upsertFinancingRequestRef: UpsertFinancingRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertFinancingRequestRef:
```typescript
const name = upsertFinancingRequestRef.operationName;
console.log(name);
```

### Variables
The `UpsertFinancingRequest` mutation requires an argument of type `UpsertFinancingRequestVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertFinancingRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertFinancingRequestData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertFinancingRequestData {
  financingRequest_upsert: FinancingRequest_Key;
}
```
### Using `UpsertFinancingRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertFinancingRequest, UpsertFinancingRequestVariables } from '@dataconnect/generated-timberequip-leads';

// The `UpsertFinancingRequest` mutation requires an argument of type `UpsertFinancingRequestVariables`:
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

// Call the `upsertFinancingRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertFinancingRequest(upsertFinancingRequestVars);
// Variables can be defined inline as well.
const { data } = await upsertFinancingRequest({ id: ..., listingId: ..., sellerUid: ..., buyerUid: ..., applicantName: ..., applicantEmail: ..., applicantPhone: ..., company: ..., requestedAmount: ..., message: ..., status: ..., contactConsentAccepted: ..., contactConsentVersion: ..., contactConsentScope: ..., contactConsentAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertFinancingRequest(dataConnect, upsertFinancingRequestVars);

console.log(data.financingRequest_upsert);

// Or, you can use the `Promise` API.
upsertFinancingRequest(upsertFinancingRequestVars).then((response) => {
  const data = response.data;
  console.log(data.financingRequest_upsert);
});
```

### Using `UpsertFinancingRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertFinancingRequestRef, UpsertFinancingRequestVariables } from '@dataconnect/generated-timberequip-leads';

// The `UpsertFinancingRequest` mutation requires an argument of type `UpsertFinancingRequestVariables`:
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

// Call the `upsertFinancingRequestRef()` function to get a reference to the mutation.
const ref = upsertFinancingRequestRef(upsertFinancingRequestVars);
// Variables can be defined inline as well.
const ref = upsertFinancingRequestRef({ id: ..., listingId: ..., sellerUid: ..., buyerUid: ..., applicantName: ..., applicantEmail: ..., applicantPhone: ..., company: ..., requestedAmount: ..., message: ..., status: ..., contactConsentAccepted: ..., contactConsentVersion: ..., contactConsentScope: ..., contactConsentAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertFinancingRequestRef(dataConnect, upsertFinancingRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.financingRequest_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.financingRequest_upsert);
});
```

## InsertCallLog
You can execute the `InsertCallLog` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
insertCallLog(vars: InsertCallLogVariables): MutationPromise<InsertCallLogData, InsertCallLogVariables>;

interface InsertCallLogRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertCallLogVariables): MutationRef<InsertCallLogData, InsertCallLogVariables>;
}
export const insertCallLogRef: InsertCallLogRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertCallLog(dc: DataConnect, vars: InsertCallLogVariables): MutationPromise<InsertCallLogData, InsertCallLogVariables>;

interface InsertCallLogRef {
  ...
  (dc: DataConnect, vars: InsertCallLogVariables): MutationRef<InsertCallLogData, InsertCallLogVariables>;
}
export const insertCallLogRef: InsertCallLogRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertCallLogRef:
```typescript
const name = insertCallLogRef.operationName;
console.log(name);
```

### Variables
The `InsertCallLog` mutation requires an argument of type `InsertCallLogVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `InsertCallLog` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertCallLogData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertCallLogData {
  callLog_insert: CallLog_Key;
}
```
### Using `InsertCallLog`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertCallLog, InsertCallLogVariables } from '@dataconnect/generated-timberequip-leads';

// The `InsertCallLog` mutation requires an argument of type `InsertCallLogVariables`:
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

// Call the `insertCallLog()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertCallLog(insertCallLogVars);
// Variables can be defined inline as well.
const { data } = await insertCallLog({ id: ..., listingId: ..., listingTitle: ..., sellerUid: ..., sellerName: ..., sellerPhone: ..., callerUid: ..., callerName: ..., callerEmail: ..., callerPhone: ..., duration: ..., status: ..., source: ..., isAuthenticated: ..., recordingUrl: ..., twilioCallSid: ..., completedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertCallLog(dataConnect, insertCallLogVars);

console.log(data.callLog_insert);

// Or, you can use the `Promise` API.
insertCallLog(insertCallLogVars).then((response) => {
  const data = response.data;
  console.log(data.callLog_insert);
});
```

### Using `InsertCallLog`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertCallLogRef, InsertCallLogVariables } from '@dataconnect/generated-timberequip-leads';

// The `InsertCallLog` mutation requires an argument of type `InsertCallLogVariables`:
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

// Call the `insertCallLogRef()` function to get a reference to the mutation.
const ref = insertCallLogRef(insertCallLogVars);
// Variables can be defined inline as well.
const ref = insertCallLogRef({ id: ..., listingId: ..., listingTitle: ..., sellerUid: ..., sellerName: ..., sellerPhone: ..., callerUid: ..., callerName: ..., callerEmail: ..., callerPhone: ..., duration: ..., status: ..., source: ..., isAuthenticated: ..., recordingUrl: ..., twilioCallSid: ..., completedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertCallLogRef(dataConnect, insertCallLogVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.callLog_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.callLog_insert);
});
```

## InsertContactRequest
You can execute the `InsertContactRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
insertContactRequest(vars: InsertContactRequestVariables): MutationPromise<InsertContactRequestData, InsertContactRequestVariables>;

interface InsertContactRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertContactRequestVariables): MutationRef<InsertContactRequestData, InsertContactRequestVariables>;
}
export const insertContactRequestRef: InsertContactRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertContactRequest(dc: DataConnect, vars: InsertContactRequestVariables): MutationPromise<InsertContactRequestData, InsertContactRequestVariables>;

interface InsertContactRequestRef {
  ...
  (dc: DataConnect, vars: InsertContactRequestVariables): MutationRef<InsertContactRequestData, InsertContactRequestVariables>;
}
export const insertContactRequestRef: InsertContactRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertContactRequestRef:
```typescript
const name = insertContactRequestRef.operationName;
console.log(name);
```

### Variables
The `InsertContactRequest` mutation requires an argument of type `InsertContactRequestVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `InsertContactRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertContactRequestData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertContactRequestData {
  contactRequest_insert: ContactRequest_Key;
}
```
### Using `InsertContactRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertContactRequest, InsertContactRequestVariables } from '@dataconnect/generated-timberequip-leads';

// The `InsertContactRequest` mutation requires an argument of type `InsertContactRequestVariables`:
const insertContactRequestVars: InsertContactRequestVariables = {
  id: ..., 
  name: ..., // optional
  email: ..., 
  category: ..., // optional
  message: ..., // optional
  source: ..., // optional
  status: ..., // optional
};

// Call the `insertContactRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertContactRequest(insertContactRequestVars);
// Variables can be defined inline as well.
const { data } = await insertContactRequest({ id: ..., name: ..., email: ..., category: ..., message: ..., source: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertContactRequest(dataConnect, insertContactRequestVars);

console.log(data.contactRequest_insert);

// Or, you can use the `Promise` API.
insertContactRequest(insertContactRequestVars).then((response) => {
  const data = response.data;
  console.log(data.contactRequest_insert);
});
```

### Using `InsertContactRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertContactRequestRef, InsertContactRequestVariables } from '@dataconnect/generated-timberequip-leads';

// The `InsertContactRequest` mutation requires an argument of type `InsertContactRequestVariables`:
const insertContactRequestVars: InsertContactRequestVariables = {
  id: ..., 
  name: ..., // optional
  email: ..., 
  category: ..., // optional
  message: ..., // optional
  source: ..., // optional
  status: ..., // optional
};

// Call the `insertContactRequestRef()` function to get a reference to the mutation.
const ref = insertContactRequestRef(insertContactRequestVars);
// Variables can be defined inline as well.
const ref = insertContactRequestRef({ id: ..., name: ..., email: ..., category: ..., message: ..., source: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertContactRequestRef(dataConnect, insertContactRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.contactRequest_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.contactRequest_insert);
});
```

## UpdateContactRequestStatus
You can execute the `UpdateContactRequestStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [leads/index.d.ts](./index.d.ts):
```typescript
updateContactRequestStatus(vars: UpdateContactRequestStatusVariables): MutationPromise<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;

interface UpdateContactRequestStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateContactRequestStatusVariables): MutationRef<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;
}
export const updateContactRequestStatusRef: UpdateContactRequestStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateContactRequestStatus(dc: DataConnect, vars: UpdateContactRequestStatusVariables): MutationPromise<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;

interface UpdateContactRequestStatusRef {
  ...
  (dc: DataConnect, vars: UpdateContactRequestStatusVariables): MutationRef<UpdateContactRequestStatusData, UpdateContactRequestStatusVariables>;
}
export const updateContactRequestStatusRef: UpdateContactRequestStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateContactRequestStatusRef:
```typescript
const name = updateContactRequestStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateContactRequestStatus` mutation requires an argument of type `UpdateContactRequestStatusVariables`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateContactRequestStatusVariables {
  id: string;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateContactRequestStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateContactRequestStatusData`, which is defined in [leads/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateContactRequestStatusData {
  contactRequest_update?: ContactRequest_Key | null;
}
```
### Using `UpdateContactRequestStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateContactRequestStatus, UpdateContactRequestStatusVariables } from '@dataconnect/generated-timberequip-leads';

// The `UpdateContactRequestStatus` mutation requires an argument of type `UpdateContactRequestStatusVariables`:
const updateContactRequestStatusVars: UpdateContactRequestStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateContactRequestStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateContactRequestStatus(updateContactRequestStatusVars);
// Variables can be defined inline as well.
const { data } = await updateContactRequestStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateContactRequestStatus(dataConnect, updateContactRequestStatusVars);

console.log(data.contactRequest_update);

// Or, you can use the `Promise` API.
updateContactRequestStatus(updateContactRequestStatusVars).then((response) => {
  const data = response.data;
  console.log(data.contactRequest_update);
});
```

### Using `UpdateContactRequestStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateContactRequestStatusRef, UpdateContactRequestStatusVariables } from '@dataconnect/generated-timberequip-leads';

// The `UpdateContactRequestStatus` mutation requires an argument of type `UpdateContactRequestStatusVariables`:
const updateContactRequestStatusVars: UpdateContactRequestStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateContactRequestStatusRef()` function to get a reference to the mutation.
const ref = updateContactRequestStatusRef(updateContactRequestStatusVars);
// Variables can be defined inline as well.
const ref = updateContactRequestStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateContactRequestStatusRef(dataConnect, updateContactRequestStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.contactRequest_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.contactRequest_update);
});
```

