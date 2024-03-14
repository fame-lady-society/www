import { ApolloClient, InMemoryCache } from "@apollo/client";
// import possibleTypes from "./graphql.schema.json"

// const cache = new InMemoryCache({
//   possibleTypes: possibleTypes,
// });

export const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? "/api/graphql",
  // fragmentMatcher: new IntrospectionFragmentMatcher({
  //   introspectionQueryResultData: {} as any,
  // }),

  // Localhost graphql is cross origin, so we need to send credentials
  ...(process.env.NODE_ENV === "development" ? { credentials: "include" } : {}),
  cache: new InMemoryCache(),
});
