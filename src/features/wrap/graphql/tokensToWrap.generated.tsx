import * as Types from '../../../graphql/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type TokensToWrapQueryVariables = Types.Exact<{
  userAddress: Types.Scalars['String'];
  contractAddress: Types.Scalars['String'];
  contractSlug: Types.Scalars['String'];
  testnet?: Types.InputMaybe<Types.Scalars['Boolean']>;
  cursor?: Types.InputMaybe<Types.Scalars['String']>;
  page?: Types.InputMaybe<Types.Scalars['Int']>;
  pageSize?: Types.InputMaybe<Types.Scalars['Int']>;
}>;


export type TokensToWrapQuery = { __typename?: 'Query', assetsForUserInExactCollection: { __typename?: 'OpenSeaAssetPagination', cursor?: string | null, page: number, assets: Array<{ __typename?: 'OpenSeaAsset', id: string, tokenId: string, name?: string | null, thumbnailUrl?: string | null }> } };


export const TokensToWrapDocument = gql`
    query tokensToWrap($userAddress: String!, $contractAddress: String!, $contractSlug: String!, $testnet: Boolean, $cursor: String, $page: Int, $pageSize: Int) {
  assetsForUserInExactCollection(
    address: $userAddress
    collectionSlug: $contractSlug
    contractAddress: $contractAddress
    testnet: $testnet
    cursor: $cursor
    page: $page
    pageSize: $pageSize
  ) {
    cursor
    page
    assets {
      id
      tokenId
      name
      thumbnailUrl
    }
  }
}
    `;

/**
 * __useTokensToWrapQuery__
 *
 * To run a query within a React component, call `useTokensToWrapQuery` and pass it any options that fit your needs.
 * When your component renders, `useTokensToWrapQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTokensToWrapQuery({
 *   variables: {
 *      userAddress: // value for 'userAddress'
 *      contractAddress: // value for 'contractAddress'
 *      contractSlug: // value for 'contractSlug'
 *      testnet: // value for 'testnet'
 *      cursor: // value for 'cursor'
 *      page: // value for 'page'
 *      pageSize: // value for 'pageSize'
 *   },
 * });
 */
export function useTokensToWrapQuery(baseOptions: Apollo.QueryHookOptions<TokensToWrapQuery, TokensToWrapQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TokensToWrapQuery, TokensToWrapQueryVariables>(TokensToWrapDocument, options);
      }
export function useTokensToWrapLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TokensToWrapQuery, TokensToWrapQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TokensToWrapQuery, TokensToWrapQueryVariables>(TokensToWrapDocument, options);
        }
export type TokensToWrapQueryHookResult = ReturnType<typeof useTokensToWrapQuery>;
export type TokensToWrapLazyQueryHookResult = ReturnType<typeof useTokensToWrapLazyQuery>;
export type TokensToWrapQueryResult = Apollo.QueryResult<TokensToWrapQuery, TokensToWrapQueryVariables>;