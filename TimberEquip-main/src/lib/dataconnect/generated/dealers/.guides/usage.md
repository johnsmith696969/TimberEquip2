# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useGetDealerFeedProfileById, useListDealerFeedProfilesBySeller, useListDealerFeedProfilesByStatus, useListDealerListingsByFeed, useListDealerListingsBySeller, useGetDealerListingByHash, useListIngestLogsByFeed, useListIngestLogsBySeller, useListAuditLogsByFeed, useListWebhooksByDealer } from '@dataconnect/generated-timberequip-dealers/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useGetDealerFeedProfileById(getDealerFeedProfileByIdVars);

const { data, isPending, isSuccess, isError, error } = useListDealerFeedProfilesBySeller(listDealerFeedProfilesBySellerVars);

const { data, isPending, isSuccess, isError, error } = useListDealerFeedProfilesByStatus(listDealerFeedProfilesByStatusVars);

const { data, isPending, isSuccess, isError, error } = useListDealerListingsByFeed(listDealerListingsByFeedVars);

const { data, isPending, isSuccess, isError, error } = useListDealerListingsBySeller(listDealerListingsBySellerVars);

const { data, isPending, isSuccess, isError, error } = useGetDealerListingByHash(getDealerListingByHashVars);

const { data, isPending, isSuccess, isError, error } = useListIngestLogsByFeed(listIngestLogsByFeedVars);

const { data, isPending, isSuccess, isError, error } = useListIngestLogsBySeller(listIngestLogsBySellerVars);

const { data, isPending, isSuccess, isError, error } = useListAuditLogsByFeed(listAuditLogsByFeedVars);

const { data, isPending, isSuccess, isError, error } = useListWebhooksByDealer(listWebhooksByDealerVars);

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
import { getDealerFeedProfileById, listDealerFeedProfilesBySeller, listDealerFeedProfilesByStatus, listDealerListingsByFeed, listDealerListingsBySeller, getDealerListingByHash, listIngestLogsByFeed, listIngestLogsBySeller, listAuditLogsByFeed, listWebhooksByDealer } from '@dataconnect/generated-timberequip-dealers';


// Operation GetDealerFeedProfileById:  For variables, look at type GetDealerFeedProfileByIdVars in ../index.d.ts
const { data } = await GetDealerFeedProfileById(dataConnect, getDealerFeedProfileByIdVars);

// Operation ListDealerFeedProfilesBySeller:  For variables, look at type ListDealerFeedProfilesBySellerVars in ../index.d.ts
const { data } = await ListDealerFeedProfilesBySeller(dataConnect, listDealerFeedProfilesBySellerVars);

// Operation ListDealerFeedProfilesByStatus:  For variables, look at type ListDealerFeedProfilesByStatusVars in ../index.d.ts
const { data } = await ListDealerFeedProfilesByStatus(dataConnect, listDealerFeedProfilesByStatusVars);

// Operation ListDealerListingsByFeed:  For variables, look at type ListDealerListingsByFeedVars in ../index.d.ts
const { data } = await ListDealerListingsByFeed(dataConnect, listDealerListingsByFeedVars);

// Operation ListDealerListingsBySeller:  For variables, look at type ListDealerListingsBySellerVars in ../index.d.ts
const { data } = await ListDealerListingsBySeller(dataConnect, listDealerListingsBySellerVars);

// Operation GetDealerListingByHash:  For variables, look at type GetDealerListingByHashVars in ../index.d.ts
const { data } = await GetDealerListingByHash(dataConnect, getDealerListingByHashVars);

// Operation ListIngestLogsByFeed:  For variables, look at type ListIngestLogsByFeedVars in ../index.d.ts
const { data } = await ListIngestLogsByFeed(dataConnect, listIngestLogsByFeedVars);

// Operation ListIngestLogsBySeller:  For variables, look at type ListIngestLogsBySellerVars in ../index.d.ts
const { data } = await ListIngestLogsBySeller(dataConnect, listIngestLogsBySellerVars);

// Operation ListAuditLogsByFeed:  For variables, look at type ListAuditLogsByFeedVars in ../index.d.ts
const { data } = await ListAuditLogsByFeed(dataConnect, listAuditLogsByFeedVars);

// Operation ListWebhooksByDealer:  For variables, look at type ListWebhooksByDealerVars in ../index.d.ts
const { data } = await ListWebhooksByDealer(dataConnect, listWebhooksByDealerVars);


```