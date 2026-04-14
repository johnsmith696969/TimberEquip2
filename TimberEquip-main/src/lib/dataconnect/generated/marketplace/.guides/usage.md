# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useGetUserById, useGetUserByEmail, useListUsersByRole, useGetStorefrontBySlug, useGetStorefrontByUserId, useListActiveStorefronts, useUpsertUser, useUpsertStorefront, useDeleteUser } from '@dataconnect/generated-timberequip-marketplace/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useGetUserById(getUserByIdVars);

const { data, isPending, isSuccess, isError, error } = useGetUserByEmail(getUserByEmailVars);

const { data, isPending, isSuccess, isError, error } = useListUsersByRole(listUsersByRoleVars);

const { data, isPending, isSuccess, isError, error } = useGetStorefrontBySlug(getStorefrontBySlugVars);

const { data, isPending, isSuccess, isError, error } = useGetStorefrontByUserId(getStorefrontByUserIdVars);

const { data, isPending, isSuccess, isError, error } = useListActiveStorefronts(listActiveStorefrontsVars);

const { data, isPending, isSuccess, isError, error } = useUpsertUser(upsertUserVars);

const { data, isPending, isSuccess, isError, error } = useUpsertStorefront(upsertStorefrontVars);

const { data, isPending, isSuccess, isError, error } = useDeleteUser(deleteUserVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { getUserById, getUserByEmail, listUsersByRole, getStorefrontBySlug, getStorefrontByUserId, listActiveStorefronts, upsertUser, upsertStorefront, deleteUser } from '@dataconnect/generated-timberequip-marketplace';


// Operation GetUserById:  For variables, look at type GetUserByIdVars in ../index.d.ts
const { data } = await GetUserById(dataConnect, getUserByIdVars);

// Operation GetUserByEmail:  For variables, look at type GetUserByEmailVars in ../index.d.ts
const { data } = await GetUserByEmail(dataConnect, getUserByEmailVars);

// Operation ListUsersByRole:  For variables, look at type ListUsersByRoleVars in ../index.d.ts
const { data } = await ListUsersByRole(dataConnect, listUsersByRoleVars);

// Operation GetStorefrontBySlug:  For variables, look at type GetStorefrontBySlugVars in ../index.d.ts
const { data } = await GetStorefrontBySlug(dataConnect, getStorefrontBySlugVars);

// Operation GetStorefrontByUserId:  For variables, look at type GetStorefrontByUserIdVars in ../index.d.ts
const { data } = await GetStorefrontByUserId(dataConnect, getStorefrontByUserIdVars);

// Operation ListActiveStorefronts:  For variables, look at type ListActiveStorefrontsVars in ../index.d.ts
const { data } = await ListActiveStorefronts(dataConnect, listActiveStorefrontsVars);

// Operation UpsertUser:  For variables, look at type UpsertUserVars in ../index.d.ts
const { data } = await UpsertUser(dataConnect, upsertUserVars);

// Operation UpsertStorefront:  For variables, look at type UpsertStorefrontVars in ../index.d.ts
const { data } = await UpsertStorefront(dataConnect, upsertStorefrontVars);

// Operation DeleteUser:  For variables, look at type DeleteUserVars in ../index.d.ts
const { data } = await DeleteUser(dataConnect, deleteUserVars);


```