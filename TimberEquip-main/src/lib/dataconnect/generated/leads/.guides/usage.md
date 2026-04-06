# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useGetInquiryById, useListInquiriesBySeller, useListInquiriesByBuyer, useListInquiriesByListing, useListInquiriesByStatus, useGetFinancingRequestById, useListFinancingRequestsBySeller, useListFinancingRequestsByBuyer, useGetCallLogById, useListCallLogsBySeller } from '@dataconnect/generated-timberequip-leads/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useGetInquiryById(getInquiryByIdVars);

const { data, isPending, isSuccess, isError, error } = useListInquiriesBySeller(listInquiriesBySellerVars);

const { data, isPending, isSuccess, isError, error } = useListInquiriesByBuyer(listInquiriesByBuyerVars);

const { data, isPending, isSuccess, isError, error } = useListInquiriesByListing(listInquiriesByListingVars);

const { data, isPending, isSuccess, isError, error } = useListInquiriesByStatus(listInquiriesByStatusVars);

const { data, isPending, isSuccess, isError, error } = useGetFinancingRequestById(getFinancingRequestByIdVars);

const { data, isPending, isSuccess, isError, error } = useListFinancingRequestsBySeller(listFinancingRequestsBySellerVars);

const { data, isPending, isSuccess, isError, error } = useListFinancingRequestsByBuyer(listFinancingRequestsByBuyerVars);

const { data, isPending, isSuccess, isError, error } = useGetCallLogById(getCallLogByIdVars);

const { data, isPending, isSuccess, isError, error } = useListCallLogsBySeller(listCallLogsBySellerVars);

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
import { getInquiryById, listInquiriesBySeller, listInquiriesByBuyer, listInquiriesByListing, listInquiriesByStatus, getFinancingRequestById, listFinancingRequestsBySeller, listFinancingRequestsByBuyer, getCallLogById, listCallLogsBySeller } from '@dataconnect/generated-timberequip-leads';


// Operation GetInquiryById:  For variables, look at type GetInquiryByIdVars in ../index.d.ts
const { data } = await GetInquiryById(dataConnect, getInquiryByIdVars);

// Operation ListInquiriesBySeller:  For variables, look at type ListInquiriesBySellerVars in ../index.d.ts
const { data } = await ListInquiriesBySeller(dataConnect, listInquiriesBySellerVars);

// Operation ListInquiriesByBuyer:  For variables, look at type ListInquiriesByBuyerVars in ../index.d.ts
const { data } = await ListInquiriesByBuyer(dataConnect, listInquiriesByBuyerVars);

// Operation ListInquiriesByListing:  For variables, look at type ListInquiriesByListingVars in ../index.d.ts
const { data } = await ListInquiriesByListing(dataConnect, listInquiriesByListingVars);

// Operation ListInquiriesByStatus:  For variables, look at type ListInquiriesByStatusVars in ../index.d.ts
const { data } = await ListInquiriesByStatus(dataConnect, listInquiriesByStatusVars);

// Operation GetFinancingRequestById:  For variables, look at type GetFinancingRequestByIdVars in ../index.d.ts
const { data } = await GetFinancingRequestById(dataConnect, getFinancingRequestByIdVars);

// Operation ListFinancingRequestsBySeller:  For variables, look at type ListFinancingRequestsBySellerVars in ../index.d.ts
const { data } = await ListFinancingRequestsBySeller(dataConnect, listFinancingRequestsBySellerVars);

// Operation ListFinancingRequestsByBuyer:  For variables, look at type ListFinancingRequestsByBuyerVars in ../index.d.ts
const { data } = await ListFinancingRequestsByBuyer(dataConnect, listFinancingRequestsByBuyerVars);

// Operation GetCallLogById:  For variables, look at type GetCallLogByIdVars in ../index.d.ts
const { data } = await GetCallLogById(dataConnect, getCallLogByIdVars);

// Operation ListCallLogsBySeller:  For variables, look at type ListCallLogsBySellerVars in ../index.d.ts
const { data } = await ListCallLogsBySeller(dataConnect, listCallLogsBySellerVars);


```