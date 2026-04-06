# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useGetAuctionById, useGetAuctionBySlug, useListActiveAuctions, useListAuctionsByStatus, useGetLotsByAuction, useGetLotById, useGetPromotedLots, useGetBidsByLot, useGetBidsByBidder, useGetAuctionInvoicesByBuyer } from '@dataconnect/generated-timberequip-auctions/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useGetAuctionById(getAuctionByIdVars);

const { data, isPending, isSuccess, isError, error } = useGetAuctionBySlug(getAuctionBySlugVars);

const { data, isPending, isSuccess, isError, error } = useListActiveAuctions(listActiveAuctionsVars);

const { data, isPending, isSuccess, isError, error } = useListAuctionsByStatus(listAuctionsByStatusVars);

const { data, isPending, isSuccess, isError, error } = useGetLotsByAuction(getLotsByAuctionVars);

const { data, isPending, isSuccess, isError, error } = useGetLotById(getLotByIdVars);

const { data, isPending, isSuccess, isError, error } = useGetPromotedLots(getPromotedLotsVars);

const { data, isPending, isSuccess, isError, error } = useGetBidsByLot(getBidsByLotVars);

const { data, isPending, isSuccess, isError, error } = useGetBidsByBidder(getBidsByBidderVars);

const { data, isPending, isSuccess, isError, error } = useGetAuctionInvoicesByBuyer(getAuctionInvoicesByBuyerVars);

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
import { getAuctionById, getAuctionBySlug, listActiveAuctions, listAuctionsByStatus, getLotsByAuction, getLotById, getPromotedLots, getBidsByLot, getBidsByBidder, getAuctionInvoicesByBuyer } from '@dataconnect/generated-timberequip-auctions';


// Operation GetAuctionById:  For variables, look at type GetAuctionByIdVars in ../index.d.ts
const { data } = await GetAuctionById(dataConnect, getAuctionByIdVars);

// Operation GetAuctionBySlug:  For variables, look at type GetAuctionBySlugVars in ../index.d.ts
const { data } = await GetAuctionBySlug(dataConnect, getAuctionBySlugVars);

// Operation ListActiveAuctions:  For variables, look at type ListActiveAuctionsVars in ../index.d.ts
const { data } = await ListActiveAuctions(dataConnect, listActiveAuctionsVars);

// Operation ListAuctionsByStatus:  For variables, look at type ListAuctionsByStatusVars in ../index.d.ts
const { data } = await ListAuctionsByStatus(dataConnect, listAuctionsByStatusVars);

// Operation GetLotsByAuction:  For variables, look at type GetLotsByAuctionVars in ../index.d.ts
const { data } = await GetLotsByAuction(dataConnect, getLotsByAuctionVars);

// Operation GetLotById:  For variables, look at type GetLotByIdVars in ../index.d.ts
const { data } = await GetLotById(dataConnect, getLotByIdVars);

// Operation GetPromotedLots:  For variables, look at type GetPromotedLotsVars in ../index.d.ts
const { data } = await GetPromotedLots(dataConnect, getPromotedLotsVars);

// Operation GetBidsByLot:  For variables, look at type GetBidsByLotVars in ../index.d.ts
const { data } = await GetBidsByLot(dataConnect, getBidsByLotVars);

// Operation GetBidsByBidder:  For variables, look at type GetBidsByBidderVars in ../index.d.ts
const { data } = await GetBidsByBidder(dataConnect, getBidsByBidderVars);

// Operation GetAuctionInvoicesByBuyer:  For variables, look at type GetAuctionInvoicesByBuyerVars in ../index.d.ts
const { data } = await GetAuctionInvoicesByBuyer(dataConnect, getAuctionInvoicesByBuyerVars);


```