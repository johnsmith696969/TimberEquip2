# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useGetListingGovernance, useListLifecycleQueue, useListListingTransitions, useListOpenListingAnomalies, useSubmitListing, useApproveListing, useRejectListing, useConfirmListingPayment, usePublishListing, useExpireListing } from '@dataconnect/generated-timberequip-listing-governance/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useGetListingGovernance(getListingGovernanceVars);

const { data, isPending, isSuccess, isError, error } = useListLifecycleQueue(listLifecycleQueueVars);

const { data, isPending, isSuccess, isError, error } = useListListingTransitions(listListingTransitionsVars);

const { data, isPending, isSuccess, isError, error } = useListOpenListingAnomalies(listOpenListingAnomaliesVars);

const { data, isPending, isSuccess, isError, error } = useSubmitListing(submitListingVars);

const { data, isPending, isSuccess, isError, error } = useApproveListing(approveListingVars);

const { data, isPending, isSuccess, isError, error } = useRejectListing(rejectListingVars);

const { data, isPending, isSuccess, isError, error } = useConfirmListingPayment(confirmListingPaymentVars);

const { data, isPending, isSuccess, isError, error } = usePublishListing(publishListingVars);

const { data, isPending, isSuccess, isError, error } = useExpireListing(expireListingVars);

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
import { getListingGovernance, listLifecycleQueue, listListingTransitions, listOpenListingAnomalies, submitListing, approveListing, rejectListing, confirmListingPayment, publishListing, expireListing } from '@dataconnect/generated-timberequip-listing-governance';


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

// Operation ApproveListing:  For variables, look at type ApproveListingVars in ../index.d.ts
const { data } = await ApproveListing(dataConnect, approveListingVars);

// Operation RejectListing:  For variables, look at type RejectListingVars in ../index.d.ts
const { data } = await RejectListing(dataConnect, rejectListingVars);

// Operation ConfirmListingPayment:  For variables, look at type ConfirmListingPaymentVars in ../index.d.ts
const { data } = await ConfirmListingPayment(dataConnect, confirmListingPaymentVars);

// Operation PublishListing:  For variables, look at type PublishListingVars in ../index.d.ts
const { data } = await PublishListing(dataConnect, publishListingVars);

// Operation ExpireListing:  For variables, look at type ExpireListingVars in ../index.d.ts
const { data } = await ExpireListing(dataConnect, expireListingVars);


```