# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `marketplace`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`marketplace/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `marketplace`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated-timberequip-marketplace` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-marketplace';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated-timberequip-marketplace';

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

Below are examples of how to use the `marketplace` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetUserById
You can execute the `GetUserById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [marketplace/index.d.ts](./index.d.ts):
```typescript
getUserById(vars: GetUserByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByIdData, GetUserByIdVariables>;

interface GetUserByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserByIdVariables): QueryRef<GetUserByIdData, GetUserByIdVariables>;
}
export const getUserByIdRef: GetUserByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserById(dc: DataConnect, vars: GetUserByIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByIdData, GetUserByIdVariables>;

interface GetUserByIdRef {
  ...
  (dc: DataConnect, vars: GetUserByIdVariables): QueryRef<GetUserByIdData, GetUserByIdVariables>;
}
export const getUserByIdRef: GetUserByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserByIdRef:
```typescript
const name = getUserByIdRef.operationName;
console.log(name);
```

### Variables
The `GetUserById` query requires an argument of type `GetUserByIdVariables`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetUserById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserByIdData`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetUserById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserById, GetUserByIdVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `GetUserById` query requires an argument of type `GetUserByIdVariables`:
const getUserByIdVars: GetUserByIdVariables = {
  id: ..., 
};

// Call the `getUserById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserById(getUserByIdVars);
// Variables can be defined inline as well.
const { data } = await getUserById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserById(dataConnect, getUserByIdVars);

console.log(data.user);

// Or, you can use the `Promise` API.
getUserById(getUserByIdVars).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUserById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserByIdRef, GetUserByIdVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `GetUserById` query requires an argument of type `GetUserByIdVariables`:
const getUserByIdVars: GetUserByIdVariables = {
  id: ..., 
};

// Call the `getUserByIdRef()` function to get a reference to the query.
const ref = getUserByIdRef(getUserByIdVars);
// Variables can be defined inline as well.
const ref = getUserByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserByIdRef(dataConnect, getUserByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## GetUserByEmail
You can execute the `GetUserByEmail` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [marketplace/index.d.ts](./index.d.ts):
```typescript
getUserByEmail(vars: GetUserByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByEmailData, GetUserByEmailVariables>;

interface GetUserByEmailRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserByEmailVariables): QueryRef<GetUserByEmailData, GetUserByEmailVariables>;
}
export const getUserByEmailRef: GetUserByEmailRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserByEmail(dc: DataConnect, vars: GetUserByEmailVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserByEmailData, GetUserByEmailVariables>;

interface GetUserByEmailRef {
  ...
  (dc: DataConnect, vars: GetUserByEmailVariables): QueryRef<GetUserByEmailData, GetUserByEmailVariables>;
}
export const getUserByEmailRef: GetUserByEmailRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserByEmailRef:
```typescript
const name = getUserByEmailRef.operationName;
console.log(name);
```

### Variables
The `GetUserByEmail` query requires an argument of type `GetUserByEmailVariables`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserByEmailVariables {
  email: string;
}
```
### Return Type
Recall that executing the `GetUserByEmail` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserByEmailData`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetUserByEmail`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserByEmail, GetUserByEmailVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `GetUserByEmail` query requires an argument of type `GetUserByEmailVariables`:
const getUserByEmailVars: GetUserByEmailVariables = {
  email: ..., 
};

// Call the `getUserByEmail()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserByEmail(getUserByEmailVars);
// Variables can be defined inline as well.
const { data } = await getUserByEmail({ email: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserByEmail(dataConnect, getUserByEmailVars);

console.log(data.users);

// Or, you can use the `Promise` API.
getUserByEmail(getUserByEmailVars).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `GetUserByEmail`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserByEmailRef, GetUserByEmailVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `GetUserByEmail` query requires an argument of type `GetUserByEmailVariables`:
const getUserByEmailVars: GetUserByEmailVariables = {
  email: ..., 
};

// Call the `getUserByEmailRef()` function to get a reference to the query.
const ref = getUserByEmailRef(getUserByEmailVars);
// Variables can be defined inline as well.
const ref = getUserByEmailRef({ email: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserByEmailRef(dataConnect, getUserByEmailVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## ListUsersByRole
You can execute the `ListUsersByRole` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [marketplace/index.d.ts](./index.d.ts):
```typescript
listUsersByRole(vars: ListUsersByRoleVariables, options?: ExecuteQueryOptions): QueryPromise<ListUsersByRoleData, ListUsersByRoleVariables>;

interface ListUsersByRoleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListUsersByRoleVariables): QueryRef<ListUsersByRoleData, ListUsersByRoleVariables>;
}
export const listUsersByRoleRef: ListUsersByRoleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUsersByRole(dc: DataConnect, vars: ListUsersByRoleVariables, options?: ExecuteQueryOptions): QueryPromise<ListUsersByRoleData, ListUsersByRoleVariables>;

interface ListUsersByRoleRef {
  ...
  (dc: DataConnect, vars: ListUsersByRoleVariables): QueryRef<ListUsersByRoleData, ListUsersByRoleVariables>;
}
export const listUsersByRoleRef: ListUsersByRoleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUsersByRoleRef:
```typescript
const name = listUsersByRoleRef.operationName;
console.log(name);
```

### Variables
The `ListUsersByRole` query requires an argument of type `ListUsersByRoleVariables`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListUsersByRoleVariables {
  role: string;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListUsersByRole` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUsersByRoleData`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListUsersByRole`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUsersByRole, ListUsersByRoleVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `ListUsersByRole` query requires an argument of type `ListUsersByRoleVariables`:
const listUsersByRoleVars: ListUsersByRoleVariables = {
  role: ..., 
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listUsersByRole()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUsersByRole(listUsersByRoleVars);
// Variables can be defined inline as well.
const { data } = await listUsersByRole({ role: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUsersByRole(dataConnect, listUsersByRoleVars);

console.log(data.users);

// Or, you can use the `Promise` API.
listUsersByRole(listUsersByRoleVars).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `ListUsersByRole`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUsersByRoleRef, ListUsersByRoleVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `ListUsersByRole` query requires an argument of type `ListUsersByRoleVariables`:
const listUsersByRoleVars: ListUsersByRoleVariables = {
  role: ..., 
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listUsersByRoleRef()` function to get a reference to the query.
const ref = listUsersByRoleRef(listUsersByRoleVars);
// Variables can be defined inline as well.
const ref = listUsersByRoleRef({ role: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUsersByRoleRef(dataConnect, listUsersByRoleVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## GetStorefrontBySlug
You can execute the `GetStorefrontBySlug` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [marketplace/index.d.ts](./index.d.ts):
```typescript
getStorefrontBySlug(vars: GetStorefrontBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;

interface GetStorefrontBySlugRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetStorefrontBySlugVariables): QueryRef<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;
}
export const getStorefrontBySlugRef: GetStorefrontBySlugRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getStorefrontBySlug(dc: DataConnect, vars: GetStorefrontBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;

interface GetStorefrontBySlugRef {
  ...
  (dc: DataConnect, vars: GetStorefrontBySlugVariables): QueryRef<GetStorefrontBySlugData, GetStorefrontBySlugVariables>;
}
export const getStorefrontBySlugRef: GetStorefrontBySlugRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getStorefrontBySlugRef:
```typescript
const name = getStorefrontBySlugRef.operationName;
console.log(name);
```

### Variables
The `GetStorefrontBySlug` query requires an argument of type `GetStorefrontBySlugVariables`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetStorefrontBySlugVariables {
  slug: string;
}
```
### Return Type
Recall that executing the `GetStorefrontBySlug` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetStorefrontBySlugData`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetStorefrontBySlug`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getStorefrontBySlug, GetStorefrontBySlugVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `GetStorefrontBySlug` query requires an argument of type `GetStorefrontBySlugVariables`:
const getStorefrontBySlugVars: GetStorefrontBySlugVariables = {
  slug: ..., 
};

// Call the `getStorefrontBySlug()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getStorefrontBySlug(getStorefrontBySlugVars);
// Variables can be defined inline as well.
const { data } = await getStorefrontBySlug({ slug: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getStorefrontBySlug(dataConnect, getStorefrontBySlugVars);

console.log(data.storefronts);

// Or, you can use the `Promise` API.
getStorefrontBySlug(getStorefrontBySlugVars).then((response) => {
  const data = response.data;
  console.log(data.storefronts);
});
```

### Using `GetStorefrontBySlug`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getStorefrontBySlugRef, GetStorefrontBySlugVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `GetStorefrontBySlug` query requires an argument of type `GetStorefrontBySlugVariables`:
const getStorefrontBySlugVars: GetStorefrontBySlugVariables = {
  slug: ..., 
};

// Call the `getStorefrontBySlugRef()` function to get a reference to the query.
const ref = getStorefrontBySlugRef(getStorefrontBySlugVars);
// Variables can be defined inline as well.
const ref = getStorefrontBySlugRef({ slug: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getStorefrontBySlugRef(dataConnect, getStorefrontBySlugVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.storefronts);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.storefronts);
});
```

## GetStorefrontByUserId
You can execute the `GetStorefrontByUserId` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [marketplace/index.d.ts](./index.d.ts):
```typescript
getStorefrontByUserId(vars: GetStorefrontByUserIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;

interface GetStorefrontByUserIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetStorefrontByUserIdVariables): QueryRef<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;
}
export const getStorefrontByUserIdRef: GetStorefrontByUserIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getStorefrontByUserId(dc: DataConnect, vars: GetStorefrontByUserIdVariables, options?: ExecuteQueryOptions): QueryPromise<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;

interface GetStorefrontByUserIdRef {
  ...
  (dc: DataConnect, vars: GetStorefrontByUserIdVariables): QueryRef<GetStorefrontByUserIdData, GetStorefrontByUserIdVariables>;
}
export const getStorefrontByUserIdRef: GetStorefrontByUserIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getStorefrontByUserIdRef:
```typescript
const name = getStorefrontByUserIdRef.operationName;
console.log(name);
```

### Variables
The `GetStorefrontByUserId` query requires an argument of type `GetStorefrontByUserIdVariables`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetStorefrontByUserIdVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `GetStorefrontByUserId` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetStorefrontByUserIdData`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetStorefrontByUserId`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getStorefrontByUserId, GetStorefrontByUserIdVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `GetStorefrontByUserId` query requires an argument of type `GetStorefrontByUserIdVariables`:
const getStorefrontByUserIdVars: GetStorefrontByUserIdVariables = {
  userId: ..., 
};

// Call the `getStorefrontByUserId()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getStorefrontByUserId(getStorefrontByUserIdVars);
// Variables can be defined inline as well.
const { data } = await getStorefrontByUserId({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getStorefrontByUserId(dataConnect, getStorefrontByUserIdVars);

console.log(data.storefronts);

// Or, you can use the `Promise` API.
getStorefrontByUserId(getStorefrontByUserIdVars).then((response) => {
  const data = response.data;
  console.log(data.storefronts);
});
```

### Using `GetStorefrontByUserId`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getStorefrontByUserIdRef, GetStorefrontByUserIdVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `GetStorefrontByUserId` query requires an argument of type `GetStorefrontByUserIdVariables`:
const getStorefrontByUserIdVars: GetStorefrontByUserIdVariables = {
  userId: ..., 
};

// Call the `getStorefrontByUserIdRef()` function to get a reference to the query.
const ref = getStorefrontByUserIdRef(getStorefrontByUserIdVars);
// Variables can be defined inline as well.
const ref = getStorefrontByUserIdRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getStorefrontByUserIdRef(dataConnect, getStorefrontByUserIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.storefronts);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.storefronts);
});
```

## ListActiveStorefronts
You can execute the `ListActiveStorefronts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [marketplace/index.d.ts](./index.d.ts):
```typescript
listActiveStorefronts(vars?: ListActiveStorefrontsVariables, options?: ExecuteQueryOptions): QueryPromise<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;

interface ListActiveStorefrontsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListActiveStorefrontsVariables): QueryRef<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;
}
export const listActiveStorefrontsRef: ListActiveStorefrontsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listActiveStorefronts(dc: DataConnect, vars?: ListActiveStorefrontsVariables, options?: ExecuteQueryOptions): QueryPromise<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;

interface ListActiveStorefrontsRef {
  ...
  (dc: DataConnect, vars?: ListActiveStorefrontsVariables): QueryRef<ListActiveStorefrontsData, ListActiveStorefrontsVariables>;
}
export const listActiveStorefrontsRef: ListActiveStorefrontsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listActiveStorefrontsRef:
```typescript
const name = listActiveStorefrontsRef.operationName;
console.log(name);
```

### Variables
The `ListActiveStorefronts` query has an optional argument of type `ListActiveStorefrontsVariables`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListActiveStorefrontsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListActiveStorefronts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListActiveStorefrontsData`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListActiveStorefronts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listActiveStorefronts, ListActiveStorefrontsVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `ListActiveStorefronts` query has an optional argument of type `ListActiveStorefrontsVariables`:
const listActiveStorefrontsVars: ListActiveStorefrontsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listActiveStorefronts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listActiveStorefronts(listActiveStorefrontsVars);
// Variables can be defined inline as well.
const { data } = await listActiveStorefronts({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListActiveStorefrontsVariables` argument.
const { data } = await listActiveStorefronts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listActiveStorefronts(dataConnect, listActiveStorefrontsVars);

console.log(data.storefronts);

// Or, you can use the `Promise` API.
listActiveStorefronts(listActiveStorefrontsVars).then((response) => {
  const data = response.data;
  console.log(data.storefronts);
});
```

### Using `ListActiveStorefronts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listActiveStorefrontsRef, ListActiveStorefrontsVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `ListActiveStorefronts` query has an optional argument of type `ListActiveStorefrontsVariables`:
const listActiveStorefrontsVars: ListActiveStorefrontsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listActiveStorefrontsRef()` function to get a reference to the query.
const ref = listActiveStorefrontsRef(listActiveStorefrontsVars);
// Variables can be defined inline as well.
const ref = listActiveStorefrontsRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListActiveStorefrontsVariables` argument.
const ref = listActiveStorefrontsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listActiveStorefrontsRef(dataConnect, listActiveStorefrontsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.storefronts);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.storefronts);
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

Below are examples of how to use the `marketplace` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertUser
You can execute the `UpsertUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [marketplace/index.d.ts](./index.d.ts):
```typescript
upsertUser(vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
}
export const upsertUserRef: UpsertUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertUser(dc: DataConnect, vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertUserRef {
  ...
  (dc: DataConnect, vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
}
export const upsertUserRef: UpsertUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertUserRef:
```typescript
const name = upsertUserRef.operationName;
console.log(name);
```

### Variables
The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertUserData`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertUserData {
  user_upsert: User_Key;
}
```
### Using `UpsertUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertUser, UpsertUserVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`:
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

// Call the `upsertUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertUser(upsertUserVars);
// Variables can be defined inline as well.
const { data } = await upsertUser({ id: ..., email: ..., displayName: ..., phoneNumber: ..., bio: ..., role: ..., emailVerified: ..., photoUrl: ..., location: ..., latitude: ..., longitude: ..., company: ..., businessName: ..., street1: ..., street2: ..., city: ..., state: ..., county: ..., postalCode: ..., country: ..., website: ..., accountStatus: ..., parentAccountUid: ..., accountAccessSource: ..., mfaEnabled: ..., mfaMethod: ..., mfaPhoneNumber: ..., mfaEnrolledAt: ..., favorites: ..., storefrontEnabled: ..., storefrontSlug: ..., storefrontName: ..., storefrontTagline: ..., storefrontDescription: ..., storefrontLogoUrl: ..., coverPhotoUrl: ..., seoTitle: ..., seoDescription: ..., seoKeywords: ..., metadataJson: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertUser(dataConnect, upsertUserVars);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
upsertUser(upsertUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

### Using `UpsertUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertUserRef, UpsertUserVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`:
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

// Call the `upsertUserRef()` function to get a reference to the mutation.
const ref = upsertUserRef(upsertUserVars);
// Variables can be defined inline as well.
const ref = upsertUserRef({ id: ..., email: ..., displayName: ..., phoneNumber: ..., bio: ..., role: ..., emailVerified: ..., photoUrl: ..., location: ..., latitude: ..., longitude: ..., company: ..., businessName: ..., street1: ..., street2: ..., city: ..., state: ..., county: ..., postalCode: ..., country: ..., website: ..., accountStatus: ..., parentAccountUid: ..., accountAccessSource: ..., mfaEnabled: ..., mfaMethod: ..., mfaPhoneNumber: ..., mfaEnrolledAt: ..., favorites: ..., storefrontEnabled: ..., storefrontSlug: ..., storefrontName: ..., storefrontTagline: ..., storefrontDescription: ..., storefrontLogoUrl: ..., coverPhotoUrl: ..., seoTitle: ..., seoDescription: ..., seoKeywords: ..., metadataJson: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertUserRef(dataConnect, upsertUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

## UpsertStorefront
You can execute the `UpsertStorefront` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [marketplace/index.d.ts](./index.d.ts):
```typescript
upsertStorefront(vars: UpsertStorefrontVariables): MutationPromise<UpsertStorefrontData, UpsertStorefrontVariables>;

interface UpsertStorefrontRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertStorefrontVariables): MutationRef<UpsertStorefrontData, UpsertStorefrontVariables>;
}
export const upsertStorefrontRef: UpsertStorefrontRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertStorefront(dc: DataConnect, vars: UpsertStorefrontVariables): MutationPromise<UpsertStorefrontData, UpsertStorefrontVariables>;

interface UpsertStorefrontRef {
  ...
  (dc: DataConnect, vars: UpsertStorefrontVariables): MutationRef<UpsertStorefrontData, UpsertStorefrontVariables>;
}
export const upsertStorefrontRef: UpsertStorefrontRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertStorefrontRef:
```typescript
const name = upsertStorefrontRef.operationName;
console.log(name);
```

### Variables
The `UpsertStorefront` mutation requires an argument of type `UpsertStorefrontVariables`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertStorefront` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertStorefrontData`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertStorefrontData {
  storefront_upsert: Storefront_Key;
}
```
### Using `UpsertStorefront`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertStorefront, UpsertStorefrontVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `UpsertStorefront` mutation requires an argument of type `UpsertStorefrontVariables`:
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

// Call the `upsertStorefront()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertStorefront(upsertStorefrontVars);
// Variables can be defined inline as well.
const { data } = await upsertStorefront({ id: ..., userId: ..., storefrontEnabled: ..., storefrontSlug: ..., canonicalPath: ..., storefrontName: ..., storefrontTagline: ..., storefrontDescription: ..., logoUrl: ..., coverPhotoUrl: ..., businessName: ..., street1: ..., street2: ..., city: ..., state: ..., county: ..., postalCode: ..., country: ..., location: ..., latitude: ..., longitude: ..., phone: ..., email: ..., website: ..., serviceAreaScopes: ..., serviceAreaStates: ..., serviceAreaCounties: ..., servicesOfferedCategories: ..., servicesOfferedSubcategories: ..., seoTitle: ..., seoDescription: ..., seoKeywords: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertStorefront(dataConnect, upsertStorefrontVars);

console.log(data.storefront_upsert);

// Or, you can use the `Promise` API.
upsertStorefront(upsertStorefrontVars).then((response) => {
  const data = response.data;
  console.log(data.storefront_upsert);
});
```

### Using `UpsertStorefront`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertStorefrontRef, UpsertStorefrontVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `UpsertStorefront` mutation requires an argument of type `UpsertStorefrontVariables`:
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

// Call the `upsertStorefrontRef()` function to get a reference to the mutation.
const ref = upsertStorefrontRef(upsertStorefrontVars);
// Variables can be defined inline as well.
const ref = upsertStorefrontRef({ id: ..., userId: ..., storefrontEnabled: ..., storefrontSlug: ..., canonicalPath: ..., storefrontName: ..., storefrontTagline: ..., storefrontDescription: ..., logoUrl: ..., coverPhotoUrl: ..., businessName: ..., street1: ..., street2: ..., city: ..., state: ..., county: ..., postalCode: ..., country: ..., location: ..., latitude: ..., longitude: ..., phone: ..., email: ..., website: ..., serviceAreaScopes: ..., serviceAreaStates: ..., serviceAreaCounties: ..., servicesOfferedCategories: ..., servicesOfferedSubcategories: ..., seoTitle: ..., seoDescription: ..., seoKeywords: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertStorefrontRef(dataConnect, upsertStorefrontVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.storefront_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.storefront_upsert);
});
```

## DeleteUser
You can execute the `DeleteUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [marketplace/index.d.ts](./index.d.ts):
```typescript
deleteUser(vars: DeleteUserVariables): MutationPromise<DeleteUserData, DeleteUserVariables>;

interface DeleteUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUserVariables): MutationRef<DeleteUserData, DeleteUserVariables>;
}
export const deleteUserRef: DeleteUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteUser(dc: DataConnect, vars: DeleteUserVariables): MutationPromise<DeleteUserData, DeleteUserVariables>;

interface DeleteUserRef {
  ...
  (dc: DataConnect, vars: DeleteUserVariables): MutationRef<DeleteUserData, DeleteUserVariables>;
}
export const deleteUserRef: DeleteUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteUserRef:
```typescript
const name = deleteUserRef.operationName;
console.log(name);
```

### Variables
The `DeleteUser` mutation requires an argument of type `DeleteUserVariables`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteUserVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteUserData`, which is defined in [marketplace/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteUserData {
  user_delete?: User_Key | null;
}
```
### Using `DeleteUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteUser, DeleteUserVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `DeleteUser` mutation requires an argument of type `DeleteUserVariables`:
const deleteUserVars: DeleteUserVariables = {
  id: ..., 
};

// Call the `deleteUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteUser(deleteUserVars);
// Variables can be defined inline as well.
const { data } = await deleteUser({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteUser(dataConnect, deleteUserVars);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
deleteUser(deleteUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

### Using `DeleteUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteUserRef, DeleteUserVariables } from '@dataconnect/generated-timberequip-marketplace';

// The `DeleteUser` mutation requires an argument of type `DeleteUserVariables`:
const deleteUserVars: DeleteUserVariables = {
  id: ..., 
};

// Call the `deleteUserRef()` function to get a reference to the mutation.
const ref = deleteUserRef(deleteUserVars);
// Variables can be defined inline as well.
const ref = deleteUserRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteUserRef(dataConnect, deleteUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

