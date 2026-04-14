# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `billing`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`billing/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `billing`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-billing` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-billing';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-billing';

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

Below are examples of how to use the `billing` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetSubscriptionsByUser
You can execute the `GetSubscriptionsByUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
getSubscriptionsByUser(vars: GetSubscriptionsByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;

interface GetSubscriptionsByUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSubscriptionsByUserVariables): QueryRef<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;
}
export const getSubscriptionsByUserRef: GetSubscriptionsByUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSubscriptionsByUser(dc: DataConnect, vars: GetSubscriptionsByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;

interface GetSubscriptionsByUserRef {
  ...
  (dc: DataConnect, vars: GetSubscriptionsByUserVariables): QueryRef<GetSubscriptionsByUserData, GetSubscriptionsByUserVariables>;
}
export const getSubscriptionsByUserRef: GetSubscriptionsByUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSubscriptionsByUserRef:
```typescript
const name = getSubscriptionsByUserRef.operationName;
console.log(name);
```

### Variables
The `GetSubscriptionsByUser` query requires an argument of type `GetSubscriptionsByUserVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSubscriptionsByUserVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `GetSubscriptionsByUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSubscriptionsByUserData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetSubscriptionsByUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSubscriptionsByUser, GetSubscriptionsByUserVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetSubscriptionsByUser` query requires an argument of type `GetSubscriptionsByUserVariables`:
const getSubscriptionsByUserVars: GetSubscriptionsByUserVariables = {
  userId: ..., 
};

// Call the `getSubscriptionsByUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSubscriptionsByUser(getSubscriptionsByUserVars);
// Variables can be defined inline as well.
const { data } = await getSubscriptionsByUser({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSubscriptionsByUser(dataConnect, getSubscriptionsByUserVars);

console.log(data.billingSubscriptions);

// Or, you can use the `Promise` API.
getSubscriptionsByUser(getSubscriptionsByUserVars).then((response) => {
  const data = response.data;
  console.log(data.billingSubscriptions);
});
```

### Using `GetSubscriptionsByUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSubscriptionsByUserRef, GetSubscriptionsByUserVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetSubscriptionsByUser` query requires an argument of type `GetSubscriptionsByUserVariables`:
const getSubscriptionsByUserVars: GetSubscriptionsByUserVariables = {
  userId: ..., 
};

// Call the `getSubscriptionsByUserRef()` function to get a reference to the query.
const ref = getSubscriptionsByUserRef(getSubscriptionsByUserVars);
// Variables can be defined inline as well.
const ref = getSubscriptionsByUserRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSubscriptionsByUserRef(dataConnect, getSubscriptionsByUserVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.billingSubscriptions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.billingSubscriptions);
});
```

## GetActiveSubscriptionForListing
You can execute the `GetActiveSubscriptionForListing` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
getActiveSubscriptionForListing(vars: GetActiveSubscriptionForListingVariables, options?: ExecuteQueryOptions): QueryPromise<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;

interface GetActiveSubscriptionForListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetActiveSubscriptionForListingVariables): QueryRef<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;
}
export const getActiveSubscriptionForListingRef: GetActiveSubscriptionForListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getActiveSubscriptionForListing(dc: DataConnect, vars: GetActiveSubscriptionForListingVariables, options?: ExecuteQueryOptions): QueryPromise<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;

interface GetActiveSubscriptionForListingRef {
  ...
  (dc: DataConnect, vars: GetActiveSubscriptionForListingVariables): QueryRef<GetActiveSubscriptionForListingData, GetActiveSubscriptionForListingVariables>;
}
export const getActiveSubscriptionForListingRef: GetActiveSubscriptionForListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getActiveSubscriptionForListingRef:
```typescript
const name = getActiveSubscriptionForListingRef.operationName;
console.log(name);
```

### Variables
The `GetActiveSubscriptionForListing` query requires an argument of type `GetActiveSubscriptionForListingVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetActiveSubscriptionForListingVariables {
  listingId: string;
}
```
### Return Type
Recall that executing the `GetActiveSubscriptionForListing` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetActiveSubscriptionForListingData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetActiveSubscriptionForListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getActiveSubscriptionForListing, GetActiveSubscriptionForListingVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetActiveSubscriptionForListing` query requires an argument of type `GetActiveSubscriptionForListingVariables`:
const getActiveSubscriptionForListingVars: GetActiveSubscriptionForListingVariables = {
  listingId: ..., 
};

// Call the `getActiveSubscriptionForListing()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getActiveSubscriptionForListing(getActiveSubscriptionForListingVars);
// Variables can be defined inline as well.
const { data } = await getActiveSubscriptionForListing({ listingId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getActiveSubscriptionForListing(dataConnect, getActiveSubscriptionForListingVars);

console.log(data.billingSubscriptions);

// Or, you can use the `Promise` API.
getActiveSubscriptionForListing(getActiveSubscriptionForListingVars).then((response) => {
  const data = response.data;
  console.log(data.billingSubscriptions);
});
```

### Using `GetActiveSubscriptionForListing`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getActiveSubscriptionForListingRef, GetActiveSubscriptionForListingVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetActiveSubscriptionForListing` query requires an argument of type `GetActiveSubscriptionForListingVariables`:
const getActiveSubscriptionForListingVars: GetActiveSubscriptionForListingVariables = {
  listingId: ..., 
};

// Call the `getActiveSubscriptionForListingRef()` function to get a reference to the query.
const ref = getActiveSubscriptionForListingRef(getActiveSubscriptionForListingVars);
// Variables can be defined inline as well.
const ref = getActiveSubscriptionForListingRef({ listingId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getActiveSubscriptionForListingRef(dataConnect, getActiveSubscriptionForListingVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.billingSubscriptions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.billingSubscriptions);
});
```

## GetSubscriptionByStripeId
You can execute the `GetSubscriptionByStripeId` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
getSubscriptionByStripeId(vars: GetSubscriptionByStripeIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;

interface GetSubscriptionByStripeIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSubscriptionByStripeIdVariables): QueryRef<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;
}
export const getSubscriptionByStripeIdRef: GetSubscriptionByStripeIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSubscriptionByStripeId(dc: DataConnect, vars: GetSubscriptionByStripeIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;

interface GetSubscriptionByStripeIdRef {
  ...
  (dc: DataConnect, vars: GetSubscriptionByStripeIdVariables): QueryRef<GetSubscriptionByStripeIdData, GetSubscriptionByStripeIdVariables>;
}
export const getSubscriptionByStripeIdRef: GetSubscriptionByStripeIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSubscriptionByStripeIdRef:
```typescript
const name = getSubscriptionByStripeIdRef.operationName;
console.log(name);
```

### Variables
The `GetSubscriptionByStripeId` query requires an argument of type `GetSubscriptionByStripeIdVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSubscriptionByStripeIdVariables {
  stripeId: string;
}
```
### Return Type
Recall that executing the `GetSubscriptionByStripeId` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSubscriptionByStripeIdData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetSubscriptionByStripeId`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSubscriptionByStripeId, GetSubscriptionByStripeIdVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetSubscriptionByStripeId` query requires an argument of type `GetSubscriptionByStripeIdVariables`:
const getSubscriptionByStripeIdVars: GetSubscriptionByStripeIdVariables = {
  stripeId: ..., 
};

// Call the `getSubscriptionByStripeId()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSubscriptionByStripeId(getSubscriptionByStripeIdVars);
// Variables can be defined inline as well.
const { data } = await getSubscriptionByStripeId({ stripeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSubscriptionByStripeId(dataConnect, getSubscriptionByStripeIdVars);

console.log(data.billingSubscriptions);

// Or, you can use the `Promise` API.
getSubscriptionByStripeId(getSubscriptionByStripeIdVars).then((response) => {
  const data = response.data;
  console.log(data.billingSubscriptions);
});
```

### Using `GetSubscriptionByStripeId`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSubscriptionByStripeIdRef, GetSubscriptionByStripeIdVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetSubscriptionByStripeId` query requires an argument of type `GetSubscriptionByStripeIdVariables`:
const getSubscriptionByStripeIdVars: GetSubscriptionByStripeIdVariables = {
  stripeId: ..., 
};

// Call the `getSubscriptionByStripeIdRef()` function to get a reference to the query.
const ref = getSubscriptionByStripeIdRef(getSubscriptionByStripeIdVars);
// Variables can be defined inline as well.
const ref = getSubscriptionByStripeIdRef({ stripeId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSubscriptionByStripeIdRef(dataConnect, getSubscriptionByStripeIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.billingSubscriptions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.billingSubscriptions);
});
```

## GetInvoicesByUser
You can execute the `GetInvoicesByUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
getInvoicesByUser(vars: GetInvoicesByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetInvoicesByUserData, GetInvoicesByUserVariables>;

interface GetInvoicesByUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetInvoicesByUserVariables): QueryRef<GetInvoicesByUserData, GetInvoicesByUserVariables>;
}
export const getInvoicesByUserRef: GetInvoicesByUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getInvoicesByUser(dc: DataConnect, vars: GetInvoicesByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetInvoicesByUserData, GetInvoicesByUserVariables>;

interface GetInvoicesByUserRef {
  ...
  (dc: DataConnect, vars: GetInvoicesByUserVariables): QueryRef<GetInvoicesByUserData, GetInvoicesByUserVariables>;
}
export const getInvoicesByUserRef: GetInvoicesByUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getInvoicesByUserRef:
```typescript
const name = getInvoicesByUserRef.operationName;
console.log(name);
```

### Variables
The `GetInvoicesByUser` query requires an argument of type `GetInvoicesByUserVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetInvoicesByUserVariables {
  userId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `GetInvoicesByUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetInvoicesByUserData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetInvoicesByUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getInvoicesByUser, GetInvoicesByUserVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetInvoicesByUser` query requires an argument of type `GetInvoicesByUserVariables`:
const getInvoicesByUserVars: GetInvoicesByUserVariables = {
  userId: ..., 
  limit: ..., // optional
};

// Call the `getInvoicesByUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getInvoicesByUser(getInvoicesByUserVars);
// Variables can be defined inline as well.
const { data } = await getInvoicesByUser({ userId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getInvoicesByUser(dataConnect, getInvoicesByUserVars);

console.log(data.invoices);

// Or, you can use the `Promise` API.
getInvoicesByUser(getInvoicesByUserVars).then((response) => {
  const data = response.data;
  console.log(data.invoices);
});
```

### Using `GetInvoicesByUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getInvoicesByUserRef, GetInvoicesByUserVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetInvoicesByUser` query requires an argument of type `GetInvoicesByUserVariables`:
const getInvoicesByUserVars: GetInvoicesByUserVariables = {
  userId: ..., 
  limit: ..., // optional
};

// Call the `getInvoicesByUserRef()` function to get a reference to the query.
const ref = getInvoicesByUserRef(getInvoicesByUserVars);
// Variables can be defined inline as well.
const ref = getInvoicesByUserRef({ userId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getInvoicesByUserRef(dataConnect, getInvoicesByUserVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.invoices);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.invoices);
});
```

## GetSellerApplicationsByUser
You can execute the `GetSellerApplicationsByUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
getSellerApplicationsByUser(vars: GetSellerApplicationsByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;

interface GetSellerApplicationsByUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSellerApplicationsByUserVariables): QueryRef<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;
}
export const getSellerApplicationsByUserRef: GetSellerApplicationsByUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSellerApplicationsByUser(dc: DataConnect, vars: GetSellerApplicationsByUserVariables, options?: ExecuteQueryOptions): QueryPromise<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;

interface GetSellerApplicationsByUserRef {
  ...
  (dc: DataConnect, vars: GetSellerApplicationsByUserVariables): QueryRef<GetSellerApplicationsByUserData, GetSellerApplicationsByUserVariables>;
}
export const getSellerApplicationsByUserRef: GetSellerApplicationsByUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSellerApplicationsByUserRef:
```typescript
const name = getSellerApplicationsByUserRef.operationName;
console.log(name);
```

### Variables
The `GetSellerApplicationsByUser` query requires an argument of type `GetSellerApplicationsByUserVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSellerApplicationsByUserVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `GetSellerApplicationsByUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSellerApplicationsByUserData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetSellerApplicationsByUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSellerApplicationsByUser, GetSellerApplicationsByUserVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetSellerApplicationsByUser` query requires an argument of type `GetSellerApplicationsByUserVariables`:
const getSellerApplicationsByUserVars: GetSellerApplicationsByUserVariables = {
  userId: ..., 
};

// Call the `getSellerApplicationsByUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSellerApplicationsByUser(getSellerApplicationsByUserVars);
// Variables can be defined inline as well.
const { data } = await getSellerApplicationsByUser({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSellerApplicationsByUser(dataConnect, getSellerApplicationsByUserVars);

console.log(data.sellerProgramApplications);

// Or, you can use the `Promise` API.
getSellerApplicationsByUser(getSellerApplicationsByUserVars).then((response) => {
  const data = response.data;
  console.log(data.sellerProgramApplications);
});
```

### Using `GetSellerApplicationsByUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSellerApplicationsByUserRef, GetSellerApplicationsByUserVariables } from '@dataconnect/generated-timberequip-billing';

// The `GetSellerApplicationsByUser` query requires an argument of type `GetSellerApplicationsByUserVariables`:
const getSellerApplicationsByUserVars: GetSellerApplicationsByUserVariables = {
  userId: ..., 
};

// Call the `getSellerApplicationsByUserRef()` function to get a reference to the query.
const ref = getSellerApplicationsByUserRef(getSellerApplicationsByUserVars);
// Variables can be defined inline as well.
const ref = getSellerApplicationsByUserRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSellerApplicationsByUserRef(dataConnect, getSellerApplicationsByUserVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.sellerProgramApplications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.sellerProgramApplications);
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

Below are examples of how to use the `billing` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertSubscription
You can execute the `UpsertSubscription` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
upsertSubscription(vars: UpsertSubscriptionVariables): MutationPromise<UpsertSubscriptionData, UpsertSubscriptionVariables>;

interface UpsertSubscriptionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertSubscriptionVariables): MutationRef<UpsertSubscriptionData, UpsertSubscriptionVariables>;
}
export const upsertSubscriptionRef: UpsertSubscriptionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertSubscription(dc: DataConnect, vars: UpsertSubscriptionVariables): MutationPromise<UpsertSubscriptionData, UpsertSubscriptionVariables>;

interface UpsertSubscriptionRef {
  ...
  (dc: DataConnect, vars: UpsertSubscriptionVariables): MutationRef<UpsertSubscriptionData, UpsertSubscriptionVariables>;
}
export const upsertSubscriptionRef: UpsertSubscriptionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertSubscriptionRef:
```typescript
const name = upsertSubscriptionRef.operationName;
console.log(name);
```

### Variables
The `UpsertSubscription` mutation requires an argument of type `UpsertSubscriptionVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertSubscription` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertSubscriptionData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertSubscriptionData {
  billingSubscription_upsert: BillingSubscription_Key;
}
```
### Using `UpsertSubscription`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertSubscription, UpsertSubscriptionVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpsertSubscription` mutation requires an argument of type `UpsertSubscriptionVariables`:
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

// Call the `upsertSubscription()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertSubscription(upsertSubscriptionVars);
// Variables can be defined inline as well.
const { data } = await upsertSubscription({ id: ..., userId: ..., listingId: ..., planId: ..., planName: ..., listingCap: ..., status: ..., stripeSubscriptionId: ..., currentPeriodEnd: ..., cancelAtPeriodEnd: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertSubscription(dataConnect, upsertSubscriptionVars);

console.log(data.billingSubscription_upsert);

// Or, you can use the `Promise` API.
upsertSubscription(upsertSubscriptionVars).then((response) => {
  const data = response.data;
  console.log(data.billingSubscription_upsert);
});
```

### Using `UpsertSubscription`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertSubscriptionRef, UpsertSubscriptionVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpsertSubscription` mutation requires an argument of type `UpsertSubscriptionVariables`:
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

// Call the `upsertSubscriptionRef()` function to get a reference to the mutation.
const ref = upsertSubscriptionRef(upsertSubscriptionVars);
// Variables can be defined inline as well.
const ref = upsertSubscriptionRef({ id: ..., userId: ..., listingId: ..., planId: ..., planName: ..., listingCap: ..., status: ..., stripeSubscriptionId: ..., currentPeriodEnd: ..., cancelAtPeriodEnd: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertSubscriptionRef(dataConnect, upsertSubscriptionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.billingSubscription_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.billingSubscription_upsert);
});
```

## UpsertInvoice
You can execute the `UpsertInvoice` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
upsertInvoice(vars: UpsertInvoiceVariables): MutationPromise<UpsertInvoiceData, UpsertInvoiceVariables>;

interface UpsertInvoiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertInvoiceVariables): MutationRef<UpsertInvoiceData, UpsertInvoiceVariables>;
}
export const upsertInvoiceRef: UpsertInvoiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertInvoice(dc: DataConnect, vars: UpsertInvoiceVariables): MutationPromise<UpsertInvoiceData, UpsertInvoiceVariables>;

interface UpsertInvoiceRef {
  ...
  (dc: DataConnect, vars: UpsertInvoiceVariables): MutationRef<UpsertInvoiceData, UpsertInvoiceVariables>;
}
export const upsertInvoiceRef: UpsertInvoiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertInvoiceRef:
```typescript
const name = upsertInvoiceRef.operationName;
console.log(name);
```

### Variables
The `UpsertInvoice` mutation requires an argument of type `UpsertInvoiceVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertInvoice` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertInvoiceData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertInvoiceData {
  invoice_upsert: Invoice_Key;
}
```
### Using `UpsertInvoice`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertInvoice, UpsertInvoiceVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpsertInvoice` mutation requires an argument of type `UpsertInvoiceVariables`:
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

// Call the `upsertInvoice()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertInvoice(upsertInvoiceVars);
// Variables can be defined inline as well.
const { data } = await upsertInvoice({ id: ..., userId: ..., listingId: ..., stripeInvoiceId: ..., stripeCheckoutSessionId: ..., amount: ..., currency: ..., status: ..., items: ..., source: ..., paidAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertInvoice(dataConnect, upsertInvoiceVars);

console.log(data.invoice_upsert);

// Or, you can use the `Promise` API.
upsertInvoice(upsertInvoiceVars).then((response) => {
  const data = response.data;
  console.log(data.invoice_upsert);
});
```

### Using `UpsertInvoice`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertInvoiceRef, UpsertInvoiceVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpsertInvoice` mutation requires an argument of type `UpsertInvoiceVariables`:
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

// Call the `upsertInvoiceRef()` function to get a reference to the mutation.
const ref = upsertInvoiceRef(upsertInvoiceVars);
// Variables can be defined inline as well.
const ref = upsertInvoiceRef({ id: ..., userId: ..., listingId: ..., stripeInvoiceId: ..., stripeCheckoutSessionId: ..., amount: ..., currency: ..., status: ..., items: ..., source: ..., paidAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertInvoiceRef(dataConnect, upsertInvoiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.invoice_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.invoice_upsert);
});
```

## UpsertSellerApplication
You can execute the `UpsertSellerApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
upsertSellerApplication(vars: UpsertSellerApplicationVariables): MutationPromise<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;

interface UpsertSellerApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertSellerApplicationVariables): MutationRef<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;
}
export const upsertSellerApplicationRef: UpsertSellerApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertSellerApplication(dc: DataConnect, vars: UpsertSellerApplicationVariables): MutationPromise<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;

interface UpsertSellerApplicationRef {
  ...
  (dc: DataConnect, vars: UpsertSellerApplicationVariables): MutationRef<UpsertSellerApplicationData, UpsertSellerApplicationVariables>;
}
export const upsertSellerApplicationRef: UpsertSellerApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertSellerApplicationRef:
```typescript
const name = upsertSellerApplicationRef.operationName;
console.log(name);
```

### Variables
The `UpsertSellerApplication` mutation requires an argument of type `UpsertSellerApplicationVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertSellerApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertSellerApplicationData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertSellerApplicationData {
  sellerProgramApplication_upsert: SellerProgramApplication_Key;
}
```
### Using `UpsertSellerApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertSellerApplication, UpsertSellerApplicationVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpsertSellerApplication` mutation requires an argument of type `UpsertSellerApplicationVariables`:
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

// Call the `upsertSellerApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertSellerApplication(upsertSellerApplicationVars);
// Variables can be defined inline as well.
const { data } = await upsertSellerApplication({ id: ..., userId: ..., planId: ..., status: ..., stripeCustomerId: ..., stripeSubscriptionId: ..., legalFullName: ..., legalTitle: ..., companyName: ..., billingEmail: ..., phoneNumber: ..., website: ..., country: ..., taxIdOrVat: ..., notes: ..., statementLabel: ..., legalScope: ..., legalTermsVersion: ..., legalAcceptedAtIso: ..., acceptedTerms: ..., acceptedPrivacy: ..., acceptedRecurringBilling: ..., acceptedVisibilityPolicy: ..., acceptedAuthority: ..., source: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertSellerApplication(dataConnect, upsertSellerApplicationVars);

console.log(data.sellerProgramApplication_upsert);

// Or, you can use the `Promise` API.
upsertSellerApplication(upsertSellerApplicationVars).then((response) => {
  const data = response.data;
  console.log(data.sellerProgramApplication_upsert);
});
```

### Using `UpsertSellerApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertSellerApplicationRef, UpsertSellerApplicationVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpsertSellerApplication` mutation requires an argument of type `UpsertSellerApplicationVariables`:
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

// Call the `upsertSellerApplicationRef()` function to get a reference to the mutation.
const ref = upsertSellerApplicationRef(upsertSellerApplicationVars);
// Variables can be defined inline as well.
const ref = upsertSellerApplicationRef({ id: ..., userId: ..., planId: ..., status: ..., stripeCustomerId: ..., stripeSubscriptionId: ..., legalFullName: ..., legalTitle: ..., companyName: ..., billingEmail: ..., phoneNumber: ..., website: ..., country: ..., taxIdOrVat: ..., notes: ..., statementLabel: ..., legalScope: ..., legalTermsVersion: ..., legalAcceptedAtIso: ..., acceptedTerms: ..., acceptedPrivacy: ..., acceptedRecurringBilling: ..., acceptedVisibilityPolicy: ..., acceptedAuthority: ..., source: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertSellerApplicationRef(dataConnect, upsertSellerApplicationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.sellerProgramApplication_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.sellerProgramApplication_upsert);
});
```

## UpdateSubscriptionStatus
You can execute the `UpdateSubscriptionStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
updateSubscriptionStatus(vars: UpdateSubscriptionStatusVariables): MutationPromise<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;

interface UpdateSubscriptionStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSubscriptionStatusVariables): MutationRef<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;
}
export const updateSubscriptionStatusRef: UpdateSubscriptionStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateSubscriptionStatus(dc: DataConnect, vars: UpdateSubscriptionStatusVariables): MutationPromise<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;

interface UpdateSubscriptionStatusRef {
  ...
  (dc: DataConnect, vars: UpdateSubscriptionStatusVariables): MutationRef<UpdateSubscriptionStatusData, UpdateSubscriptionStatusVariables>;
}
export const updateSubscriptionStatusRef: UpdateSubscriptionStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSubscriptionStatusRef:
```typescript
const name = updateSubscriptionStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateSubscriptionStatus` mutation requires an argument of type `UpdateSubscriptionStatusVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateSubscriptionStatusVariables {
  id: string;
  status: string;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodEnd?: TimestampString | null;
}
```
### Return Type
Recall that executing the `UpdateSubscriptionStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSubscriptionStatusData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSubscriptionStatusData {
  billingSubscription_update?: BillingSubscription_Key | null;
}
```
### Using `UpdateSubscriptionStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateSubscriptionStatus, UpdateSubscriptionStatusVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpdateSubscriptionStatus` mutation requires an argument of type `UpdateSubscriptionStatusVariables`:
const updateSubscriptionStatusVars: UpdateSubscriptionStatusVariables = {
  id: ..., 
  status: ..., 
  cancelAtPeriodEnd: ..., // optional
  currentPeriodEnd: ..., // optional
};

// Call the `updateSubscriptionStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateSubscriptionStatus(updateSubscriptionStatusVars);
// Variables can be defined inline as well.
const { data } = await updateSubscriptionStatus({ id: ..., status: ..., cancelAtPeriodEnd: ..., currentPeriodEnd: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateSubscriptionStatus(dataConnect, updateSubscriptionStatusVars);

console.log(data.billingSubscription_update);

// Or, you can use the `Promise` API.
updateSubscriptionStatus(updateSubscriptionStatusVars).then((response) => {
  const data = response.data;
  console.log(data.billingSubscription_update);
});
```

### Using `UpdateSubscriptionStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSubscriptionStatusRef, UpdateSubscriptionStatusVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpdateSubscriptionStatus` mutation requires an argument of type `UpdateSubscriptionStatusVariables`:
const updateSubscriptionStatusVars: UpdateSubscriptionStatusVariables = {
  id: ..., 
  status: ..., 
  cancelAtPeriodEnd: ..., // optional
  currentPeriodEnd: ..., // optional
};

// Call the `updateSubscriptionStatusRef()` function to get a reference to the mutation.
const ref = updateSubscriptionStatusRef(updateSubscriptionStatusVars);
// Variables can be defined inline as well.
const ref = updateSubscriptionStatusRef({ id: ..., status: ..., cancelAtPeriodEnd: ..., currentPeriodEnd: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSubscriptionStatusRef(dataConnect, updateSubscriptionStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.billingSubscription_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.billingSubscription_update);
});
```

## UpdateInvoiceStatus
You can execute the `UpdateInvoiceStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [billing/index.d.ts](./index.d.ts):
```typescript
updateInvoiceStatus(vars: UpdateInvoiceStatusVariables): MutationPromise<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;

interface UpdateInvoiceStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInvoiceStatusVariables): MutationRef<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;
}
export const updateInvoiceStatusRef: UpdateInvoiceStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateInvoiceStatus(dc: DataConnect, vars: UpdateInvoiceStatusVariables): MutationPromise<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;

interface UpdateInvoiceStatusRef {
  ...
  (dc: DataConnect, vars: UpdateInvoiceStatusVariables): MutationRef<UpdateInvoiceStatusData, UpdateInvoiceStatusVariables>;
}
export const updateInvoiceStatusRef: UpdateInvoiceStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateInvoiceStatusRef:
```typescript
const name = updateInvoiceStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateInvoiceStatus` mutation requires an argument of type `UpdateInvoiceStatusVariables`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateInvoiceStatusVariables {
  id: string;
  status: string;
  paidAt?: TimestampString | null;
}
```
### Return Type
Recall that executing the `UpdateInvoiceStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateInvoiceStatusData`, which is defined in [billing/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateInvoiceStatusData {
  invoice_update?: Invoice_Key | null;
}
```
### Using `UpdateInvoiceStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateInvoiceStatus, UpdateInvoiceStatusVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpdateInvoiceStatus` mutation requires an argument of type `UpdateInvoiceStatusVariables`:
const updateInvoiceStatusVars: UpdateInvoiceStatusVariables = {
  id: ..., 
  status: ..., 
  paidAt: ..., // optional
};

// Call the `updateInvoiceStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateInvoiceStatus(updateInvoiceStatusVars);
// Variables can be defined inline as well.
const { data } = await updateInvoiceStatus({ id: ..., status: ..., paidAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateInvoiceStatus(dataConnect, updateInvoiceStatusVars);

console.log(data.invoice_update);

// Or, you can use the `Promise` API.
updateInvoiceStatus(updateInvoiceStatusVars).then((response) => {
  const data = response.data;
  console.log(data.invoice_update);
});
```

### Using `UpdateInvoiceStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateInvoiceStatusRef, UpdateInvoiceStatusVariables } from '@dataconnect/generated-timberequip-billing';

// The `UpdateInvoiceStatus` mutation requires an argument of type `UpdateInvoiceStatusVariables`:
const updateInvoiceStatusVars: UpdateInvoiceStatusVariables = {
  id: ..., 
  status: ..., 
  paidAt: ..., // optional
};

// Call the `updateInvoiceStatusRef()` function to get a reference to the mutation.
const ref = updateInvoiceStatusRef(updateInvoiceStatusVars);
// Variables can be defined inline as well.
const ref = updateInvoiceStatusRef({ id: ..., status: ..., paidAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateInvoiceStatusRef(dataConnect, updateInvoiceStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.invoice_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.invoice_update);
});
```

