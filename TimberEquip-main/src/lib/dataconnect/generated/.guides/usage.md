# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useFindListingByFirestoreId, useInsertListingShadow, useUpdateListingShadow, useDeleteListingShadow, useRecordListingStateTransition, useGetListingGovernance, useListLifecycleQueue, useListListingTransitions, useListOpenListingAnomalies, useSubmitListing } from '@dataconnect/generated-timberequip-listing-governance/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useFindListingByFirestoreId(findListingByFirestoreIdVars);

const { data, isPending, isSuccess, isError, error } = useInsertListingShadow(insertListingShadowVars);

const { data, isPending, isSuccess, isError, error } = useUpdateListingShadow(updateListingShadowVars);

const { data, isPending, isSuccess, isError, error } = useDeleteListingShadow(deleteListingShadowVars);

const { data, isPending, isSuccess, isError, error } = useRecordListingStateTransition(recordListingStateTransitionVars);

const { data, isPending, isSuccess, isError, error } = useGetListingGovernance(getListingGovernanceVars);

const { data, isPending, isSuccess, isError, error } = useListLifecycleQueue(listLifecycleQueueVars);

const { data, isPending, isSuccess, isError, error } = useListListingTransitions(listListingTransitionsVars);

const { data, isPending, isSuccess, isError, error } = useListOpenListingAnomalies(listOpenListingAnomaliesVars);

const { data, isPending, isSuccess, isError, error } = useSubmitListing(submitListingVars);

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
import { findListingByFirestoreId, insertListingShadow, updateListingShadow, deleteListingShadow, recordListingStateTransition, getListingGovernance, listLifecycleQueue, listListingTransitions, listOpenListingAnomalies, submitListing } from '@dataconnect/generated-timberequip-listing-governance';


// Operation FindListingByFirestoreId:  For variables, look at type FindListingByFirestoreIdVars in ../index.d.ts
const { data } = await FindListingByFirestoreId(dataConnect, findListingByFirestoreIdVars);

// Operation InsertListingShadow:  For variables, look at type InsertListingShadowVars in ../index.d.ts
const { data } = await InsertListingShadow(dataConnect, insertListingShadowVars);

// Operation UpdateListingShadow:  For variables, look at type UpdateListingShadowVars in ../index.d.ts
const { data } = await UpdateListingShadow(dataConnect, updateListingShadowVars);

// Operation DeleteListingShadow:  For variables, look at type DeleteListingShadowVars in ../index.d.ts
const { data } = await DeleteListingShadow(dataConnect, deleteListingShadowVars);

// Operation RecordListingStateTransition:  For variables, look at type RecordListingStateTransitionVars in ../index.d.ts
const { data } = await RecordListingStateTransition(dataConnect, recordListingStateTransitionVars);

// Operation GetListingGovernance:  For variables, look at type GetListingGovernanceVars in ../index.d.ts
const { data } = await GetListingGovernance(dataConnect, getListingGovernanceVars);

// Operation ListLifecycleQueue:  For variables, look at type ListLifecycleQueueVars in ../index.d.ts
const { data } = await ListLifecycleQueue(dataConnect, listLifecycleQueueVars);

// Operation ListListingTransitions:  For variables, look at type ListListingTransitionsVars in ../index.d.ts
const { data } = await ListListingTransitions(dataConnect, listListingTransitionsVars);

// Operation ListOpenListingAnomalies:  For variables, look at type ListOpenListingAnomaliesVars in ../index.d.ts
const { data } = await ListOpenListingAnomalies(dataConnect, listOpenListingAnomaliesVars);

// Operation SubmitListing:  For variables, look at type SubmitListingVars in ../index.d.ts
const { data } = await SubmitListing(dataConnect, submitListingVars);


```