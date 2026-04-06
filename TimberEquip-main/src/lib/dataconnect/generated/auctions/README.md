# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `auctions`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`auctions/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `auctions`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-auctions` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-auctions';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-auctions';

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

Below are examples of how to use the `auctions` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetAuctionById
You can execute the `GetAuctionById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getAuctionById(vars: GetAuctionByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionByIdData, GetAuctionByIdVariables>;

interface GetAuctionByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionByIdVariables): QueryRef<GetAuctionByIdData, GetAuctionByIdVariables>;
}
export const getAuctionByIdRef: GetAuctionByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAuctionById(dc: DataConnect, vars: GetAuctionByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionByIdData, GetAuctionByIdVariables>;

interface GetAuctionByIdRef {
  ...
  (dc: DataConnect, vars: GetAuctionByIdVariables): QueryRef<GetAuctionByIdData, GetAuctionByIdVariables>;
}
export const getAuctionByIdRef: GetAuctionByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAuctionByIdRef:
```typescript
const name = getAuctionByIdRef.operationName;
console.log(name);
```

### Variables
The `GetAuctionById` query requires an argument of type `GetAuctionByIdVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAuctionByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetAuctionById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAuctionByIdData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetAuctionById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAuctionById, GetAuctionByIdVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionById` query requires an argument of type `GetAuctionByIdVariables`:
const getAuctionByIdVars: GetAuctionByIdVariables = {
  id: ..., 
};

// Call the `getAuctionById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAuctionById(getAuctionByIdVars);
// Variables can be defined inline as well.
const { data } = await getAuctionById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAuctionById(dataConnect, getAuctionByIdVars);

console.log(data.auction);

// Or, you can use the `Promise` API.
getAuctionById(getAuctionByIdVars).then((response) => {
  const data = response.data;
  console.log(data.auction);
});
```

### Using `GetAuctionById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAuctionByIdRef, GetAuctionByIdVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionById` query requires an argument of type `GetAuctionByIdVariables`:
const getAuctionByIdVars: GetAuctionByIdVariables = {
  id: ..., 
};

// Call the `getAuctionByIdRef()` function to get a reference to the query.
const ref = getAuctionByIdRef(getAuctionByIdVars);
// Variables can be defined inline as well.
const ref = getAuctionByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAuctionByIdRef(dataConnect, getAuctionByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auction);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auction);
});
```

## GetAuctionBySlug
You can execute the `GetAuctionBySlug` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getAuctionBySlug(vars: GetAuctionBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionBySlugData, GetAuctionBySlugVariables>;

interface GetAuctionBySlugRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionBySlugVariables): QueryRef<GetAuctionBySlugData, GetAuctionBySlugVariables>;
}
export const getAuctionBySlugRef: GetAuctionBySlugRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAuctionBySlug(dc: DataConnect, vars: GetAuctionBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionBySlugData, GetAuctionBySlugVariables>;

interface GetAuctionBySlugRef {
  ...
  (dc: DataConnect, vars: GetAuctionBySlugVariables): QueryRef<GetAuctionBySlugData, GetAuctionBySlugVariables>;
}
export const getAuctionBySlugRef: GetAuctionBySlugRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAuctionBySlugRef:
```typescript
const name = getAuctionBySlugRef.operationName;
console.log(name);
```

### Variables
The `GetAuctionBySlug` query requires an argument of type `GetAuctionBySlugVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAuctionBySlugVariables {
  slug: string;
}
```
### Return Type
Recall that executing the `GetAuctionBySlug` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAuctionBySlugData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetAuctionBySlug`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAuctionBySlug, GetAuctionBySlugVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionBySlug` query requires an argument of type `GetAuctionBySlugVariables`:
const getAuctionBySlugVars: GetAuctionBySlugVariables = {
  slug: ..., 
};

// Call the `getAuctionBySlug()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAuctionBySlug(getAuctionBySlugVars);
// Variables can be defined inline as well.
const { data } = await getAuctionBySlug({ slug: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAuctionBySlug(dataConnect, getAuctionBySlugVars);

console.log(data.auctions);

// Or, you can use the `Promise` API.
getAuctionBySlug(getAuctionBySlugVars).then((response) => {
  const data = response.data;
  console.log(data.auctions);
});
```

### Using `GetAuctionBySlug`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAuctionBySlugRef, GetAuctionBySlugVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionBySlug` query requires an argument of type `GetAuctionBySlugVariables`:
const getAuctionBySlugVars: GetAuctionBySlugVariables = {
  slug: ..., 
};

// Call the `getAuctionBySlugRef()` function to get a reference to the query.
const ref = getAuctionBySlugRef(getAuctionBySlugVars);
// Variables can be defined inline as well.
const ref = getAuctionBySlugRef({ slug: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAuctionBySlugRef(dataConnect, getAuctionBySlugVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctions);
});
```

## ListActiveAuctions
You can execute the `ListActiveAuctions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
listActiveAuctions(vars?: ListActiveAuctionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListActiveAuctionsData, ListActiveAuctionsVariables>;

interface ListActiveAuctionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListActiveAuctionsVariables): QueryRef<ListActiveAuctionsData, ListActiveAuctionsVariables>;
}
export const listActiveAuctionsRef: ListActiveAuctionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listActiveAuctions(dc: DataConnect, vars?: ListActiveAuctionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListActiveAuctionsData, ListActiveAuctionsVariables>;

interface ListActiveAuctionsRef {
  ...
  (dc: DataConnect, vars?: ListActiveAuctionsVariables): QueryRef<ListActiveAuctionsData, ListActiveAuctionsVariables>;
}
export const listActiveAuctionsRef: ListActiveAuctionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listActiveAuctionsRef:
```typescript
const name = listActiveAuctionsRef.operationName;
console.log(name);
```

### Variables
The `ListActiveAuctions` query has an optional argument of type `ListActiveAuctionsVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListActiveAuctionsVariables {
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListActiveAuctions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListActiveAuctionsData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListActiveAuctions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listActiveAuctions, ListActiveAuctionsVariables } from '@dataconnect/generated-timberequip-auctions';

// The `ListActiveAuctions` query has an optional argument of type `ListActiveAuctionsVariables`:
const listActiveAuctionsVars: ListActiveAuctionsVariables = {
  limit: ..., // optional
};

// Call the `listActiveAuctions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listActiveAuctions(listActiveAuctionsVars);
// Variables can be defined inline as well.
const { data } = await listActiveAuctions({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListActiveAuctionsVariables` argument.
const { data } = await listActiveAuctions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listActiveAuctions(dataConnect, listActiveAuctionsVars);

console.log(data.auctions);

// Or, you can use the `Promise` API.
listActiveAuctions(listActiveAuctionsVars).then((response) => {
  const data = response.data;
  console.log(data.auctions);
});
```

### Using `ListActiveAuctions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listActiveAuctionsRef, ListActiveAuctionsVariables } from '@dataconnect/generated-timberequip-auctions';

// The `ListActiveAuctions` query has an optional argument of type `ListActiveAuctionsVariables`:
const listActiveAuctionsVars: ListActiveAuctionsVariables = {
  limit: ..., // optional
};

// Call the `listActiveAuctionsRef()` function to get a reference to the query.
const ref = listActiveAuctionsRef(listActiveAuctionsVars);
// Variables can be defined inline as well.
const ref = listActiveAuctionsRef({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListActiveAuctionsVariables` argument.
const ref = listActiveAuctionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listActiveAuctionsRef(dataConnect, listActiveAuctionsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctions);
});
```

## ListAuctionsByStatus
You can execute the `ListAuctionsByStatus` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
listAuctionsByStatus(vars: ListAuctionsByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;

interface ListAuctionsByStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListAuctionsByStatusVariables): QueryRef<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;
}
export const listAuctionsByStatusRef: ListAuctionsByStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAuctionsByStatus(dc: DataConnect, vars: ListAuctionsByStatusVariables, options?: ExecuteQueryOptions): QueryPromise<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;

interface ListAuctionsByStatusRef {
  ...
  (dc: DataConnect, vars: ListAuctionsByStatusVariables): QueryRef<ListAuctionsByStatusData, ListAuctionsByStatusVariables>;
}
export const listAuctionsByStatusRef: ListAuctionsByStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAuctionsByStatusRef:
```typescript
const name = listAuctionsByStatusRef.operationName;
console.log(name);
```

### Variables
The `ListAuctionsByStatus` query requires an argument of type `ListAuctionsByStatusVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListAuctionsByStatusVariables {
  status: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListAuctionsByStatus` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAuctionsByStatusData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListAuctionsByStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAuctionsByStatus, ListAuctionsByStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `ListAuctionsByStatus` query requires an argument of type `ListAuctionsByStatusVariables`:
const listAuctionsByStatusVars: ListAuctionsByStatusVariables = {
  status: ..., 
  limit: ..., // optional
};

// Call the `listAuctionsByStatus()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAuctionsByStatus(listAuctionsByStatusVars);
// Variables can be defined inline as well.
const { data } = await listAuctionsByStatus({ status: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAuctionsByStatus(dataConnect, listAuctionsByStatusVars);

console.log(data.auctions);

// Or, you can use the `Promise` API.
listAuctionsByStatus(listAuctionsByStatusVars).then((response) => {
  const data = response.data;
  console.log(data.auctions);
});
```

### Using `ListAuctionsByStatus`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAuctionsByStatusRef, ListAuctionsByStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `ListAuctionsByStatus` query requires an argument of type `ListAuctionsByStatusVariables`:
const listAuctionsByStatusVars: ListAuctionsByStatusVariables = {
  status: ..., 
  limit: ..., // optional
};

// Call the `listAuctionsByStatusRef()` function to get a reference to the query.
const ref = listAuctionsByStatusRef(listAuctionsByStatusVars);
// Variables can be defined inline as well.
const ref = listAuctionsByStatusRef({ status: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAuctionsByStatusRef(dataConnect, listAuctionsByStatusVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctions);
});
```

## GetLotsByAuction
You can execute the `GetLotsByAuction` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getLotsByAuction(vars: GetLotsByAuctionVariables, options?: ExecuteQueryOptions): QueryPromise<GetLotsByAuctionData, GetLotsByAuctionVariables>;

interface GetLotsByAuctionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLotsByAuctionVariables): QueryRef<GetLotsByAuctionData, GetLotsByAuctionVariables>;
}
export const getLotsByAuctionRef: GetLotsByAuctionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getLotsByAuction(dc: DataConnect, vars: GetLotsByAuctionVariables, options?: ExecuteQueryOptions): QueryPromise<GetLotsByAuctionData, GetLotsByAuctionVariables>;

interface GetLotsByAuctionRef {
  ...
  (dc: DataConnect, vars: GetLotsByAuctionVariables): QueryRef<GetLotsByAuctionData, GetLotsByAuctionVariables>;
}
export const getLotsByAuctionRef: GetLotsByAuctionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getLotsByAuctionRef:
```typescript
const name = getLotsByAuctionRef.operationName;
console.log(name);
```

### Variables
The `GetLotsByAuction` query requires an argument of type `GetLotsByAuctionVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetLotsByAuctionVariables {
  auctionId: string;
}
```
### Return Type
Recall that executing the `GetLotsByAuction` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetLotsByAuctionData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetLotsByAuction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getLotsByAuction, GetLotsByAuctionVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetLotsByAuction` query requires an argument of type `GetLotsByAuctionVariables`:
const getLotsByAuctionVars: GetLotsByAuctionVariables = {
  auctionId: ..., 
};

// Call the `getLotsByAuction()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getLotsByAuction(getLotsByAuctionVars);
// Variables can be defined inline as well.
const { data } = await getLotsByAuction({ auctionId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getLotsByAuction(dataConnect, getLotsByAuctionVars);

console.log(data.auctionLots);

// Or, you can use the `Promise` API.
getLotsByAuction(getLotsByAuctionVars).then((response) => {
  const data = response.data;
  console.log(data.auctionLots);
});
```

### Using `GetLotsByAuction`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getLotsByAuctionRef, GetLotsByAuctionVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetLotsByAuction` query requires an argument of type `GetLotsByAuctionVariables`:
const getLotsByAuctionVars: GetLotsByAuctionVariables = {
  auctionId: ..., 
};

// Call the `getLotsByAuctionRef()` function to get a reference to the query.
const ref = getLotsByAuctionRef(getLotsByAuctionVars);
// Variables can be defined inline as well.
const ref = getLotsByAuctionRef({ auctionId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getLotsByAuctionRef(dataConnect, getLotsByAuctionVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctionLots);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionLots);
});
```

## GetLotById
You can execute the `GetLotById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getLotById(vars: GetLotByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetLotByIdData, GetLotByIdVariables>;

interface GetLotByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLotByIdVariables): QueryRef<GetLotByIdData, GetLotByIdVariables>;
}
export const getLotByIdRef: GetLotByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getLotById(dc: DataConnect, vars: GetLotByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetLotByIdData, GetLotByIdVariables>;

interface GetLotByIdRef {
  ...
  (dc: DataConnect, vars: GetLotByIdVariables): QueryRef<GetLotByIdData, GetLotByIdVariables>;
}
export const getLotByIdRef: GetLotByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getLotByIdRef:
```typescript
const name = getLotByIdRef.operationName;
console.log(name);
```

### Variables
The `GetLotById` query requires an argument of type `GetLotByIdVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetLotByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetLotById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetLotByIdData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetLotById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getLotById, GetLotByIdVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetLotById` query requires an argument of type `GetLotByIdVariables`:
const getLotByIdVars: GetLotByIdVariables = {
  id: ..., 
};

// Call the `getLotById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getLotById(getLotByIdVars);
// Variables can be defined inline as well.
const { data } = await getLotById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getLotById(dataConnect, getLotByIdVars);

console.log(data.auctionLot);

// Or, you can use the `Promise` API.
getLotById(getLotByIdVars).then((response) => {
  const data = response.data;
  console.log(data.auctionLot);
});
```

### Using `GetLotById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getLotByIdRef, GetLotByIdVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetLotById` query requires an argument of type `GetLotByIdVariables`:
const getLotByIdVars: GetLotByIdVariables = {
  id: ..., 
};

// Call the `getLotByIdRef()` function to get a reference to the query.
const ref = getLotByIdRef(getLotByIdVars);
// Variables can be defined inline as well.
const ref = getLotByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getLotByIdRef(dataConnect, getLotByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctionLot);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionLot);
});
```

## GetPromotedLots
You can execute the `GetPromotedLots` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getPromotedLots(vars: GetPromotedLotsVariables, options?: ExecuteQueryOptions): QueryPromise<GetPromotedLotsData, GetPromotedLotsVariables>;

interface GetPromotedLotsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetPromotedLotsVariables): QueryRef<GetPromotedLotsData, GetPromotedLotsVariables>;
}
export const getPromotedLotsRef: GetPromotedLotsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPromotedLots(dc: DataConnect, vars: GetPromotedLotsVariables, options?: ExecuteQueryOptions): QueryPromise<GetPromotedLotsData, GetPromotedLotsVariables>;

interface GetPromotedLotsRef {
  ...
  (dc: DataConnect, vars: GetPromotedLotsVariables): QueryRef<GetPromotedLotsData, GetPromotedLotsVariables>;
}
export const getPromotedLotsRef: GetPromotedLotsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPromotedLotsRef:
```typescript
const name = getPromotedLotsRef.operationName;
console.log(name);
```

### Variables
The `GetPromotedLots` query requires an argument of type `GetPromotedLotsVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetPromotedLotsVariables {
  auctionId: string;
}
```
### Return Type
Recall that executing the `GetPromotedLots` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPromotedLotsData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetPromotedLots`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPromotedLots, GetPromotedLotsVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetPromotedLots` query requires an argument of type `GetPromotedLotsVariables`:
const getPromotedLotsVars: GetPromotedLotsVariables = {
  auctionId: ..., 
};

// Call the `getPromotedLots()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPromotedLots(getPromotedLotsVars);
// Variables can be defined inline as well.
const { data } = await getPromotedLots({ auctionId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPromotedLots(dataConnect, getPromotedLotsVars);

console.log(data.auctionLots);

// Or, you can use the `Promise` API.
getPromotedLots(getPromotedLotsVars).then((response) => {
  const data = response.data;
  console.log(data.auctionLots);
});
```

### Using `GetPromotedLots`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPromotedLotsRef, GetPromotedLotsVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetPromotedLots` query requires an argument of type `GetPromotedLotsVariables`:
const getPromotedLotsVars: GetPromotedLotsVariables = {
  auctionId: ..., 
};

// Call the `getPromotedLotsRef()` function to get a reference to the query.
const ref = getPromotedLotsRef(getPromotedLotsVars);
// Variables can be defined inline as well.
const ref = getPromotedLotsRef({ auctionId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPromotedLotsRef(dataConnect, getPromotedLotsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctionLots);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionLots);
});
```

## GetBidsByLot
You can execute the `GetBidsByLot` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getBidsByLot(vars: GetBidsByLotVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidsByLotData, GetBidsByLotVariables>;

interface GetBidsByLotRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBidsByLotVariables): QueryRef<GetBidsByLotData, GetBidsByLotVariables>;
}
export const getBidsByLotRef: GetBidsByLotRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBidsByLot(dc: DataConnect, vars: GetBidsByLotVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidsByLotData, GetBidsByLotVariables>;

interface GetBidsByLotRef {
  ...
  (dc: DataConnect, vars: GetBidsByLotVariables): QueryRef<GetBidsByLotData, GetBidsByLotVariables>;
}
export const getBidsByLotRef: GetBidsByLotRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBidsByLotRef:
```typescript
const name = getBidsByLotRef.operationName;
console.log(name);
```

### Variables
The `GetBidsByLot` query requires an argument of type `GetBidsByLotVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBidsByLotVariables {
  auctionId: string;
  lotId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `GetBidsByLot` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBidsByLotData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetBidsByLot`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBidsByLot, GetBidsByLotVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetBidsByLot` query requires an argument of type `GetBidsByLotVariables`:
const getBidsByLotVars: GetBidsByLotVariables = {
  auctionId: ..., 
  lotId: ..., 
  limit: ..., // optional
};

// Call the `getBidsByLot()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBidsByLot(getBidsByLotVars);
// Variables can be defined inline as well.
const { data } = await getBidsByLot({ auctionId: ..., lotId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBidsByLot(dataConnect, getBidsByLotVars);

console.log(data.auctionBids);

// Or, you can use the `Promise` API.
getBidsByLot(getBidsByLotVars).then((response) => {
  const data = response.data;
  console.log(data.auctionBids);
});
```

### Using `GetBidsByLot`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBidsByLotRef, GetBidsByLotVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetBidsByLot` query requires an argument of type `GetBidsByLotVariables`:
const getBidsByLotVars: GetBidsByLotVariables = {
  auctionId: ..., 
  lotId: ..., 
  limit: ..., // optional
};

// Call the `getBidsByLotRef()` function to get a reference to the query.
const ref = getBidsByLotRef(getBidsByLotVars);
// Variables can be defined inline as well.
const ref = getBidsByLotRef({ auctionId: ..., lotId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBidsByLotRef(dataConnect, getBidsByLotVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctionBids);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionBids);
});
```

## GetBidsByBidder
You can execute the `GetBidsByBidder` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getBidsByBidder(vars: GetBidsByBidderVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidsByBidderData, GetBidsByBidderVariables>;

interface GetBidsByBidderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBidsByBidderVariables): QueryRef<GetBidsByBidderData, GetBidsByBidderVariables>;
}
export const getBidsByBidderRef: GetBidsByBidderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBidsByBidder(dc: DataConnect, vars: GetBidsByBidderVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidsByBidderData, GetBidsByBidderVariables>;

interface GetBidsByBidderRef {
  ...
  (dc: DataConnect, vars: GetBidsByBidderVariables): QueryRef<GetBidsByBidderData, GetBidsByBidderVariables>;
}
export const getBidsByBidderRef: GetBidsByBidderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBidsByBidderRef:
```typescript
const name = getBidsByBidderRef.operationName;
console.log(name);
```

### Variables
The `GetBidsByBidder` query requires an argument of type `GetBidsByBidderVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBidsByBidderVariables {
  bidderId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `GetBidsByBidder` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBidsByBidderData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetBidsByBidder`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBidsByBidder, GetBidsByBidderVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetBidsByBidder` query requires an argument of type `GetBidsByBidderVariables`:
const getBidsByBidderVars: GetBidsByBidderVariables = {
  bidderId: ..., 
  limit: ..., // optional
};

// Call the `getBidsByBidder()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBidsByBidder(getBidsByBidderVars);
// Variables can be defined inline as well.
const { data } = await getBidsByBidder({ bidderId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBidsByBidder(dataConnect, getBidsByBidderVars);

console.log(data.auctionBids);

// Or, you can use the `Promise` API.
getBidsByBidder(getBidsByBidderVars).then((response) => {
  const data = response.data;
  console.log(data.auctionBids);
});
```

### Using `GetBidsByBidder`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBidsByBidderRef, GetBidsByBidderVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetBidsByBidder` query requires an argument of type `GetBidsByBidderVariables`:
const getBidsByBidderVars: GetBidsByBidderVariables = {
  bidderId: ..., 
  limit: ..., // optional
};

// Call the `getBidsByBidderRef()` function to get a reference to the query.
const ref = getBidsByBidderRef(getBidsByBidderVars);
// Variables can be defined inline as well.
const ref = getBidsByBidderRef({ bidderId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBidsByBidderRef(dataConnect, getBidsByBidderVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctionBids);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionBids);
});
```

## GetAuctionInvoicesByBuyer
You can execute the `GetAuctionInvoicesByBuyer` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getAuctionInvoicesByBuyer(vars: GetAuctionInvoicesByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;

interface GetAuctionInvoicesByBuyerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionInvoicesByBuyerVariables): QueryRef<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;
}
export const getAuctionInvoicesByBuyerRef: GetAuctionInvoicesByBuyerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAuctionInvoicesByBuyer(dc: DataConnect, vars: GetAuctionInvoicesByBuyerVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;

interface GetAuctionInvoicesByBuyerRef {
  ...
  (dc: DataConnect, vars: GetAuctionInvoicesByBuyerVariables): QueryRef<GetAuctionInvoicesByBuyerData, GetAuctionInvoicesByBuyerVariables>;
}
export const getAuctionInvoicesByBuyerRef: GetAuctionInvoicesByBuyerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAuctionInvoicesByBuyerRef:
```typescript
const name = getAuctionInvoicesByBuyerRef.operationName;
console.log(name);
```

### Variables
The `GetAuctionInvoicesByBuyer` query requires an argument of type `GetAuctionInvoicesByBuyerVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAuctionInvoicesByBuyerVariables {
  buyerId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `GetAuctionInvoicesByBuyer` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAuctionInvoicesByBuyerData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetAuctionInvoicesByBuyer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAuctionInvoicesByBuyer, GetAuctionInvoicesByBuyerVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionInvoicesByBuyer` query requires an argument of type `GetAuctionInvoicesByBuyerVariables`:
const getAuctionInvoicesByBuyerVars: GetAuctionInvoicesByBuyerVariables = {
  buyerId: ..., 
  limit: ..., // optional
};

// Call the `getAuctionInvoicesByBuyer()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAuctionInvoicesByBuyer(getAuctionInvoicesByBuyerVars);
// Variables can be defined inline as well.
const { data } = await getAuctionInvoicesByBuyer({ buyerId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAuctionInvoicesByBuyer(dataConnect, getAuctionInvoicesByBuyerVars);

console.log(data.auctionInvoices);

// Or, you can use the `Promise` API.
getAuctionInvoicesByBuyer(getAuctionInvoicesByBuyerVars).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoices);
});
```

### Using `GetAuctionInvoicesByBuyer`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAuctionInvoicesByBuyerRef, GetAuctionInvoicesByBuyerVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionInvoicesByBuyer` query requires an argument of type `GetAuctionInvoicesByBuyerVariables`:
const getAuctionInvoicesByBuyerVars: GetAuctionInvoicesByBuyerVariables = {
  buyerId: ..., 
  limit: ..., // optional
};

// Call the `getAuctionInvoicesByBuyerRef()` function to get a reference to the query.
const ref = getAuctionInvoicesByBuyerRef(getAuctionInvoicesByBuyerVars);
// Variables can be defined inline as well.
const ref = getAuctionInvoicesByBuyerRef({ buyerId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAuctionInvoicesByBuyerRef(dataConnect, getAuctionInvoicesByBuyerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctionInvoices);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoices);
});
```

## GetAuctionInvoicesByAuction
You can execute the `GetAuctionInvoicesByAuction` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getAuctionInvoicesByAuction(vars: GetAuctionInvoicesByAuctionVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;

interface GetAuctionInvoicesByAuctionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionInvoicesByAuctionVariables): QueryRef<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;
}
export const getAuctionInvoicesByAuctionRef: GetAuctionInvoicesByAuctionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAuctionInvoicesByAuction(dc: DataConnect, vars: GetAuctionInvoicesByAuctionVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;

interface GetAuctionInvoicesByAuctionRef {
  ...
  (dc: DataConnect, vars: GetAuctionInvoicesByAuctionVariables): QueryRef<GetAuctionInvoicesByAuctionData, GetAuctionInvoicesByAuctionVariables>;
}
export const getAuctionInvoicesByAuctionRef: GetAuctionInvoicesByAuctionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAuctionInvoicesByAuctionRef:
```typescript
const name = getAuctionInvoicesByAuctionRef.operationName;
console.log(name);
```

### Variables
The `GetAuctionInvoicesByAuction` query requires an argument of type `GetAuctionInvoicesByAuctionVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAuctionInvoicesByAuctionVariables {
  auctionId: string;
}
```
### Return Type
Recall that executing the `GetAuctionInvoicesByAuction` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAuctionInvoicesByAuctionData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetAuctionInvoicesByAuction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAuctionInvoicesByAuction, GetAuctionInvoicesByAuctionVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionInvoicesByAuction` query requires an argument of type `GetAuctionInvoicesByAuctionVariables`:
const getAuctionInvoicesByAuctionVars: GetAuctionInvoicesByAuctionVariables = {
  auctionId: ..., 
};

// Call the `getAuctionInvoicesByAuction()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAuctionInvoicesByAuction(getAuctionInvoicesByAuctionVars);
// Variables can be defined inline as well.
const { data } = await getAuctionInvoicesByAuction({ auctionId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAuctionInvoicesByAuction(dataConnect, getAuctionInvoicesByAuctionVars);

console.log(data.auctionInvoices);

// Or, you can use the `Promise` API.
getAuctionInvoicesByAuction(getAuctionInvoicesByAuctionVars).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoices);
});
```

### Using `GetAuctionInvoicesByAuction`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAuctionInvoicesByAuctionRef, GetAuctionInvoicesByAuctionVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionInvoicesByAuction` query requires an argument of type `GetAuctionInvoicesByAuctionVariables`:
const getAuctionInvoicesByAuctionVars: GetAuctionInvoicesByAuctionVariables = {
  auctionId: ..., 
};

// Call the `getAuctionInvoicesByAuctionRef()` function to get a reference to the query.
const ref = getAuctionInvoicesByAuctionRef(getAuctionInvoicesByAuctionVars);
// Variables can be defined inline as well.
const ref = getAuctionInvoicesByAuctionRef({ auctionId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAuctionInvoicesByAuctionRef(dataConnect, getAuctionInvoicesByAuctionVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctionInvoices);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoices);
});
```

## GetAuctionInvoiceById
You can execute the `GetAuctionInvoiceById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getAuctionInvoiceById(vars: GetAuctionInvoiceByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;

interface GetAuctionInvoiceByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAuctionInvoiceByIdVariables): QueryRef<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;
}
export const getAuctionInvoiceByIdRef: GetAuctionInvoiceByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAuctionInvoiceById(dc: DataConnect, vars: GetAuctionInvoiceByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;

interface GetAuctionInvoiceByIdRef {
  ...
  (dc: DataConnect, vars: GetAuctionInvoiceByIdVariables): QueryRef<GetAuctionInvoiceByIdData, GetAuctionInvoiceByIdVariables>;
}
export const getAuctionInvoiceByIdRef: GetAuctionInvoiceByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAuctionInvoiceByIdRef:
```typescript
const name = getAuctionInvoiceByIdRef.operationName;
console.log(name);
```

### Variables
The `GetAuctionInvoiceById` query requires an argument of type `GetAuctionInvoiceByIdVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAuctionInvoiceByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetAuctionInvoiceById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAuctionInvoiceByIdData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetAuctionInvoiceById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAuctionInvoiceById, GetAuctionInvoiceByIdVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionInvoiceById` query requires an argument of type `GetAuctionInvoiceByIdVariables`:
const getAuctionInvoiceByIdVars: GetAuctionInvoiceByIdVariables = {
  id: ..., 
};

// Call the `getAuctionInvoiceById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAuctionInvoiceById(getAuctionInvoiceByIdVars);
// Variables can be defined inline as well.
const { data } = await getAuctionInvoiceById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAuctionInvoiceById(dataConnect, getAuctionInvoiceByIdVars);

console.log(data.auctionInvoice);

// Or, you can use the `Promise` API.
getAuctionInvoiceById(getAuctionInvoiceByIdVars).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoice);
});
```

### Using `GetAuctionInvoiceById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAuctionInvoiceByIdRef, GetAuctionInvoiceByIdVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetAuctionInvoiceById` query requires an argument of type `GetAuctionInvoiceByIdVariables`:
const getAuctionInvoiceByIdVars: GetAuctionInvoiceByIdVariables = {
  id: ..., 
};

// Call the `getAuctionInvoiceByIdRef()` function to get a reference to the query.
const ref = getAuctionInvoiceByIdRef(getAuctionInvoiceByIdVars);
// Variables can be defined inline as well.
const ref = getAuctionInvoiceByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAuctionInvoiceByIdRef(dataConnect, getAuctionInvoiceByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.auctionInvoice);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoice);
});
```

## GetBidderProfileByUserId
You can execute the `GetBidderProfileByUserId` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
getBidderProfileByUserId(vars: GetBidderProfileByUserIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;

interface GetBidderProfileByUserIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBidderProfileByUserIdVariables): QueryRef<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;
}
export const getBidderProfileByUserIdRef: GetBidderProfileByUserIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBidderProfileByUserId(dc: DataConnect, vars: GetBidderProfileByUserIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;

interface GetBidderProfileByUserIdRef {
  ...
  (dc: DataConnect, vars: GetBidderProfileByUserIdVariables): QueryRef<GetBidderProfileByUserIdData, GetBidderProfileByUserIdVariables>;
}
export const getBidderProfileByUserIdRef: GetBidderProfileByUserIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBidderProfileByUserIdRef:
```typescript
const name = getBidderProfileByUserIdRef.operationName;
console.log(name);
```

### Variables
The `GetBidderProfileByUserId` query requires an argument of type `GetBidderProfileByUserIdVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBidderProfileByUserIdVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `GetBidderProfileByUserId` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBidderProfileByUserIdData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetBidderProfileByUserId`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBidderProfileByUserId, GetBidderProfileByUserIdVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetBidderProfileByUserId` query requires an argument of type `GetBidderProfileByUserIdVariables`:
const getBidderProfileByUserIdVars: GetBidderProfileByUserIdVariables = {
  userId: ..., 
};

// Call the `getBidderProfileByUserId()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBidderProfileByUserId(getBidderProfileByUserIdVars);
// Variables can be defined inline as well.
const { data } = await getBidderProfileByUserId({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBidderProfileByUserId(dataConnect, getBidderProfileByUserIdVars);

console.log(data.bidderProfiles);

// Or, you can use the `Promise` API.
getBidderProfileByUserId(getBidderProfileByUserIdVars).then((response) => {
  const data = response.data;
  console.log(data.bidderProfiles);
});
```

### Using `GetBidderProfileByUserId`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBidderProfileByUserIdRef, GetBidderProfileByUserIdVariables } from '@dataconnect/generated-timberequip-auctions';

// The `GetBidderProfileByUserId` query requires an argument of type `GetBidderProfileByUserIdVariables`:
const getBidderProfileByUserIdVars: GetBidderProfileByUserIdVariables = {
  userId: ..., 
};

// Call the `getBidderProfileByUserIdRef()` function to get a reference to the query.
const ref = getBidderProfileByUserIdRef(getBidderProfileByUserIdVars);
// Variables can be defined inline as well.
const ref = getBidderProfileByUserIdRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBidderProfileByUserIdRef(dataConnect, getBidderProfileByUserIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.bidderProfiles);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.bidderProfiles);
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

Below are examples of how to use the `auctions` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertAuction
You can execute the `UpsertAuction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
upsertAuction(vars: UpsertAuctionVariables): MutationPromise<UpsertAuctionData, UpsertAuctionVariables>;

interface UpsertAuctionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertAuctionVariables): MutationRef<UpsertAuctionData, UpsertAuctionVariables>;
}
export const upsertAuctionRef: UpsertAuctionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertAuction(dc: DataConnect, vars: UpsertAuctionVariables): MutationPromise<UpsertAuctionData, UpsertAuctionVariables>;

interface UpsertAuctionRef {
  ...
  (dc: DataConnect, vars: UpsertAuctionVariables): MutationRef<UpsertAuctionData, UpsertAuctionVariables>;
}
export const upsertAuctionRef: UpsertAuctionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertAuctionRef:
```typescript
const name = upsertAuctionRef.operationName;
console.log(name);
```

### Variables
The `UpsertAuction` mutation requires an argument of type `UpsertAuctionVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertAuction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertAuctionData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertAuctionData {
  auction_upsert: Auction_Key;
}
```
### Using `UpsertAuction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertAuction, UpsertAuctionVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpsertAuction` mutation requires an argument of type `UpsertAuctionVariables`:
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

// Call the `upsertAuction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertAuction(upsertAuctionVars);
// Variables can be defined inline as well.
const { data } = await upsertAuction({ id: ..., title: ..., slug: ..., description: ..., coverImageUrl: ..., startTime: ..., endTime: ..., previewStartTime: ..., status: ..., lotCount: ..., totalBids: ..., totalGmv: ..., defaultBuyerPremiumPercent: ..., softCloseThresholdMin: ..., softCloseExtensionMin: ..., staggerIntervalMin: ..., defaultPaymentDeadlineDays: ..., defaultRemovalDeadlineDays: ..., termsAndConditionsUrl: ..., featured: ..., bannerEnabled: ..., bannerImageUrl: ..., createdBy: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertAuction(dataConnect, upsertAuctionVars);

console.log(data.auction_upsert);

// Or, you can use the `Promise` API.
upsertAuction(upsertAuctionVars).then((response) => {
  const data = response.data;
  console.log(data.auction_upsert);
});
```

### Using `UpsertAuction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertAuctionRef, UpsertAuctionVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpsertAuction` mutation requires an argument of type `UpsertAuctionVariables`:
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

// Call the `upsertAuctionRef()` function to get a reference to the mutation.
const ref = upsertAuctionRef(upsertAuctionVars);
// Variables can be defined inline as well.
const ref = upsertAuctionRef({ id: ..., title: ..., slug: ..., description: ..., coverImageUrl: ..., startTime: ..., endTime: ..., previewStartTime: ..., status: ..., lotCount: ..., totalBids: ..., totalGmv: ..., defaultBuyerPremiumPercent: ..., softCloseThresholdMin: ..., softCloseExtensionMin: ..., staggerIntervalMin: ..., defaultPaymentDeadlineDays: ..., defaultRemovalDeadlineDays: ..., termsAndConditionsUrl: ..., featured: ..., bannerEnabled: ..., bannerImageUrl: ..., createdBy: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertAuctionRef(dataConnect, upsertAuctionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auction_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auction_upsert);
});
```

## UpsertAuctionLot
You can execute the `UpsertAuctionLot` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
upsertAuctionLot(vars: UpsertAuctionLotVariables): MutationPromise<UpsertAuctionLotData, UpsertAuctionLotVariables>;

interface UpsertAuctionLotRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertAuctionLotVariables): MutationRef<UpsertAuctionLotData, UpsertAuctionLotVariables>;
}
export const upsertAuctionLotRef: UpsertAuctionLotRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertAuctionLot(dc: DataConnect, vars: UpsertAuctionLotVariables): MutationPromise<UpsertAuctionLotData, UpsertAuctionLotVariables>;

interface UpsertAuctionLotRef {
  ...
  (dc: DataConnect, vars: UpsertAuctionLotVariables): MutationRef<UpsertAuctionLotData, UpsertAuctionLotVariables>;
}
export const upsertAuctionLotRef: UpsertAuctionLotRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertAuctionLotRef:
```typescript
const name = upsertAuctionLotRef.operationName;
console.log(name);
```

### Variables
The `UpsertAuctionLot` mutation requires an argument of type `UpsertAuctionLotVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertAuctionLot` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertAuctionLotData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertAuctionLotData {
  auctionLot_upsert: AuctionLot_Key;
}
```
### Using `UpsertAuctionLot`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertAuctionLot, UpsertAuctionLotVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpsertAuctionLot` mutation requires an argument of type `UpsertAuctionLotVariables`:
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

// Call the `upsertAuctionLot()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertAuctionLot(upsertAuctionLotVars);
// Variables can be defined inline as well.
const { data } = await upsertAuctionLot({ id: ..., auctionId: ..., listingId: ..., lotNumber: ..., closeOrder: ..., startingBid: ..., reservePrice: ..., reserveMet: ..., buyerPremiumPercent: ..., startTime: ..., endTime: ..., originalEndTime: ..., extensionCount: ..., currentBid: ..., currentBidderId: ..., currentBidderAnonymousId: ..., bidCount: ..., uniqueBidders: ..., lastBidTime: ..., status: ..., promoted: ..., promotedOrder: ..., winningBidderId: ..., winningBid: ..., watcherCount: ..., title: ..., manufacturer: ..., model: ..., year: ..., thumbnailUrl: ..., pickupLocation: ..., paymentDeadlineDays: ..., removalDeadlineDays: ..., storageFeePerDay: ..., isTitledItem: ..., titleDocumentFee: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertAuctionLot(dataConnect, upsertAuctionLotVars);

console.log(data.auctionLot_upsert);

// Or, you can use the `Promise` API.
upsertAuctionLot(upsertAuctionLotVars).then((response) => {
  const data = response.data;
  console.log(data.auctionLot_upsert);
});
```

### Using `UpsertAuctionLot`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertAuctionLotRef, UpsertAuctionLotVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpsertAuctionLot` mutation requires an argument of type `UpsertAuctionLotVariables`:
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

// Call the `upsertAuctionLotRef()` function to get a reference to the mutation.
const ref = upsertAuctionLotRef(upsertAuctionLotVars);
// Variables can be defined inline as well.
const ref = upsertAuctionLotRef({ id: ..., auctionId: ..., listingId: ..., lotNumber: ..., closeOrder: ..., startingBid: ..., reservePrice: ..., reserveMet: ..., buyerPremiumPercent: ..., startTime: ..., endTime: ..., originalEndTime: ..., extensionCount: ..., currentBid: ..., currentBidderId: ..., currentBidderAnonymousId: ..., bidCount: ..., uniqueBidders: ..., lastBidTime: ..., status: ..., promoted: ..., promotedOrder: ..., winningBidderId: ..., winningBid: ..., watcherCount: ..., title: ..., manufacturer: ..., model: ..., year: ..., thumbnailUrl: ..., pickupLocation: ..., paymentDeadlineDays: ..., removalDeadlineDays: ..., storageFeePerDay: ..., isTitledItem: ..., titleDocumentFee: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertAuctionLotRef(dataConnect, upsertAuctionLotVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auctionLot_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionLot_upsert);
});
```

## InsertAuctionBid
You can execute the `InsertAuctionBid` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
insertAuctionBid(vars: InsertAuctionBidVariables): MutationPromise<InsertAuctionBidData, InsertAuctionBidVariables>;

interface InsertAuctionBidRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertAuctionBidVariables): MutationRef<InsertAuctionBidData, InsertAuctionBidVariables>;
}
export const insertAuctionBidRef: InsertAuctionBidRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertAuctionBid(dc: DataConnect, vars: InsertAuctionBidVariables): MutationPromise<InsertAuctionBidData, InsertAuctionBidVariables>;

interface InsertAuctionBidRef {
  ...
  (dc: DataConnect, vars: InsertAuctionBidVariables): MutationRef<InsertAuctionBidData, InsertAuctionBidVariables>;
}
export const insertAuctionBidRef: InsertAuctionBidRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertAuctionBidRef:
```typescript
const name = insertAuctionBidRef.operationName;
console.log(name);
```

### Variables
The `InsertAuctionBid` mutation requires an argument of type `InsertAuctionBidVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `InsertAuctionBid` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertAuctionBidData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertAuctionBidData {
  auctionBid_insert: AuctionBid_Key;
}
```
### Using `InsertAuctionBid`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertAuctionBid, InsertAuctionBidVariables } from '@dataconnect/generated-timberequip-auctions';

// The `InsertAuctionBid` mutation requires an argument of type `InsertAuctionBidVariables`:
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

// Call the `insertAuctionBid()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertAuctionBid(insertAuctionBidVars);
// Variables can be defined inline as well.
const { data } = await insertAuctionBid({ id: ..., auctionId: ..., lotId: ..., bidderId: ..., bidderAnonymousId: ..., amount: ..., maxBid: ..., type: ..., status: ..., triggeredExtension: ..., bidTime: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertAuctionBid(dataConnect, insertAuctionBidVars);

console.log(data.auctionBid_insert);

// Or, you can use the `Promise` API.
insertAuctionBid(insertAuctionBidVars).then((response) => {
  const data = response.data;
  console.log(data.auctionBid_insert);
});
```

### Using `InsertAuctionBid`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertAuctionBidRef, InsertAuctionBidVariables } from '@dataconnect/generated-timberequip-auctions';

// The `InsertAuctionBid` mutation requires an argument of type `InsertAuctionBidVariables`:
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

// Call the `insertAuctionBidRef()` function to get a reference to the mutation.
const ref = insertAuctionBidRef(insertAuctionBidVars);
// Variables can be defined inline as well.
const ref = insertAuctionBidRef({ id: ..., auctionId: ..., lotId: ..., bidderId: ..., bidderAnonymousId: ..., amount: ..., maxBid: ..., type: ..., status: ..., triggeredExtension: ..., bidTime: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertAuctionBidRef(dataConnect, insertAuctionBidVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auctionBid_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionBid_insert);
});
```

## UpdateBidStatus
You can execute the `UpdateBidStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
updateBidStatus(vars: UpdateBidStatusVariables): MutationPromise<UpdateBidStatusData, UpdateBidStatusVariables>;

interface UpdateBidStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBidStatusVariables): MutationRef<UpdateBidStatusData, UpdateBidStatusVariables>;
}
export const updateBidStatusRef: UpdateBidStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateBidStatus(dc: DataConnect, vars: UpdateBidStatusVariables): MutationPromise<UpdateBidStatusData, UpdateBidStatusVariables>;

interface UpdateBidStatusRef {
  ...
  (dc: DataConnect, vars: UpdateBidStatusVariables): MutationRef<UpdateBidStatusData, UpdateBidStatusVariables>;
}
export const updateBidStatusRef: UpdateBidStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateBidStatusRef:
```typescript
const name = updateBidStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateBidStatus` mutation requires an argument of type `UpdateBidStatusVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateBidStatusVariables {
  id: string;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateBidStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateBidStatusData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateBidStatusData {
  auctionBid_update?: AuctionBid_Key | null;
}
```
### Using `UpdateBidStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateBidStatus, UpdateBidStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateBidStatus` mutation requires an argument of type `UpdateBidStatusVariables`:
const updateBidStatusVars: UpdateBidStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateBidStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateBidStatus(updateBidStatusVars);
// Variables can be defined inline as well.
const { data } = await updateBidStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateBidStatus(dataConnect, updateBidStatusVars);

console.log(data.auctionBid_update);

// Or, you can use the `Promise` API.
updateBidStatus(updateBidStatusVars).then((response) => {
  const data = response.data;
  console.log(data.auctionBid_update);
});
```

### Using `UpdateBidStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateBidStatusRef, UpdateBidStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateBidStatus` mutation requires an argument of type `UpdateBidStatusVariables`:
const updateBidStatusVars: UpdateBidStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateBidStatusRef()` function to get a reference to the mutation.
const ref = updateBidStatusRef(updateBidStatusVars);
// Variables can be defined inline as well.
const ref = updateBidStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateBidStatusRef(dataConnect, updateBidStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auctionBid_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionBid_update);
});
```

## UpsertAuctionInvoice
You can execute the `UpsertAuctionInvoice` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
upsertAuctionInvoice(vars: UpsertAuctionInvoiceVariables): MutationPromise<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;

interface UpsertAuctionInvoiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertAuctionInvoiceVariables): MutationRef<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;
}
export const upsertAuctionInvoiceRef: UpsertAuctionInvoiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertAuctionInvoice(dc: DataConnect, vars: UpsertAuctionInvoiceVariables): MutationPromise<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;

interface UpsertAuctionInvoiceRef {
  ...
  (dc: DataConnect, vars: UpsertAuctionInvoiceVariables): MutationRef<UpsertAuctionInvoiceData, UpsertAuctionInvoiceVariables>;
}
export const upsertAuctionInvoiceRef: UpsertAuctionInvoiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertAuctionInvoiceRef:
```typescript
const name = upsertAuctionInvoiceRef.operationName;
console.log(name);
```

### Variables
The `UpsertAuctionInvoice` mutation requires an argument of type `UpsertAuctionInvoiceVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertAuctionInvoice` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertAuctionInvoiceData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertAuctionInvoiceData {
  auctionInvoice_upsert: AuctionInvoice_Key;
}
```
### Using `UpsertAuctionInvoice`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertAuctionInvoice, UpsertAuctionInvoiceVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpsertAuctionInvoice` mutation requires an argument of type `UpsertAuctionInvoiceVariables`:
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

// Call the `upsertAuctionInvoice()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertAuctionInvoice(upsertAuctionInvoiceVars);
// Variables can be defined inline as well.
const { data } = await upsertAuctionInvoice({ id: ..., auctionId: ..., lotId: ..., buyerId: ..., sellerId: ..., hammerPrice: ..., buyerPremium: ..., documentationFee: ..., cardProcessingFee: ..., salesTaxRate: ..., salesTaxAmount: ..., salesTaxState: ..., totalDue: ..., currency: ..., status: ..., paymentMethod: ..., stripeInvoiceId: ..., stripeCheckoutSessionId: ..., stripePaymentIntentId: ..., buyerTaxExempt: ..., buyerTaxExemptState: ..., buyerTaxExemptCertificateUrl: ..., dueDate: ..., paidAt: ..., sellerCommission: ..., sellerPayout: ..., sellerPaidAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertAuctionInvoice(dataConnect, upsertAuctionInvoiceVars);

console.log(data.auctionInvoice_upsert);

// Or, you can use the `Promise` API.
upsertAuctionInvoice(upsertAuctionInvoiceVars).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoice_upsert);
});
```

### Using `UpsertAuctionInvoice`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertAuctionInvoiceRef, UpsertAuctionInvoiceVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpsertAuctionInvoice` mutation requires an argument of type `UpsertAuctionInvoiceVariables`:
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

// Call the `upsertAuctionInvoiceRef()` function to get a reference to the mutation.
const ref = upsertAuctionInvoiceRef(upsertAuctionInvoiceVars);
// Variables can be defined inline as well.
const ref = upsertAuctionInvoiceRef({ id: ..., auctionId: ..., lotId: ..., buyerId: ..., sellerId: ..., hammerPrice: ..., buyerPremium: ..., documentationFee: ..., cardProcessingFee: ..., salesTaxRate: ..., salesTaxAmount: ..., salesTaxState: ..., totalDue: ..., currency: ..., status: ..., paymentMethod: ..., stripeInvoiceId: ..., stripeCheckoutSessionId: ..., stripePaymentIntentId: ..., buyerTaxExempt: ..., buyerTaxExemptState: ..., buyerTaxExemptCertificateUrl: ..., dueDate: ..., paidAt: ..., sellerCommission: ..., sellerPayout: ..., sellerPaidAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertAuctionInvoiceRef(dataConnect, upsertAuctionInvoiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auctionInvoice_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoice_upsert);
});
```

## UpdateAuctionInvoiceStatus
You can execute the `UpdateAuctionInvoiceStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
updateAuctionInvoiceStatus(vars: UpdateAuctionInvoiceStatusVariables): MutationPromise<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;

interface UpdateAuctionInvoiceStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionInvoiceStatusVariables): MutationRef<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;
}
export const updateAuctionInvoiceStatusRef: UpdateAuctionInvoiceStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateAuctionInvoiceStatus(dc: DataConnect, vars: UpdateAuctionInvoiceStatusVariables): MutationPromise<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;

interface UpdateAuctionInvoiceStatusRef {
  ...
  (dc: DataConnect, vars: UpdateAuctionInvoiceStatusVariables): MutationRef<UpdateAuctionInvoiceStatusData, UpdateAuctionInvoiceStatusVariables>;
}
export const updateAuctionInvoiceStatusRef: UpdateAuctionInvoiceStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateAuctionInvoiceStatusRef:
```typescript
const name = updateAuctionInvoiceStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateAuctionInvoiceStatus` mutation requires an argument of type `UpdateAuctionInvoiceStatusVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateAuctionInvoiceStatusVariables {
  id: string;
  status: string;
  paidAt?: TimestampString | null;
  paymentMethod?: string | null;
}
```
### Return Type
Recall that executing the `UpdateAuctionInvoiceStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateAuctionInvoiceStatusData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateAuctionInvoiceStatusData {
  auctionInvoice_update?: AuctionInvoice_Key | null;
}
```
### Using `UpdateAuctionInvoiceStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateAuctionInvoiceStatus, UpdateAuctionInvoiceStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionInvoiceStatus` mutation requires an argument of type `UpdateAuctionInvoiceStatusVariables`:
const updateAuctionInvoiceStatusVars: UpdateAuctionInvoiceStatusVariables = {
  id: ..., 
  status: ..., 
  paidAt: ..., // optional
  paymentMethod: ..., // optional
};

// Call the `updateAuctionInvoiceStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateAuctionInvoiceStatus(updateAuctionInvoiceStatusVars);
// Variables can be defined inline as well.
const { data } = await updateAuctionInvoiceStatus({ id: ..., status: ..., paidAt: ..., paymentMethod: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateAuctionInvoiceStatus(dataConnect, updateAuctionInvoiceStatusVars);

console.log(data.auctionInvoice_update);

// Or, you can use the `Promise` API.
updateAuctionInvoiceStatus(updateAuctionInvoiceStatusVars).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoice_update);
});
```

### Using `UpdateAuctionInvoiceStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateAuctionInvoiceStatusRef, UpdateAuctionInvoiceStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionInvoiceStatus` mutation requires an argument of type `UpdateAuctionInvoiceStatusVariables`:
const updateAuctionInvoiceStatusVars: UpdateAuctionInvoiceStatusVariables = {
  id: ..., 
  status: ..., 
  paidAt: ..., // optional
  paymentMethod: ..., // optional
};

// Call the `updateAuctionInvoiceStatusRef()` function to get a reference to the mutation.
const ref = updateAuctionInvoiceStatusRef(updateAuctionInvoiceStatusVars);
// Variables can be defined inline as well.
const ref = updateAuctionInvoiceStatusRef({ id: ..., status: ..., paidAt: ..., paymentMethod: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateAuctionInvoiceStatusRef(dataConnect, updateAuctionInvoiceStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auctionInvoice_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionInvoice_update);
});
```

## UpdateAuctionLotBidState
You can execute the `UpdateAuctionLotBidState` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
updateAuctionLotBidState(vars: UpdateAuctionLotBidStateVariables): MutationPromise<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;

interface UpdateAuctionLotBidStateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionLotBidStateVariables): MutationRef<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;
}
export const updateAuctionLotBidStateRef: UpdateAuctionLotBidStateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateAuctionLotBidState(dc: DataConnect, vars: UpdateAuctionLotBidStateVariables): MutationPromise<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;

interface UpdateAuctionLotBidStateRef {
  ...
  (dc: DataConnect, vars: UpdateAuctionLotBidStateVariables): MutationRef<UpdateAuctionLotBidStateData, UpdateAuctionLotBidStateVariables>;
}
export const updateAuctionLotBidStateRef: UpdateAuctionLotBidStateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateAuctionLotBidStateRef:
```typescript
const name = updateAuctionLotBidStateRef.operationName;
console.log(name);
```

### Variables
The `UpdateAuctionLotBidState` mutation requires an argument of type `UpdateAuctionLotBidStateVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateAuctionLotBidState` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateAuctionLotBidStateData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateAuctionLotBidStateData {
  auctionLot_update?: AuctionLot_Key | null;
}
```
### Using `UpdateAuctionLotBidState`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateAuctionLotBidState, UpdateAuctionLotBidStateVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionLotBidState` mutation requires an argument of type `UpdateAuctionLotBidStateVariables`:
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

// Call the `updateAuctionLotBidState()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateAuctionLotBidState(updateAuctionLotBidStateVars);
// Variables can be defined inline as well.
const { data } = await updateAuctionLotBidState({ id: ..., currentBid: ..., currentBidderId: ..., currentBidderAnonymousId: ..., bidCount: ..., uniqueBidders: ..., lastBidTime: ..., reserveMet: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateAuctionLotBidState(dataConnect, updateAuctionLotBidStateVars);

console.log(data.auctionLot_update);

// Or, you can use the `Promise` API.
updateAuctionLotBidState(updateAuctionLotBidStateVars).then((response) => {
  const data = response.data;
  console.log(data.auctionLot_update);
});
```

### Using `UpdateAuctionLotBidState`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateAuctionLotBidStateRef, UpdateAuctionLotBidStateVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionLotBidState` mutation requires an argument of type `UpdateAuctionLotBidStateVariables`:
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

// Call the `updateAuctionLotBidStateRef()` function to get a reference to the mutation.
const ref = updateAuctionLotBidStateRef(updateAuctionLotBidStateVars);
// Variables can be defined inline as well.
const ref = updateAuctionLotBidStateRef({ id: ..., currentBid: ..., currentBidderId: ..., currentBidderAnonymousId: ..., bidCount: ..., uniqueBidders: ..., lastBidTime: ..., reserveMet: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateAuctionLotBidStateRef(dataConnect, updateAuctionLotBidStateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auctionLot_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionLot_update);
});
```

## UpdateAuctionLotStatus
You can execute the `UpdateAuctionLotStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
updateAuctionLotStatus(vars: UpdateAuctionLotStatusVariables): MutationPromise<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;

interface UpdateAuctionLotStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionLotStatusVariables): MutationRef<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;
}
export const updateAuctionLotStatusRef: UpdateAuctionLotStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateAuctionLotStatus(dc: DataConnect, vars: UpdateAuctionLotStatusVariables): MutationPromise<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;

interface UpdateAuctionLotStatusRef {
  ...
  (dc: DataConnect, vars: UpdateAuctionLotStatusVariables): MutationRef<UpdateAuctionLotStatusData, UpdateAuctionLotStatusVariables>;
}
export const updateAuctionLotStatusRef: UpdateAuctionLotStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateAuctionLotStatusRef:
```typescript
const name = updateAuctionLotStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateAuctionLotStatus` mutation requires an argument of type `UpdateAuctionLotStatusVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateAuctionLotStatusVariables {
  id: string;
  status: string;
  winningBidderId?: string | null;
  winningBid?: number | null;
}
```
### Return Type
Recall that executing the `UpdateAuctionLotStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateAuctionLotStatusData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateAuctionLotStatusData {
  auctionLot_update?: AuctionLot_Key | null;
}
```
### Using `UpdateAuctionLotStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateAuctionLotStatus, UpdateAuctionLotStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionLotStatus` mutation requires an argument of type `UpdateAuctionLotStatusVariables`:
const updateAuctionLotStatusVars: UpdateAuctionLotStatusVariables = {
  id: ..., 
  status: ..., 
  winningBidderId: ..., // optional
  winningBid: ..., // optional
};

// Call the `updateAuctionLotStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateAuctionLotStatus(updateAuctionLotStatusVars);
// Variables can be defined inline as well.
const { data } = await updateAuctionLotStatus({ id: ..., status: ..., winningBidderId: ..., winningBid: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateAuctionLotStatus(dataConnect, updateAuctionLotStatusVars);

console.log(data.auctionLot_update);

// Or, you can use the `Promise` API.
updateAuctionLotStatus(updateAuctionLotStatusVars).then((response) => {
  const data = response.data;
  console.log(data.auctionLot_update);
});
```

### Using `UpdateAuctionLotStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateAuctionLotStatusRef, UpdateAuctionLotStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionLotStatus` mutation requires an argument of type `UpdateAuctionLotStatusVariables`:
const updateAuctionLotStatusVars: UpdateAuctionLotStatusVariables = {
  id: ..., 
  status: ..., 
  winningBidderId: ..., // optional
  winningBid: ..., // optional
};

// Call the `updateAuctionLotStatusRef()` function to get a reference to the mutation.
const ref = updateAuctionLotStatusRef(updateAuctionLotStatusVars);
// Variables can be defined inline as well.
const ref = updateAuctionLotStatusRef({ id: ..., status: ..., winningBidderId: ..., winningBid: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateAuctionLotStatusRef(dataConnect, updateAuctionLotStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auctionLot_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auctionLot_update);
});
```

## UpsertBidderProfile
You can execute the `UpsertBidderProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
upsertBidderProfile(vars: UpsertBidderProfileVariables): MutationPromise<UpsertBidderProfileData, UpsertBidderProfileVariables>;

interface UpsertBidderProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertBidderProfileVariables): MutationRef<UpsertBidderProfileData, UpsertBidderProfileVariables>;
}
export const upsertBidderProfileRef: UpsertBidderProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertBidderProfile(dc: DataConnect, vars: UpsertBidderProfileVariables): MutationPromise<UpsertBidderProfileData, UpsertBidderProfileVariables>;

interface UpsertBidderProfileRef {
  ...
  (dc: DataConnect, vars: UpsertBidderProfileVariables): MutationRef<UpsertBidderProfileData, UpsertBidderProfileVariables>;
}
export const upsertBidderProfileRef: UpsertBidderProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertBidderProfileRef:
```typescript
const name = upsertBidderProfileRef.operationName;
console.log(name);
```

### Variables
The `UpsertBidderProfile` mutation requires an argument of type `UpsertBidderProfileVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertBidderProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertBidderProfileData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertBidderProfileData {
  bidderProfile_upsert: BidderProfile_Key;
}
```
### Using `UpsertBidderProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertBidderProfile, UpsertBidderProfileVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpsertBidderProfile` mutation requires an argument of type `UpsertBidderProfileVariables`:
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

// Call the `upsertBidderProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertBidderProfile(upsertBidderProfileVars);
// Variables can be defined inline as well.
const { data } = await upsertBidderProfile({ id: ..., userId: ..., verificationTier: ..., fullName: ..., phone: ..., phoneVerified: ..., addressStreet: ..., addressCity: ..., addressState: ..., addressZip: ..., addressCountry: ..., companyName: ..., stripeCustomerId: ..., idVerificationStatus: ..., idVerifiedAt: ..., bidderApprovedAt: ..., bidderApprovedBy: ..., totalAuctionsParticipated: ..., totalItemsWon: ..., totalSpent: ..., nonPaymentCount: ..., taxExempt: ..., taxExemptState: ..., taxExemptCertificateUrl: ..., defaultPaymentMethodId: ..., defaultPaymentMethodBrand: ..., defaultPaymentMethodLast4: ..., termsAcceptedAt: ..., termsVersion: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertBidderProfile(dataConnect, upsertBidderProfileVars);

console.log(data.bidderProfile_upsert);

// Or, you can use the `Promise` API.
upsertBidderProfile(upsertBidderProfileVars).then((response) => {
  const data = response.data;
  console.log(data.bidderProfile_upsert);
});
```

### Using `UpsertBidderProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertBidderProfileRef, UpsertBidderProfileVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpsertBidderProfile` mutation requires an argument of type `UpsertBidderProfileVariables`:
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

// Call the `upsertBidderProfileRef()` function to get a reference to the mutation.
const ref = upsertBidderProfileRef(upsertBidderProfileVars);
// Variables can be defined inline as well.
const ref = upsertBidderProfileRef({ id: ..., userId: ..., verificationTier: ..., fullName: ..., phone: ..., phoneVerified: ..., addressStreet: ..., addressCity: ..., addressState: ..., addressZip: ..., addressCountry: ..., companyName: ..., stripeCustomerId: ..., idVerificationStatus: ..., idVerifiedAt: ..., bidderApprovedAt: ..., bidderApprovedBy: ..., totalAuctionsParticipated: ..., totalItemsWon: ..., totalSpent: ..., nonPaymentCount: ..., taxExempt: ..., taxExemptState: ..., taxExemptCertificateUrl: ..., defaultPaymentMethodId: ..., defaultPaymentMethodBrand: ..., defaultPaymentMethodLast4: ..., termsAcceptedAt: ..., termsVersion: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertBidderProfileRef(dataConnect, upsertBidderProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.bidderProfile_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.bidderProfile_upsert);
});
```

## UpdateAuctionStatus
You can execute the `UpdateAuctionStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
updateAuctionStatus(vars: UpdateAuctionStatusVariables): MutationPromise<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;

interface UpdateAuctionStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionStatusVariables): MutationRef<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;
}
export const updateAuctionStatusRef: UpdateAuctionStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateAuctionStatus(dc: DataConnect, vars: UpdateAuctionStatusVariables): MutationPromise<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;

interface UpdateAuctionStatusRef {
  ...
  (dc: DataConnect, vars: UpdateAuctionStatusVariables): MutationRef<UpdateAuctionStatusData, UpdateAuctionStatusVariables>;
}
export const updateAuctionStatusRef: UpdateAuctionStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateAuctionStatusRef:
```typescript
const name = updateAuctionStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateAuctionStatus` mutation requires an argument of type `UpdateAuctionStatusVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateAuctionStatusVariables {
  id: string;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateAuctionStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateAuctionStatusData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateAuctionStatusData {
  auction_update?: Auction_Key | null;
}
```
### Using `UpdateAuctionStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateAuctionStatus, UpdateAuctionStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionStatus` mutation requires an argument of type `UpdateAuctionStatusVariables`:
const updateAuctionStatusVars: UpdateAuctionStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateAuctionStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateAuctionStatus(updateAuctionStatusVars);
// Variables can be defined inline as well.
const { data } = await updateAuctionStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateAuctionStatus(dataConnect, updateAuctionStatusVars);

console.log(data.auction_update);

// Or, you can use the `Promise` API.
updateAuctionStatus(updateAuctionStatusVars).then((response) => {
  const data = response.data;
  console.log(data.auction_update);
});
```

### Using `UpdateAuctionStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateAuctionStatusRef, UpdateAuctionStatusVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionStatus` mutation requires an argument of type `UpdateAuctionStatusVariables`:
const updateAuctionStatusVars: UpdateAuctionStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateAuctionStatusRef()` function to get a reference to the mutation.
const ref = updateAuctionStatusRef(updateAuctionStatusVars);
// Variables can be defined inline as well.
const ref = updateAuctionStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateAuctionStatusRef(dataConnect, updateAuctionStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auction_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auction_update);
});
```

## UpdateAuctionStats
You can execute the `UpdateAuctionStats` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [auctions/index.d.ts](./index.d.ts):
```typescript
updateAuctionStats(vars: UpdateAuctionStatsVariables): MutationPromise<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;

interface UpdateAuctionStatsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAuctionStatsVariables): MutationRef<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;
}
export const updateAuctionStatsRef: UpdateAuctionStatsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateAuctionStats(dc: DataConnect, vars: UpdateAuctionStatsVariables): MutationPromise<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;

interface UpdateAuctionStatsRef {
  ...
  (dc: DataConnect, vars: UpdateAuctionStatsVariables): MutationRef<UpdateAuctionStatsData, UpdateAuctionStatsVariables>;
}
export const updateAuctionStatsRef: UpdateAuctionStatsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateAuctionStatsRef:
```typescript
const name = updateAuctionStatsRef.operationName;
console.log(name);
```

### Variables
The `UpdateAuctionStats` mutation requires an argument of type `UpdateAuctionStatsVariables`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateAuctionStatsVariables {
  id: string;
  lotCount?: number | null;
  totalBids?: number | null;
  totalGmv?: number | null;
}
```
### Return Type
Recall that executing the `UpdateAuctionStats` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateAuctionStatsData`, which is defined in [auctions/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateAuctionStatsData {
  auction_update?: Auction_Key | null;
}
```
### Using `UpdateAuctionStats`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateAuctionStats, UpdateAuctionStatsVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionStats` mutation requires an argument of type `UpdateAuctionStatsVariables`:
const updateAuctionStatsVars: UpdateAuctionStatsVariables = {
  id: ..., 
  lotCount: ..., // optional
  totalBids: ..., // optional
  totalGmv: ..., // optional
};

// Call the `updateAuctionStats()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateAuctionStats(updateAuctionStatsVars);
// Variables can be defined inline as well.
const { data } = await updateAuctionStats({ id: ..., lotCount: ..., totalBids: ..., totalGmv: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateAuctionStats(dataConnect, updateAuctionStatsVars);

console.log(data.auction_update);

// Or, you can use the `Promise` API.
updateAuctionStats(updateAuctionStatsVars).then((response) => {
  const data = response.data;
  console.log(data.auction_update);
});
```

### Using `UpdateAuctionStats`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateAuctionStatsRef, UpdateAuctionStatsVariables } from '@dataconnect/generated-timberequip-auctions';

// The `UpdateAuctionStats` mutation requires an argument of type `UpdateAuctionStatsVariables`:
const updateAuctionStatsVars: UpdateAuctionStatsVariables = {
  id: ..., 
  lotCount: ..., // optional
  totalBids: ..., // optional
  totalGmv: ..., // optional
};

// Call the `updateAuctionStatsRef()` function to get a reference to the mutation.
const ref = updateAuctionStatsRef(updateAuctionStatsVars);
// Variables can be defined inline as well.
const ref = updateAuctionStatsRef({ id: ..., lotCount: ..., totalBids: ..., totalGmv: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateAuctionStatsRef(dataConnect, updateAuctionStatsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.auction_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.auction_update);
});
```

