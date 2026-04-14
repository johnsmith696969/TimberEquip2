# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useGetSubscriptionsByUser, useGetActiveSubscriptionForListing, useGetSubscriptionByStripeId, useGetInvoicesByUser, useGetSellerApplicationsByUser, useUpsertSubscription, useUpsertInvoice, useUpsertSellerApplication, useUpdateSubscriptionStatus, useUpdateInvoiceStatus } from '@dataconnect/generated-timberequip-billing/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useGetSubscriptionsByUser(getSubscriptionsByUserVars);

const { data, isPending, isSuccess, isError, error } = useGetActiveSubscriptionForListing(getActiveSubscriptionForListingVars);

const { data, isPending, isSuccess, isError, error } = useGetSubscriptionByStripeId(getSubscriptionByStripeIdVars);

const { data, isPending, isSuccess, isError, error } = useGetInvoicesByUser(getInvoicesByUserVars);

const { data, isPending, isSuccess, isError, error } = useGetSellerApplicationsByUser(getSellerApplicationsByUserVars);

const { data, isPending, isSuccess, isError, error } = useUpsertSubscription(upsertSubscriptionVars);

const { data, isPending, isSuccess, isError, error } = useUpsertInvoice(upsertInvoiceVars);

const { data, isPending, isSuccess, isError, error } = useUpsertSellerApplication(upsertSellerApplicationVars);

const { data, isPending, isSuccess, isError, error } = useUpdateSubscriptionStatus(updateSubscriptionStatusVars);

const { data, isPending, isSuccess, isError, error } = useUpdateInvoiceStatus(updateInvoiceStatusVars);

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
import { getSubscriptionsByUser, getActiveSubscriptionForListing, getSubscriptionByStripeId, getInvoicesByUser, getSellerApplicationsByUser, upsertSubscription, upsertInvoice, upsertSellerApplication, updateSubscriptionStatus, updateInvoiceStatus } from '@dataconnect/generated-timberequip-billing';


// Operation GetSubscriptionsByUser:  For variables, look at type GetSubscriptionsByUserVars in ../index.d.ts
const { data } = await GetSubscriptionsByUser(dataConnect, getSubscriptionsByUserVars);

// Operation GetActiveSubscriptionForListing:  For variables, look at type GetActiveSubscriptionForListingVars in ../index.d.ts
const { data } = await GetActiveSubscriptionForListing(dataConnect, getActiveSubscriptionForListingVars);

// Operation GetSubscriptionByStripeId:  For variables, look at type GetSubscriptionByStripeIdVars in ../index.d.ts
const { data } = await GetSubscriptionByStripeId(dataConnect, getSubscriptionByStripeIdVars);

// Operation GetInvoicesByUser:  For variables, look at type GetInvoicesByUserVars in ../index.d.ts
const { data } = await GetInvoicesByUser(dataConnect, getInvoicesByUserVars);

// Operation GetSellerApplicationsByUser:  For variables, look at type GetSellerApplicationsByUserVars in ../index.d.ts
const { data } = await GetSellerApplicationsByUser(dataConnect, getSellerApplicationsByUserVars);

// Operation UpsertSubscription:  For variables, look at type UpsertSubscriptionVars in ../index.d.ts
const { data } = await UpsertSubscription(dataConnect, upsertSubscriptionVars);

// Operation UpsertInvoice:  For variables, look at type UpsertInvoiceVars in ../index.d.ts
const { data } = await UpsertInvoice(dataConnect, upsertInvoiceVars);

// Operation UpsertSellerApplication:  For variables, look at type UpsertSellerApplicationVars in ../index.d.ts
const { data } = await UpsertSellerApplication(dataConnect, upsertSellerApplicationVars);

// Operation UpdateSubscriptionStatus:  For variables, look at type UpdateSubscriptionStatusVars in ../index.d.ts
const { data } = await UpdateSubscriptionStatus(dataConnect, updateSubscriptionStatusVars);

// Operation UpdateInvoiceStatus:  For variables, look at type UpdateInvoiceStatusVars in ../index.d.ts
const { data } = await UpdateInvoiceStatus(dataConnect, updateInvoiceStatusVars);


```