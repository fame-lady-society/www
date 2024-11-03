// @ts-nocheck
import { GraphQLResolveInfo, SelectionSetNode, FieldNode, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
import { gql } from '@graphql-mesh/utils';

import type { GetMeshOptions } from '@graphql-mesh/runtime';
import type { YamlConfig } from '@graphql-mesh/types';
import { PubSub } from '@graphql-mesh/utils';
import { DefaultLogger } from '@graphql-mesh/utils';
import MeshCache from "@graphql-mesh/cache-localforage";
import { fetch as fetchFn } from '@whatwg-node/fetch';

import { MeshResolvedSource } from '@graphql-mesh/runtime';
import { MeshTransform, MeshPlugin } from '@graphql-mesh/types';
import GraphqlHandler from "@graphql-mesh/graphql"
import PrefixTransform from "@graphql-mesh/transform-prefix";
import StitchingMerger from "@graphql-mesh/merger-stitching";
import { printWithCache } from '@graphql-mesh/utils';
import { createMeshHTTPHandler, MeshHTTPHandler } from '@graphql-mesh/http';
import { getMesh, ExecuteMeshFn, SubscribeMeshFn, MeshContext as BaseMeshContext, MeshInstance } from '@graphql-mesh/runtime';
import { MeshStore, FsStoreStorageAdapter } from '@graphql-mesh/store';
import { path as pathModule } from '@graphql-mesh/cross-helpers';
import { ImportFn } from '@graphql-mesh/types';
import type { FlsSepoliaTypes } from './sources/fls-sepolia/types';
import type { FlsMainnetTypes } from './sources/fls-mainnet/types';
import type { FameNftBaseTypes } from './sources/fame-nft-base/types';
import * as importedModule$0 from "./sources/fls-mainnet/introspectionSchema";
import * as importedModule$1 from "./sources/fls-sepolia/introspectionSchema";
import * as importedModule$2 from "./sources/fame-nft-base/introspectionSchema";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };



/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: any;
  BigInt: any;
  Bytes: any;
  Int8: any;
  Timestamp: any;
};

export type Query = {
  approval?: Maybe<Approval>;
  approvals: Array<Approval>;
  approvalForAll?: Maybe<ApprovalForAll>;
  approvalForAlls: Array<ApprovalForAll>;
  batchMetadataUpdate?: Maybe<BatchMetadataUpdate>;
  batchMetadataUpdates: Array<BatchMetadataUpdate>;
  metadataUpdate?: Maybe<MetadataUpdate>;
  metadataUpdates: Array<MetadataUpdate>;
  transfer?: Maybe<Transfer>;
  transfers: Array<Transfer>;
  ownership?: Maybe<Ownership>;
  ownerships: Array<Ownership>;
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  sepolia_approval?: Maybe<Approval>;
  sepolia_approvals: Array<Approval>;
  sepolia_approvalForAll?: Maybe<ApprovalForAll>;
  sepolia_approvalForAlls: Array<ApprovalForAll>;
  sepolia_batchMetadataUpdate?: Maybe<BatchMetadataUpdate>;
  sepolia_batchMetadataUpdates: Array<BatchMetadataUpdate>;
  sepolia_metadataUpdate?: Maybe<MetadataUpdate>;
  sepolia_metadataUpdates: Array<MetadataUpdate>;
  sepolia_transfer?: Maybe<Transfer>;
  sepolia_transfers: Array<Transfer>;
  sepolia_ownership?: Maybe<Ownership>;
  sepolia_ownerships: Array<Ownership>;
  /** Access to subgraph metadata */
  sepolia__meta?: Maybe<_Meta_>;
  base_fame_nft_approval?: Maybe<Approval>;
  base_fame_nft_approvals: Array<Approval>;
  base_fame_nft_tokenApproval?: Maybe<TokenApproval>;
  base_fame_nft_tokenApprovals: Array<TokenApproval>;
  base_fame_nft_approvalForAll?: Maybe<ApprovalForAll>;
  base_fame_nft_approvalForAlls: Array<ApprovalForAll>;
  base_fame_nft_batchMetadataUpdate?: Maybe<BatchMetadataUpdate>;
  base_fame_nft_batchMetadataUpdates: Array<BatchMetadataUpdate>;
  base_fame_nft_metadataUpdate?: Maybe<MetadataUpdate>;
  base_fame_nft_metadataUpdates: Array<MetadataUpdate>;
  base_fame_nft_transfer?: Maybe<Transfer>;
  base_fame_nft_transfers: Array<Transfer>;
  base_fame_nft_tokenTransfer?: Maybe<TokenTransfer>;
  base_fame_nft_tokenTransfers: Array<TokenTransfer>;
  base_fame_nft_ownership?: Maybe<Ownership>;
  base_fame_nft_ownerships: Array<Ownership>;
  base_fame_nft_tokenBalance?: Maybe<TokenBalance>;
  base_fame_nft_tokenBalances: Array<TokenBalance>;
  /** Access to subgraph metadata */
  base_fame_nft__meta?: Maybe<_Meta_>;
};


export type QueryapprovalArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryapprovalsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Approval_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Approval_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryapprovalForAllArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryapprovalForAllsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<ApprovalForAll_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ApprovalForAll_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerybatchMetadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerybatchMetadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<BatchMetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<BatchMetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerymetadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerymetadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<MetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<MetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerytransferArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerytransfersArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Transfer_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Transfer_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryownershipArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryownershipsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Ownership_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Ownership_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Query_metaArgs = {
  block?: InputMaybe<Block_height>;
};


export type Querysepolia_approvalArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_approvalsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Approval_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Approval_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_approvalForAllArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_approvalForAllsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<ApprovalForAll_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ApprovalForAll_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_batchMetadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_batchMetadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<BatchMetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<BatchMetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_metadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_metadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<MetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<MetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_transferArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_transfersArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Transfer_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Transfer_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_ownershipArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia_ownershipsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Ownership_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Ownership_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querysepolia__metaArgs = {
  block?: InputMaybe<Block_height>;
};


export type Querybase_fame_nft_approvalArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_approvalsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Approval_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Approval_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_tokenApprovalArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_tokenApprovalsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenApproval_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<TokenApproval_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_approvalForAllArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_approvalForAllsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<ApprovalForAll_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ApprovalForAll_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_batchMetadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_batchMetadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<BatchMetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<BatchMetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_metadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_metadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<MetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<MetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_transferArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_transfersArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Transfer_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Transfer_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_tokenTransferArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_tokenTransfersArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenTransfer_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<TokenTransfer_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_ownershipArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_ownershipsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Ownership_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Ownership_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_tokenBalanceArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft_tokenBalancesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenBalance_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<TokenBalance_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Querybase_fame_nft__metaArgs = {
  block?: InputMaybe<Block_height>;
};

export type Subscription = {
  approval?: Maybe<Approval>;
  approvals: Array<Approval>;
  approvalForAll?: Maybe<ApprovalForAll>;
  approvalForAlls: Array<ApprovalForAll>;
  batchMetadataUpdate?: Maybe<BatchMetadataUpdate>;
  batchMetadataUpdates: Array<BatchMetadataUpdate>;
  metadataUpdate?: Maybe<MetadataUpdate>;
  metadataUpdates: Array<MetadataUpdate>;
  transfer?: Maybe<Transfer>;
  transfers: Array<Transfer>;
  ownership?: Maybe<Ownership>;
  ownerships: Array<Ownership>;
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  sepolia_approval?: Maybe<Approval>;
  sepolia_approvals: Array<Approval>;
  sepolia_approvalForAll?: Maybe<ApprovalForAll>;
  sepolia_approvalForAlls: Array<ApprovalForAll>;
  sepolia_batchMetadataUpdate?: Maybe<BatchMetadataUpdate>;
  sepolia_batchMetadataUpdates: Array<BatchMetadataUpdate>;
  sepolia_metadataUpdate?: Maybe<MetadataUpdate>;
  sepolia_metadataUpdates: Array<MetadataUpdate>;
  sepolia_transfer?: Maybe<Transfer>;
  sepolia_transfers: Array<Transfer>;
  sepolia_ownership?: Maybe<Ownership>;
  sepolia_ownerships: Array<Ownership>;
  /** Access to subgraph metadata */
  sepolia__meta?: Maybe<_Meta_>;
  base_fame_nft_approval?: Maybe<Approval>;
  base_fame_nft_approvals: Array<Approval>;
  base_fame_nft_tokenApproval?: Maybe<TokenApproval>;
  base_fame_nft_tokenApprovals: Array<TokenApproval>;
  base_fame_nft_approvalForAll?: Maybe<ApprovalForAll>;
  base_fame_nft_approvalForAlls: Array<ApprovalForAll>;
  base_fame_nft_batchMetadataUpdate?: Maybe<BatchMetadataUpdate>;
  base_fame_nft_batchMetadataUpdates: Array<BatchMetadataUpdate>;
  base_fame_nft_metadataUpdate?: Maybe<MetadataUpdate>;
  base_fame_nft_metadataUpdates: Array<MetadataUpdate>;
  base_fame_nft_transfer?: Maybe<Transfer>;
  base_fame_nft_transfers: Array<Transfer>;
  base_fame_nft_tokenTransfer?: Maybe<TokenTransfer>;
  base_fame_nft_tokenTransfers: Array<TokenTransfer>;
  base_fame_nft_ownership?: Maybe<Ownership>;
  base_fame_nft_ownerships: Array<Ownership>;
  base_fame_nft_tokenBalance?: Maybe<TokenBalance>;
  base_fame_nft_tokenBalances: Array<TokenBalance>;
  /** Access to subgraph metadata */
  base_fame_nft__meta?: Maybe<_Meta_>;
};


export type SubscriptionapprovalArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionapprovalsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Approval_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Approval_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionapprovalForAllArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionapprovalForAllsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<ApprovalForAll_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ApprovalForAll_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionbatchMetadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionbatchMetadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<BatchMetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<BatchMetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionmetadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionmetadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<MetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<MetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptiontransferArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptiontransfersArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Transfer_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Transfer_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionownershipArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionownershipsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Ownership_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Ownership_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscription_metaArgs = {
  block?: InputMaybe<Block_height>;
};


export type Subscriptionsepolia_approvalArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_approvalsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Approval_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Approval_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_approvalForAllArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_approvalForAllsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<ApprovalForAll_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ApprovalForAll_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_batchMetadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_batchMetadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<BatchMetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<BatchMetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_metadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_metadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<MetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<MetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_transferArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_transfersArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Transfer_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Transfer_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_ownershipArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia_ownershipsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Ownership_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Ownership_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionsepolia__metaArgs = {
  block?: InputMaybe<Block_height>;
};


export type Subscriptionbase_fame_nft_approvalArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_approvalsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Approval_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Approval_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_tokenApprovalArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_tokenApprovalsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenApproval_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<TokenApproval_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_approvalForAllArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_approvalForAllsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<ApprovalForAll_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ApprovalForAll_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_batchMetadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_batchMetadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<BatchMetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<BatchMetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_metadataUpdateArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_metadataUpdatesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<MetadataUpdate_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<MetadataUpdate_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_transferArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_transfersArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Transfer_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Transfer_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_tokenTransferArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_tokenTransfersArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenTransfer_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<TokenTransfer_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_ownershipArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_ownershipsArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Ownership_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Ownership_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_tokenBalanceArgs = {
  id: Scalars['ID'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft_tokenBalancesArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenBalance_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<TokenBalance_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscriptionbase_fame_nft__metaArgs = {
  block?: InputMaybe<Block_height>;
};

export type Aggregation_interval =
  | 'hour'
  | 'day';

export type Approval = {
  id: Scalars['Bytes'];
  owner: Scalars['Bytes'];
  spender: Scalars['Bytes'];
  FameLadySociety_id: Scalars['BigInt'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
  contract: Scalars['Bytes'];
};

export type ApprovalForAll = {
  id: Scalars['Bytes'];
  owner: Scalars['Bytes'];
  operator: Scalars['Bytes'];
  approved: Scalars['Boolean'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
  contract: Scalars['Bytes'];
};

export type ApprovalForAll_filter = {
  id?: InputMaybe<Scalars['Bytes']>;
  id_not?: InputMaybe<Scalars['Bytes']>;
  id_gt?: InputMaybe<Scalars['Bytes']>;
  id_lt?: InputMaybe<Scalars['Bytes']>;
  id_gte?: InputMaybe<Scalars['Bytes']>;
  id_lte?: InputMaybe<Scalars['Bytes']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_contains?: InputMaybe<Scalars['Bytes']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  operator?: InputMaybe<Scalars['Bytes']>;
  operator_not?: InputMaybe<Scalars['Bytes']>;
  operator_gt?: InputMaybe<Scalars['Bytes']>;
  operator_lt?: InputMaybe<Scalars['Bytes']>;
  operator_gte?: InputMaybe<Scalars['Bytes']>;
  operator_lte?: InputMaybe<Scalars['Bytes']>;
  operator_in?: InputMaybe<Array<Scalars['Bytes']>>;
  operator_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  operator_contains?: InputMaybe<Scalars['Bytes']>;
  operator_not_contains?: InputMaybe<Scalars['Bytes']>;
  approved?: InputMaybe<Scalars['Boolean']>;
  approved_not?: InputMaybe<Scalars['Boolean']>;
  approved_in?: InputMaybe<Array<Scalars['Boolean']>>;
  approved_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<ApprovalForAll_filter>>>;
  or?: InputMaybe<Array<InputMaybe<ApprovalForAll_filter>>>;
  contract?: InputMaybe<Scalars['Bytes']>;
  contract_not?: InputMaybe<Scalars['Bytes']>;
  contract_gt?: InputMaybe<Scalars['Bytes']>;
  contract_lt?: InputMaybe<Scalars['Bytes']>;
  contract_gte?: InputMaybe<Scalars['Bytes']>;
  contract_lte?: InputMaybe<Scalars['Bytes']>;
  contract_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_contains?: InputMaybe<Scalars['Bytes']>;
  contract_not_contains?: InputMaybe<Scalars['Bytes']>;
};

export type ApprovalForAll_orderBy =
  | 'id'
  | 'owner'
  | 'operator'
  | 'approved'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash'
  | 'contract';

export type Approval_filter = {
  id?: InputMaybe<Scalars['Bytes']>;
  id_not?: InputMaybe<Scalars['Bytes']>;
  id_gt?: InputMaybe<Scalars['Bytes']>;
  id_lt?: InputMaybe<Scalars['Bytes']>;
  id_gte?: InputMaybe<Scalars['Bytes']>;
  id_lte?: InputMaybe<Scalars['Bytes']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_contains?: InputMaybe<Scalars['Bytes']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  spender?: InputMaybe<Scalars['Bytes']>;
  spender_not?: InputMaybe<Scalars['Bytes']>;
  spender_gt?: InputMaybe<Scalars['Bytes']>;
  spender_lt?: InputMaybe<Scalars['Bytes']>;
  spender_gte?: InputMaybe<Scalars['Bytes']>;
  spender_lte?: InputMaybe<Scalars['Bytes']>;
  spender_in?: InputMaybe<Array<Scalars['Bytes']>>;
  spender_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  spender_contains?: InputMaybe<Scalars['Bytes']>;
  spender_not_contains?: InputMaybe<Scalars['Bytes']>;
  FameLadySociety_id?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_not?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_gt?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_lt?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_gte?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_lte?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_in?: InputMaybe<Array<Scalars['BigInt']>>;
  FameLadySociety_id_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Approval_filter>>>;
  or?: InputMaybe<Array<InputMaybe<Approval_filter>>>;
  contract?: InputMaybe<Scalars['Bytes']>;
  contract_not?: InputMaybe<Scalars['Bytes']>;
  contract_gt?: InputMaybe<Scalars['Bytes']>;
  contract_lt?: InputMaybe<Scalars['Bytes']>;
  contract_gte?: InputMaybe<Scalars['Bytes']>;
  contract_lte?: InputMaybe<Scalars['Bytes']>;
  contract_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_contains?: InputMaybe<Scalars['Bytes']>;
  contract_not_contains?: InputMaybe<Scalars['Bytes']>;
};

export type Approval_orderBy =
  | 'id'
  | 'owner'
  | 'spender'
  | 'FameLadySociety_id'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash'
  | 'contract';

export type BatchMetadataUpdate = {
  id: Scalars['Bytes'];
  _fromTokenId: Scalars['BigInt'];
  _toTokenId: Scalars['BigInt'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
  contract: Scalars['Bytes'];
};

export type BatchMetadataUpdate_filter = {
  id?: InputMaybe<Scalars['Bytes']>;
  id_not?: InputMaybe<Scalars['Bytes']>;
  id_gt?: InputMaybe<Scalars['Bytes']>;
  id_lt?: InputMaybe<Scalars['Bytes']>;
  id_gte?: InputMaybe<Scalars['Bytes']>;
  id_lte?: InputMaybe<Scalars['Bytes']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_contains?: InputMaybe<Scalars['Bytes']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']>;
  _fromTokenId?: InputMaybe<Scalars['BigInt']>;
  _fromTokenId_not?: InputMaybe<Scalars['BigInt']>;
  _fromTokenId_gt?: InputMaybe<Scalars['BigInt']>;
  _fromTokenId_lt?: InputMaybe<Scalars['BigInt']>;
  _fromTokenId_gte?: InputMaybe<Scalars['BigInt']>;
  _fromTokenId_lte?: InputMaybe<Scalars['BigInt']>;
  _fromTokenId_in?: InputMaybe<Array<Scalars['BigInt']>>;
  _fromTokenId_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  _toTokenId?: InputMaybe<Scalars['BigInt']>;
  _toTokenId_not?: InputMaybe<Scalars['BigInt']>;
  _toTokenId_gt?: InputMaybe<Scalars['BigInt']>;
  _toTokenId_lt?: InputMaybe<Scalars['BigInt']>;
  _toTokenId_gte?: InputMaybe<Scalars['BigInt']>;
  _toTokenId_lte?: InputMaybe<Scalars['BigInt']>;
  _toTokenId_in?: InputMaybe<Array<Scalars['BigInt']>>;
  _toTokenId_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<BatchMetadataUpdate_filter>>>;
  or?: InputMaybe<Array<InputMaybe<BatchMetadataUpdate_filter>>>;
  contract?: InputMaybe<Scalars['Bytes']>;
  contract_not?: InputMaybe<Scalars['Bytes']>;
  contract_gt?: InputMaybe<Scalars['Bytes']>;
  contract_lt?: InputMaybe<Scalars['Bytes']>;
  contract_gte?: InputMaybe<Scalars['Bytes']>;
  contract_lte?: InputMaybe<Scalars['Bytes']>;
  contract_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_contains?: InputMaybe<Scalars['Bytes']>;
  contract_not_contains?: InputMaybe<Scalars['Bytes']>;
};

export type BatchMetadataUpdate_orderBy =
  | 'id'
  | '_fromTokenId'
  | '_toTokenId'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash'
  | 'contract';

export type BlockChangedFilter = {
  number_gte: Scalars['Int'];
};

export type Block_height = {
  hash?: InputMaybe<Scalars['Bytes']>;
  number?: InputMaybe<Scalars['Int']>;
  number_gte?: InputMaybe<Scalars['Int']>;
};

export type MetadataUpdate = {
  id: Scalars['Bytes'];
  _tokenId: Scalars['BigInt'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
  contract: Scalars['Bytes'];
};

export type MetadataUpdate_filter = {
  id?: InputMaybe<Scalars['Bytes']>;
  id_not?: InputMaybe<Scalars['Bytes']>;
  id_gt?: InputMaybe<Scalars['Bytes']>;
  id_lt?: InputMaybe<Scalars['Bytes']>;
  id_gte?: InputMaybe<Scalars['Bytes']>;
  id_lte?: InputMaybe<Scalars['Bytes']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_contains?: InputMaybe<Scalars['Bytes']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']>;
  _tokenId?: InputMaybe<Scalars['BigInt']>;
  _tokenId_not?: InputMaybe<Scalars['BigInt']>;
  _tokenId_gt?: InputMaybe<Scalars['BigInt']>;
  _tokenId_lt?: InputMaybe<Scalars['BigInt']>;
  _tokenId_gte?: InputMaybe<Scalars['BigInt']>;
  _tokenId_lte?: InputMaybe<Scalars['BigInt']>;
  _tokenId_in?: InputMaybe<Array<Scalars['BigInt']>>;
  _tokenId_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<MetadataUpdate_filter>>>;
  or?: InputMaybe<Array<InputMaybe<MetadataUpdate_filter>>>;
  contract?: InputMaybe<Scalars['Bytes']>;
  contract_not?: InputMaybe<Scalars['Bytes']>;
  contract_gt?: InputMaybe<Scalars['Bytes']>;
  contract_lt?: InputMaybe<Scalars['Bytes']>;
  contract_gte?: InputMaybe<Scalars['Bytes']>;
  contract_lte?: InputMaybe<Scalars['Bytes']>;
  contract_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_contains?: InputMaybe<Scalars['Bytes']>;
  contract_not_contains?: InputMaybe<Scalars['Bytes']>;
};

export type MetadataUpdate_orderBy =
  | 'id'
  | '_tokenId'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash'
  | 'contract';

/** Defines the order direction, either ascending or descending */
export type OrderDirection =
  | 'asc'
  | 'desc';

export type Ownership = {
  id: Scalars['ID'];
  owner?: Maybe<Scalars['Bytes']>;
  tokenId?: Maybe<Scalars['BigInt']>;
  contract: Scalars['Bytes'];
};

export type Ownership_filter = {
  id?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  tokenId?: InputMaybe<Scalars['BigInt']>;
  tokenId_not?: InputMaybe<Scalars['BigInt']>;
  tokenId_gt?: InputMaybe<Scalars['BigInt']>;
  tokenId_lt?: InputMaybe<Scalars['BigInt']>;
  tokenId_gte?: InputMaybe<Scalars['BigInt']>;
  tokenId_lte?: InputMaybe<Scalars['BigInt']>;
  tokenId_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tokenId_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Ownership_filter>>>;
  or?: InputMaybe<Array<InputMaybe<Ownership_filter>>>;
  contract?: InputMaybe<Scalars['Bytes']>;
  contract_not?: InputMaybe<Scalars['Bytes']>;
  contract_gt?: InputMaybe<Scalars['Bytes']>;
  contract_lt?: InputMaybe<Scalars['Bytes']>;
  contract_gte?: InputMaybe<Scalars['Bytes']>;
  contract_lte?: InputMaybe<Scalars['Bytes']>;
  contract_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_contains?: InputMaybe<Scalars['Bytes']>;
  contract_not_contains?: InputMaybe<Scalars['Bytes']>;
};

export type Ownership_orderBy =
  | 'id'
  | 'owner'
  | 'tokenId'
  | 'contract';

export type Transfer = {
  id: Scalars['Bytes'];
  from: Scalars['Bytes'];
  to: Scalars['Bytes'];
  FameLadySociety_id: Scalars['BigInt'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
  contract: Scalars['Bytes'];
};

export type Transfer_filter = {
  id?: InputMaybe<Scalars['Bytes']>;
  id_not?: InputMaybe<Scalars['Bytes']>;
  id_gt?: InputMaybe<Scalars['Bytes']>;
  id_lt?: InputMaybe<Scalars['Bytes']>;
  id_gte?: InputMaybe<Scalars['Bytes']>;
  id_lte?: InputMaybe<Scalars['Bytes']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_contains?: InputMaybe<Scalars['Bytes']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']>;
  from?: InputMaybe<Scalars['Bytes']>;
  from_not?: InputMaybe<Scalars['Bytes']>;
  from_gt?: InputMaybe<Scalars['Bytes']>;
  from_lt?: InputMaybe<Scalars['Bytes']>;
  from_gte?: InputMaybe<Scalars['Bytes']>;
  from_lte?: InputMaybe<Scalars['Bytes']>;
  from_in?: InputMaybe<Array<Scalars['Bytes']>>;
  from_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  from_contains?: InputMaybe<Scalars['Bytes']>;
  from_not_contains?: InputMaybe<Scalars['Bytes']>;
  to?: InputMaybe<Scalars['Bytes']>;
  to_not?: InputMaybe<Scalars['Bytes']>;
  to_gt?: InputMaybe<Scalars['Bytes']>;
  to_lt?: InputMaybe<Scalars['Bytes']>;
  to_gte?: InputMaybe<Scalars['Bytes']>;
  to_lte?: InputMaybe<Scalars['Bytes']>;
  to_in?: InputMaybe<Array<Scalars['Bytes']>>;
  to_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  to_contains?: InputMaybe<Scalars['Bytes']>;
  to_not_contains?: InputMaybe<Scalars['Bytes']>;
  FameLadySociety_id?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_not?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_gt?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_lt?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_gte?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_lte?: InputMaybe<Scalars['BigInt']>;
  FameLadySociety_id_in?: InputMaybe<Array<Scalars['BigInt']>>;
  FameLadySociety_id_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Transfer_filter>>>;
  or?: InputMaybe<Array<InputMaybe<Transfer_filter>>>;
  contract?: InputMaybe<Scalars['Bytes']>;
  contract_not?: InputMaybe<Scalars['Bytes']>;
  contract_gt?: InputMaybe<Scalars['Bytes']>;
  contract_lt?: InputMaybe<Scalars['Bytes']>;
  contract_gte?: InputMaybe<Scalars['Bytes']>;
  contract_lte?: InputMaybe<Scalars['Bytes']>;
  contract_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_contains?: InputMaybe<Scalars['Bytes']>;
  contract_not_contains?: InputMaybe<Scalars['Bytes']>;
};

export type Transfer_orderBy =
  | 'id'
  | 'from'
  | 'to'
  | 'FameLadySociety_id'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash'
  | 'contract';

export type _Block_ = {
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']>;
  /** The block number */
  number: Scalars['Int'];
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars['Int']>;
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars['Bytes']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean'];
};

export type _SubgraphErrorPolicy_ =
  /** Data will be returned even if the subgraph has indexing errors */
  | 'allow'
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  | 'deny';

export type TokenApproval = {
  id: Scalars['Bytes'];
  owner: Scalars['Bytes'];
  spender: Scalars['Bytes'];
  amount: Scalars['BigInt'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
  contract: Scalars['Bytes'];
};

export type TokenApproval_filter = {
  id?: InputMaybe<Scalars['Bytes']>;
  id_not?: InputMaybe<Scalars['Bytes']>;
  id_gt?: InputMaybe<Scalars['Bytes']>;
  id_lt?: InputMaybe<Scalars['Bytes']>;
  id_gte?: InputMaybe<Scalars['Bytes']>;
  id_lte?: InputMaybe<Scalars['Bytes']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_contains?: InputMaybe<Scalars['Bytes']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  spender?: InputMaybe<Scalars['Bytes']>;
  spender_not?: InputMaybe<Scalars['Bytes']>;
  spender_gt?: InputMaybe<Scalars['Bytes']>;
  spender_lt?: InputMaybe<Scalars['Bytes']>;
  spender_gte?: InputMaybe<Scalars['Bytes']>;
  spender_lte?: InputMaybe<Scalars['Bytes']>;
  spender_in?: InputMaybe<Array<Scalars['Bytes']>>;
  spender_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  spender_contains?: InputMaybe<Scalars['Bytes']>;
  spender_not_contains?: InputMaybe<Scalars['Bytes']>;
  amount?: InputMaybe<Scalars['BigInt']>;
  amount_not?: InputMaybe<Scalars['BigInt']>;
  amount_gt?: InputMaybe<Scalars['BigInt']>;
  amount_lt?: InputMaybe<Scalars['BigInt']>;
  amount_gte?: InputMaybe<Scalars['BigInt']>;
  amount_lte?: InputMaybe<Scalars['BigInt']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
  contract?: InputMaybe<Scalars['Bytes']>;
  contract_not?: InputMaybe<Scalars['Bytes']>;
  contract_gt?: InputMaybe<Scalars['Bytes']>;
  contract_lt?: InputMaybe<Scalars['Bytes']>;
  contract_gte?: InputMaybe<Scalars['Bytes']>;
  contract_lte?: InputMaybe<Scalars['Bytes']>;
  contract_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_contains?: InputMaybe<Scalars['Bytes']>;
  contract_not_contains?: InputMaybe<Scalars['Bytes']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TokenApproval_filter>>>;
  or?: InputMaybe<Array<InputMaybe<TokenApproval_filter>>>;
};

export type TokenApproval_orderBy =
  | 'id'
  | 'owner'
  | 'spender'
  | 'amount'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash'
  | 'contract';

export type TokenBalance = {
  id: Scalars['ID'];
  owner?: Maybe<Scalars['Bytes']>;
  amount?: Maybe<Scalars['BigInt']>;
  contract: Scalars['Bytes'];
};

export type TokenBalance_filter = {
  id?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  amount?: InputMaybe<Scalars['BigInt']>;
  amount_not?: InputMaybe<Scalars['BigInt']>;
  amount_gt?: InputMaybe<Scalars['BigInt']>;
  amount_lt?: InputMaybe<Scalars['BigInt']>;
  amount_gte?: InputMaybe<Scalars['BigInt']>;
  amount_lte?: InputMaybe<Scalars['BigInt']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  contract?: InputMaybe<Scalars['Bytes']>;
  contract_not?: InputMaybe<Scalars['Bytes']>;
  contract_gt?: InputMaybe<Scalars['Bytes']>;
  contract_lt?: InputMaybe<Scalars['Bytes']>;
  contract_gte?: InputMaybe<Scalars['Bytes']>;
  contract_lte?: InputMaybe<Scalars['Bytes']>;
  contract_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_contains?: InputMaybe<Scalars['Bytes']>;
  contract_not_contains?: InputMaybe<Scalars['Bytes']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TokenBalance_filter>>>;
  or?: InputMaybe<Array<InputMaybe<TokenBalance_filter>>>;
};

export type TokenBalance_orderBy =
  | 'id'
  | 'owner'
  | 'amount'
  | 'contract';

export type TokenTransfer = {
  id: Scalars['Bytes'];
  from: Scalars['Bytes'];
  to: Scalars['Bytes'];
  amount: Scalars['BigInt'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
  contract: Scalars['Bytes'];
};

export type TokenTransfer_filter = {
  id?: InputMaybe<Scalars['Bytes']>;
  id_not?: InputMaybe<Scalars['Bytes']>;
  id_gt?: InputMaybe<Scalars['Bytes']>;
  id_lt?: InputMaybe<Scalars['Bytes']>;
  id_gte?: InputMaybe<Scalars['Bytes']>;
  id_lte?: InputMaybe<Scalars['Bytes']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_contains?: InputMaybe<Scalars['Bytes']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']>;
  from?: InputMaybe<Scalars['Bytes']>;
  from_not?: InputMaybe<Scalars['Bytes']>;
  from_gt?: InputMaybe<Scalars['Bytes']>;
  from_lt?: InputMaybe<Scalars['Bytes']>;
  from_gte?: InputMaybe<Scalars['Bytes']>;
  from_lte?: InputMaybe<Scalars['Bytes']>;
  from_in?: InputMaybe<Array<Scalars['Bytes']>>;
  from_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  from_contains?: InputMaybe<Scalars['Bytes']>;
  from_not_contains?: InputMaybe<Scalars['Bytes']>;
  to?: InputMaybe<Scalars['Bytes']>;
  to_not?: InputMaybe<Scalars['Bytes']>;
  to_gt?: InputMaybe<Scalars['Bytes']>;
  to_lt?: InputMaybe<Scalars['Bytes']>;
  to_gte?: InputMaybe<Scalars['Bytes']>;
  to_lte?: InputMaybe<Scalars['Bytes']>;
  to_in?: InputMaybe<Array<Scalars['Bytes']>>;
  to_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  to_contains?: InputMaybe<Scalars['Bytes']>;
  to_not_contains?: InputMaybe<Scalars['Bytes']>;
  amount?: InputMaybe<Scalars['BigInt']>;
  amount_not?: InputMaybe<Scalars['BigInt']>;
  amount_gt?: InputMaybe<Scalars['BigInt']>;
  amount_lt?: InputMaybe<Scalars['BigInt']>;
  amount_gte?: InputMaybe<Scalars['BigInt']>;
  amount_lte?: InputMaybe<Scalars['BigInt']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
  contract?: InputMaybe<Scalars['Bytes']>;
  contract_not?: InputMaybe<Scalars['Bytes']>;
  contract_gt?: InputMaybe<Scalars['Bytes']>;
  contract_lt?: InputMaybe<Scalars['Bytes']>;
  contract_gte?: InputMaybe<Scalars['Bytes']>;
  contract_lte?: InputMaybe<Scalars['Bytes']>;
  contract_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  contract_contains?: InputMaybe<Scalars['Bytes']>;
  contract_not_contains?: InputMaybe<Scalars['Bytes']>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TokenTransfer_filter>>>;
  or?: InputMaybe<Array<InputMaybe<TokenTransfer_filter>>>;
};

export type TokenTransfer_orderBy =
  | 'id'
  | 'from'
  | 'to'
  | 'amount'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash'
  | 'contract';

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string | ((fieldNode: FieldNode) => SelectionSetNode);
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Query: ResolverTypeWrapper<{}>;
  Subscription: ResolverTypeWrapper<{}>;
  Aggregation_interval: Aggregation_interval;
  Approval: ResolverTypeWrapper<Approval>;
  ApprovalForAll: ResolverTypeWrapper<ApprovalForAll>;
  ApprovalForAll_filter: ApprovalForAll_filter;
  ApprovalForAll_orderBy: ApprovalForAll_orderBy;
  Approval_filter: Approval_filter;
  Approval_orderBy: Approval_orderBy;
  BatchMetadataUpdate: ResolverTypeWrapper<BatchMetadataUpdate>;
  BatchMetadataUpdate_filter: BatchMetadataUpdate_filter;
  BatchMetadataUpdate_orderBy: BatchMetadataUpdate_orderBy;
  BigDecimal: ResolverTypeWrapper<Scalars['BigDecimal']>;
  BigInt: ResolverTypeWrapper<Scalars['BigInt']>;
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_height;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Bytes: ResolverTypeWrapper<Scalars['Bytes']>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Int8: ResolverTypeWrapper<Scalars['Int8']>;
  MetadataUpdate: ResolverTypeWrapper<MetadataUpdate>;
  MetadataUpdate_filter: MetadataUpdate_filter;
  MetadataUpdate_orderBy: MetadataUpdate_orderBy;
  OrderDirection: OrderDirection;
  Ownership: ResolverTypeWrapper<Ownership>;
  Ownership_filter: Ownership_filter;
  Ownership_orderBy: Ownership_orderBy;
  String: ResolverTypeWrapper<Scalars['String']>;
  Timestamp: ResolverTypeWrapper<Scalars['Timestamp']>;
  Transfer: ResolverTypeWrapper<Transfer>;
  Transfer_filter: Transfer_filter;
  Transfer_orderBy: Transfer_orderBy;
  _Block_: ResolverTypeWrapper<_Block_>;
  _Meta_: ResolverTypeWrapper<_Meta_>;
  _SubgraphErrorPolicy_: _SubgraphErrorPolicy_;
  TokenApproval: ResolverTypeWrapper<TokenApproval>;
  TokenApproval_filter: TokenApproval_filter;
  TokenApproval_orderBy: TokenApproval_orderBy;
  TokenBalance: ResolverTypeWrapper<TokenBalance>;
  TokenBalance_filter: TokenBalance_filter;
  TokenBalance_orderBy: TokenBalance_orderBy;
  TokenTransfer: ResolverTypeWrapper<TokenTransfer>;
  TokenTransfer_filter: TokenTransfer_filter;
  TokenTransfer_orderBy: TokenTransfer_orderBy;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Query: {};
  Subscription: {};
  Approval: Approval;
  ApprovalForAll: ApprovalForAll;
  ApprovalForAll_filter: ApprovalForAll_filter;
  Approval_filter: Approval_filter;
  BatchMetadataUpdate: BatchMetadataUpdate;
  BatchMetadataUpdate_filter: BatchMetadataUpdate_filter;
  BigDecimal: Scalars['BigDecimal'];
  BigInt: Scalars['BigInt'];
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_height;
  Boolean: Scalars['Boolean'];
  Bytes: Scalars['Bytes'];
  Float: Scalars['Float'];
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  Int8: Scalars['Int8'];
  MetadataUpdate: MetadataUpdate;
  MetadataUpdate_filter: MetadataUpdate_filter;
  Ownership: Ownership;
  Ownership_filter: Ownership_filter;
  String: Scalars['String'];
  Timestamp: Scalars['Timestamp'];
  Transfer: Transfer;
  Transfer_filter: Transfer_filter;
  _Block_: _Block_;
  _Meta_: _Meta_;
  TokenApproval: TokenApproval;
  TokenApproval_filter: TokenApproval_filter;
  TokenBalance: TokenBalance;
  TokenBalance_filter: TokenBalance_filter;
  TokenTransfer: TokenTransfer;
  TokenTransfer_filter: TokenTransfer_filter;
}>;

export type entityDirectiveArgs = { };

export type entityDirectiveResolver<Result, Parent, ContextType = MeshContext, Args = entityDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type subgraphIdDirectiveArgs = {
  id: Scalars['String'];
};

export type subgraphIdDirectiveResolver<Result, Parent, ContextType = MeshContext, Args = subgraphIdDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type derivedFromDirectiveArgs = {
  field: Scalars['String'];
};

export type derivedFromDirectiveResolver<Result, Parent, ContextType = MeshContext, Args = derivedFromDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type QueryResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  approval?: Resolver<Maybe<ResolversTypes['Approval']>, ParentType, ContextType, RequireFields<QueryapprovalArgs, 'id' | 'subgraphError'>>;
  approvals?: Resolver<Array<ResolversTypes['Approval']>, ParentType, ContextType, RequireFields<QueryapprovalsArgs, 'skip' | 'first' | 'subgraphError'>>;
  approvalForAll?: Resolver<Maybe<ResolversTypes['ApprovalForAll']>, ParentType, ContextType, RequireFields<QueryapprovalForAllArgs, 'id' | 'subgraphError'>>;
  approvalForAlls?: Resolver<Array<ResolversTypes['ApprovalForAll']>, ParentType, ContextType, RequireFields<QueryapprovalForAllsArgs, 'skip' | 'first' | 'subgraphError'>>;
  batchMetadataUpdate?: Resolver<Maybe<ResolversTypes['BatchMetadataUpdate']>, ParentType, ContextType, RequireFields<QuerybatchMetadataUpdateArgs, 'id' | 'subgraphError'>>;
  batchMetadataUpdates?: Resolver<Array<ResolversTypes['BatchMetadataUpdate']>, ParentType, ContextType, RequireFields<QuerybatchMetadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  metadataUpdate?: Resolver<Maybe<ResolversTypes['MetadataUpdate']>, ParentType, ContextType, RequireFields<QuerymetadataUpdateArgs, 'id' | 'subgraphError'>>;
  metadataUpdates?: Resolver<Array<ResolversTypes['MetadataUpdate']>, ParentType, ContextType, RequireFields<QuerymetadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  transfer?: Resolver<Maybe<ResolversTypes['Transfer']>, ParentType, ContextType, RequireFields<QuerytransferArgs, 'id' | 'subgraphError'>>;
  transfers?: Resolver<Array<ResolversTypes['Transfer']>, ParentType, ContextType, RequireFields<QuerytransfersArgs, 'skip' | 'first' | 'subgraphError'>>;
  ownership?: Resolver<Maybe<ResolversTypes['Ownership']>, ParentType, ContextType, RequireFields<QueryownershipArgs, 'id' | 'subgraphError'>>;
  ownerships?: Resolver<Array<ResolversTypes['Ownership']>, ParentType, ContextType, RequireFields<QueryownershipsArgs, 'skip' | 'first' | 'subgraphError'>>;
  _meta?: Resolver<Maybe<ResolversTypes['_Meta_']>, ParentType, ContextType, Partial<Query_metaArgs>>;
  sepolia_approval?: Resolver<Maybe<ResolversTypes['Approval']>, ParentType, ContextType, RequireFields<Querysepolia_approvalArgs, 'id' | 'subgraphError'>>;
  sepolia_approvals?: Resolver<Array<ResolversTypes['Approval']>, ParentType, ContextType, RequireFields<Querysepolia_approvalsArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_approvalForAll?: Resolver<Maybe<ResolversTypes['ApprovalForAll']>, ParentType, ContextType, RequireFields<Querysepolia_approvalForAllArgs, 'id' | 'subgraphError'>>;
  sepolia_approvalForAlls?: Resolver<Array<ResolversTypes['ApprovalForAll']>, ParentType, ContextType, RequireFields<Querysepolia_approvalForAllsArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_batchMetadataUpdate?: Resolver<Maybe<ResolversTypes['BatchMetadataUpdate']>, ParentType, ContextType, RequireFields<Querysepolia_batchMetadataUpdateArgs, 'id' | 'subgraphError'>>;
  sepolia_batchMetadataUpdates?: Resolver<Array<ResolversTypes['BatchMetadataUpdate']>, ParentType, ContextType, RequireFields<Querysepolia_batchMetadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_metadataUpdate?: Resolver<Maybe<ResolversTypes['MetadataUpdate']>, ParentType, ContextType, RequireFields<Querysepolia_metadataUpdateArgs, 'id' | 'subgraphError'>>;
  sepolia_metadataUpdates?: Resolver<Array<ResolversTypes['MetadataUpdate']>, ParentType, ContextType, RequireFields<Querysepolia_metadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_transfer?: Resolver<Maybe<ResolversTypes['Transfer']>, ParentType, ContextType, RequireFields<Querysepolia_transferArgs, 'id' | 'subgraphError'>>;
  sepolia_transfers?: Resolver<Array<ResolversTypes['Transfer']>, ParentType, ContextType, RequireFields<Querysepolia_transfersArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_ownership?: Resolver<Maybe<ResolversTypes['Ownership']>, ParentType, ContextType, RequireFields<Querysepolia_ownershipArgs, 'id' | 'subgraphError'>>;
  sepolia_ownerships?: Resolver<Array<ResolversTypes['Ownership']>, ParentType, ContextType, RequireFields<Querysepolia_ownershipsArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia__meta?: Resolver<Maybe<ResolversTypes['_Meta_']>, ParentType, ContextType, Partial<Querysepolia__metaArgs>>;
  base_fame_nft_approval?: Resolver<Maybe<ResolversTypes['Approval']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_approvalArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_approvals?: Resolver<Array<ResolversTypes['Approval']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_approvalsArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_tokenApproval?: Resolver<Maybe<ResolversTypes['TokenApproval']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_tokenApprovalArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_tokenApprovals?: Resolver<Array<ResolversTypes['TokenApproval']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_tokenApprovalsArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_approvalForAll?: Resolver<Maybe<ResolversTypes['ApprovalForAll']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_approvalForAllArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_approvalForAlls?: Resolver<Array<ResolversTypes['ApprovalForAll']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_approvalForAllsArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_batchMetadataUpdate?: Resolver<Maybe<ResolversTypes['BatchMetadataUpdate']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_batchMetadataUpdateArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_batchMetadataUpdates?: Resolver<Array<ResolversTypes['BatchMetadataUpdate']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_batchMetadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_metadataUpdate?: Resolver<Maybe<ResolversTypes['MetadataUpdate']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_metadataUpdateArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_metadataUpdates?: Resolver<Array<ResolversTypes['MetadataUpdate']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_metadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_transfer?: Resolver<Maybe<ResolversTypes['Transfer']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_transferArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_transfers?: Resolver<Array<ResolversTypes['Transfer']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_transfersArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_tokenTransfer?: Resolver<Maybe<ResolversTypes['TokenTransfer']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_tokenTransferArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_tokenTransfers?: Resolver<Array<ResolversTypes['TokenTransfer']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_tokenTransfersArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_ownership?: Resolver<Maybe<ResolversTypes['Ownership']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_ownershipArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_ownerships?: Resolver<Array<ResolversTypes['Ownership']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_ownershipsArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_tokenBalance?: Resolver<Maybe<ResolversTypes['TokenBalance']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_tokenBalanceArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_tokenBalances?: Resolver<Array<ResolversTypes['TokenBalance']>, ParentType, ContextType, RequireFields<Querybase_fame_nft_tokenBalancesArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft__meta?: Resolver<Maybe<ResolversTypes['_Meta_']>, ParentType, ContextType, Partial<Querybase_fame_nft__metaArgs>>;
}>;

export type SubscriptionResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  approval?: SubscriptionResolver<Maybe<ResolversTypes['Approval']>, "approval", ParentType, ContextType, RequireFields<SubscriptionapprovalArgs, 'id' | 'subgraphError'>>;
  approvals?: SubscriptionResolver<Array<ResolversTypes['Approval']>, "approvals", ParentType, ContextType, RequireFields<SubscriptionapprovalsArgs, 'skip' | 'first' | 'subgraphError'>>;
  approvalForAll?: SubscriptionResolver<Maybe<ResolversTypes['ApprovalForAll']>, "approvalForAll", ParentType, ContextType, RequireFields<SubscriptionapprovalForAllArgs, 'id' | 'subgraphError'>>;
  approvalForAlls?: SubscriptionResolver<Array<ResolversTypes['ApprovalForAll']>, "approvalForAlls", ParentType, ContextType, RequireFields<SubscriptionapprovalForAllsArgs, 'skip' | 'first' | 'subgraphError'>>;
  batchMetadataUpdate?: SubscriptionResolver<Maybe<ResolversTypes['BatchMetadataUpdate']>, "batchMetadataUpdate", ParentType, ContextType, RequireFields<SubscriptionbatchMetadataUpdateArgs, 'id' | 'subgraphError'>>;
  batchMetadataUpdates?: SubscriptionResolver<Array<ResolversTypes['BatchMetadataUpdate']>, "batchMetadataUpdates", ParentType, ContextType, RequireFields<SubscriptionbatchMetadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  metadataUpdate?: SubscriptionResolver<Maybe<ResolversTypes['MetadataUpdate']>, "metadataUpdate", ParentType, ContextType, RequireFields<SubscriptionmetadataUpdateArgs, 'id' | 'subgraphError'>>;
  metadataUpdates?: SubscriptionResolver<Array<ResolversTypes['MetadataUpdate']>, "metadataUpdates", ParentType, ContextType, RequireFields<SubscriptionmetadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  transfer?: SubscriptionResolver<Maybe<ResolversTypes['Transfer']>, "transfer", ParentType, ContextType, RequireFields<SubscriptiontransferArgs, 'id' | 'subgraphError'>>;
  transfers?: SubscriptionResolver<Array<ResolversTypes['Transfer']>, "transfers", ParentType, ContextType, RequireFields<SubscriptiontransfersArgs, 'skip' | 'first' | 'subgraphError'>>;
  ownership?: SubscriptionResolver<Maybe<ResolversTypes['Ownership']>, "ownership", ParentType, ContextType, RequireFields<SubscriptionownershipArgs, 'id' | 'subgraphError'>>;
  ownerships?: SubscriptionResolver<Array<ResolversTypes['Ownership']>, "ownerships", ParentType, ContextType, RequireFields<SubscriptionownershipsArgs, 'skip' | 'first' | 'subgraphError'>>;
  _meta?: SubscriptionResolver<Maybe<ResolversTypes['_Meta_']>, "_meta", ParentType, ContextType, Partial<Subscription_metaArgs>>;
  sepolia_approval?: SubscriptionResolver<Maybe<ResolversTypes['Approval']>, "sepolia_approval", ParentType, ContextType, RequireFields<Subscriptionsepolia_approvalArgs, 'id' | 'subgraphError'>>;
  sepolia_approvals?: SubscriptionResolver<Array<ResolversTypes['Approval']>, "sepolia_approvals", ParentType, ContextType, RequireFields<Subscriptionsepolia_approvalsArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_approvalForAll?: SubscriptionResolver<Maybe<ResolversTypes['ApprovalForAll']>, "sepolia_approvalForAll", ParentType, ContextType, RequireFields<Subscriptionsepolia_approvalForAllArgs, 'id' | 'subgraphError'>>;
  sepolia_approvalForAlls?: SubscriptionResolver<Array<ResolversTypes['ApprovalForAll']>, "sepolia_approvalForAlls", ParentType, ContextType, RequireFields<Subscriptionsepolia_approvalForAllsArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_batchMetadataUpdate?: SubscriptionResolver<Maybe<ResolversTypes['BatchMetadataUpdate']>, "sepolia_batchMetadataUpdate", ParentType, ContextType, RequireFields<Subscriptionsepolia_batchMetadataUpdateArgs, 'id' | 'subgraphError'>>;
  sepolia_batchMetadataUpdates?: SubscriptionResolver<Array<ResolversTypes['BatchMetadataUpdate']>, "sepolia_batchMetadataUpdates", ParentType, ContextType, RequireFields<Subscriptionsepolia_batchMetadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_metadataUpdate?: SubscriptionResolver<Maybe<ResolversTypes['MetadataUpdate']>, "sepolia_metadataUpdate", ParentType, ContextType, RequireFields<Subscriptionsepolia_metadataUpdateArgs, 'id' | 'subgraphError'>>;
  sepolia_metadataUpdates?: SubscriptionResolver<Array<ResolversTypes['MetadataUpdate']>, "sepolia_metadataUpdates", ParentType, ContextType, RequireFields<Subscriptionsepolia_metadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_transfer?: SubscriptionResolver<Maybe<ResolversTypes['Transfer']>, "sepolia_transfer", ParentType, ContextType, RequireFields<Subscriptionsepolia_transferArgs, 'id' | 'subgraphError'>>;
  sepolia_transfers?: SubscriptionResolver<Array<ResolversTypes['Transfer']>, "sepolia_transfers", ParentType, ContextType, RequireFields<Subscriptionsepolia_transfersArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia_ownership?: SubscriptionResolver<Maybe<ResolversTypes['Ownership']>, "sepolia_ownership", ParentType, ContextType, RequireFields<Subscriptionsepolia_ownershipArgs, 'id' | 'subgraphError'>>;
  sepolia_ownerships?: SubscriptionResolver<Array<ResolversTypes['Ownership']>, "sepolia_ownerships", ParentType, ContextType, RequireFields<Subscriptionsepolia_ownershipsArgs, 'skip' | 'first' | 'subgraphError'>>;
  sepolia__meta?: SubscriptionResolver<Maybe<ResolversTypes['_Meta_']>, "sepolia__meta", ParentType, ContextType, Partial<Subscriptionsepolia__metaArgs>>;
  base_fame_nft_approval?: SubscriptionResolver<Maybe<ResolversTypes['Approval']>, "base_fame_nft_approval", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_approvalArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_approvals?: SubscriptionResolver<Array<ResolversTypes['Approval']>, "base_fame_nft_approvals", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_approvalsArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_tokenApproval?: SubscriptionResolver<Maybe<ResolversTypes['TokenApproval']>, "base_fame_nft_tokenApproval", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_tokenApprovalArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_tokenApprovals?: SubscriptionResolver<Array<ResolversTypes['TokenApproval']>, "base_fame_nft_tokenApprovals", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_tokenApprovalsArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_approvalForAll?: SubscriptionResolver<Maybe<ResolversTypes['ApprovalForAll']>, "base_fame_nft_approvalForAll", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_approvalForAllArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_approvalForAlls?: SubscriptionResolver<Array<ResolversTypes['ApprovalForAll']>, "base_fame_nft_approvalForAlls", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_approvalForAllsArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_batchMetadataUpdate?: SubscriptionResolver<Maybe<ResolversTypes['BatchMetadataUpdate']>, "base_fame_nft_batchMetadataUpdate", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_batchMetadataUpdateArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_batchMetadataUpdates?: SubscriptionResolver<Array<ResolversTypes['BatchMetadataUpdate']>, "base_fame_nft_batchMetadataUpdates", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_batchMetadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_metadataUpdate?: SubscriptionResolver<Maybe<ResolversTypes['MetadataUpdate']>, "base_fame_nft_metadataUpdate", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_metadataUpdateArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_metadataUpdates?: SubscriptionResolver<Array<ResolversTypes['MetadataUpdate']>, "base_fame_nft_metadataUpdates", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_metadataUpdatesArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_transfer?: SubscriptionResolver<Maybe<ResolversTypes['Transfer']>, "base_fame_nft_transfer", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_transferArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_transfers?: SubscriptionResolver<Array<ResolversTypes['Transfer']>, "base_fame_nft_transfers", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_transfersArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_tokenTransfer?: SubscriptionResolver<Maybe<ResolversTypes['TokenTransfer']>, "base_fame_nft_tokenTransfer", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_tokenTransferArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_tokenTransfers?: SubscriptionResolver<Array<ResolversTypes['TokenTransfer']>, "base_fame_nft_tokenTransfers", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_tokenTransfersArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_ownership?: SubscriptionResolver<Maybe<ResolversTypes['Ownership']>, "base_fame_nft_ownership", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_ownershipArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_ownerships?: SubscriptionResolver<Array<ResolversTypes['Ownership']>, "base_fame_nft_ownerships", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_ownershipsArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft_tokenBalance?: SubscriptionResolver<Maybe<ResolversTypes['TokenBalance']>, "base_fame_nft_tokenBalance", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_tokenBalanceArgs, 'id' | 'subgraphError'>>;
  base_fame_nft_tokenBalances?: SubscriptionResolver<Array<ResolversTypes['TokenBalance']>, "base_fame_nft_tokenBalances", ParentType, ContextType, RequireFields<Subscriptionbase_fame_nft_tokenBalancesArgs, 'skip' | 'first' | 'subgraphError'>>;
  base_fame_nft__meta?: SubscriptionResolver<Maybe<ResolversTypes['_Meta_']>, "base_fame_nft__meta", ParentType, ContextType, Partial<Subscriptionbase_fame_nft__metaArgs>>;
}>;

export type ApprovalResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Approval'] = ResolversParentTypes['Approval']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  spender?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  FameLadySociety_id?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transactionHash?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ApprovalForAllResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['ApprovalForAll'] = ResolversParentTypes['ApprovalForAll']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  operator?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  approved?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transactionHash?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BatchMetadataUpdateResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['BatchMetadataUpdate'] = ResolversParentTypes['BatchMetadataUpdate']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  _fromTokenId?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  _toTokenId?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transactionHash?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface BigDecimalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigDecimal'], any> {
  name: 'BigDecimal';
}

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}

export interface BytesScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Bytes'], any> {
  name: 'Bytes';
}

export interface Int8ScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Int8'], any> {
  name: 'Int8';
}

export type MetadataUpdateResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['MetadataUpdate'] = ResolversParentTypes['MetadataUpdate']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  _tokenId?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transactionHash?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OwnershipResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Ownership'] = ResolversParentTypes['Ownership']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  tokenId?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface TimestampScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Timestamp'], any> {
  name: 'Timestamp';
}

export type TransferResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Transfer'] = ResolversParentTypes['Transfer']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  from?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  FameLadySociety_id?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transactionHash?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type _Block_Resolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['_Block_'] = ResolversParentTypes['_Block_']> = ResolversObject<{
  hash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  parentHash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type _Meta_Resolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['_Meta_'] = ResolversParentTypes['_Meta_']> = ResolversObject<{
  block?: Resolver<ResolversTypes['_Block_'], ParentType, ContextType>;
  deployment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasIndexingErrors?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TokenApprovalResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['TokenApproval'] = ResolversParentTypes['TokenApproval']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  spender?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  amount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transactionHash?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TokenBalanceResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['TokenBalance'] = ResolversParentTypes['TokenBalance']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  amount?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TokenTransferResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['TokenTransfer'] = ResolversParentTypes['TokenTransfer']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  from?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  amount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  blockTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transactionHash?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  contract?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = MeshContext> = ResolversObject<{
  Query?: QueryResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Approval?: ApprovalResolvers<ContextType>;
  ApprovalForAll?: ApprovalForAllResolvers<ContextType>;
  BatchMetadataUpdate?: BatchMetadataUpdateResolvers<ContextType>;
  BigDecimal?: GraphQLScalarType;
  BigInt?: GraphQLScalarType;
  Bytes?: GraphQLScalarType;
  Int8?: GraphQLScalarType;
  MetadataUpdate?: MetadataUpdateResolvers<ContextType>;
  Ownership?: OwnershipResolvers<ContextType>;
  Timestamp?: GraphQLScalarType;
  Transfer?: TransferResolvers<ContextType>;
  _Block_?: _Block_Resolvers<ContextType>;
  _Meta_?: _Meta_Resolvers<ContextType>;
  TokenApproval?: TokenApprovalResolvers<ContextType>;
  TokenBalance?: TokenBalanceResolvers<ContextType>;
  TokenTransfer?: TokenTransferResolvers<ContextType>;
}>;

export type DirectiveResolvers<ContextType = MeshContext> = ResolversObject<{
  entity?: entityDirectiveResolver<any, any, ContextType>;
  subgraphId?: subgraphIdDirectiveResolver<any, any, ContextType>;
  derivedFrom?: derivedFromDirectiveResolver<any, any, ContextType>;
}>;

export type MeshContext = FlsMainnetTypes.Context & FlsSepoliaTypes.Context & FameNftBaseTypes.Context & BaseMeshContext;


import { fileURLToPath } from '@graphql-mesh/utils';
const baseDir = pathModule.join(pathModule.dirname(fileURLToPath(import.meta.url)), '..');

const importFn: ImportFn = <T>(moduleId: string) => {
  const relativeModuleId = (pathModule.isAbsolute(moduleId) ? pathModule.relative(baseDir, moduleId) : moduleId).split('\\').join('/').replace(baseDir + '/', '');
  switch(relativeModuleId) {
    case ".graphclient/sources/fls-mainnet/introspectionSchema":
      return Promise.resolve(importedModule$0) as T;
    
    case ".graphclient/sources/fls-sepolia/introspectionSchema":
      return Promise.resolve(importedModule$1) as T;
    
    case ".graphclient/sources/fame-nft-base/introspectionSchema":
      return Promise.resolve(importedModule$2) as T;
    
    default:
      return Promise.reject(new Error(`Cannot find module '${relativeModuleId}'.`));
  }
};

const rootStore = new MeshStore('.graphclient', new FsStoreStorageAdapter({
  cwd: baseDir,
  importFn,
  fileType: "ts",
}), {
  readonly: true,
  validate: false
});

export const rawServeConfig: YamlConfig.Config['serve'] = undefined as any
export async function getMeshOptions(): Promise<GetMeshOptions> {
const pubsub = new PubSub();
const sourcesStore = rootStore.child('sources');
const logger = new DefaultLogger("GraphClient");
const cache = new (MeshCache as any)({
      ...({} as any),
      importFn,
      store: rootStore.child('cache'),
      pubsub,
      logger,
    } as any)

const sources: MeshResolvedSource[] = [];
const transforms: MeshTransform[] = [];
const additionalEnvelopPlugins: MeshPlugin<any>[] = [];
const flsSepoliaTransforms = [];
const flsMainnetTransforms = [];
const fameNftBaseTransforms = [];
const additionalTypeDefs = [] as any[];
const flsSepoliaHandler = new GraphqlHandler({
              name: "fls-sepolia",
              config: {"endpoint":"https://api.studio.thegraph.com/query/67995/fls-sepolia/version/latest"},
              baseDir,
              cache,
              pubsub,
              store: sourcesStore.child("fls-sepolia"),
              logger: logger.child("fls-sepolia"),
              importFn,
            });
const flsMainnetHandler = new GraphqlHandler({
              name: "fls-mainnet",
              config: {"endpoint":"https://api.studio.thegraph.com/query/67995/fls/version/latest"},
              baseDir,
              cache,
              pubsub,
              store: sourcesStore.child("fls-mainnet"),
              logger: logger.child("fls-mainnet"),
              importFn,
            });
const fameNftBaseHandler = new GraphqlHandler({
              name: "fame-nft-base",
              config: {"endpoint":"https://api.studio.thegraph.com/query/67995/fame-nft-base/v0.0.4"},
              baseDir,
              cache,
              pubsub,
              store: sourcesStore.child("fame-nft-base"),
              logger: logger.child("fame-nft-base"),
              importFn,
            });
sources[1] = {
          name: 'fls-mainnet',
          handler: flsMainnetHandler,
          transforms: flsMainnetTransforms
        }
flsSepoliaTransforms[0] = new PrefixTransform({
                  apiName: "fls-sepolia",
                  config: {"value":"sepolia_","includeRootOperations":true,"includeTypes":false},
                  baseDir,
                  cache,
                  pubsub,
                  importFn,
                  logger,
                });
fameNftBaseTransforms[0] = new PrefixTransform({
                  apiName: "fame-nft-base",
                  config: {"value":"base_fame_nft_","includeRootOperations":true,"includeTypes":false},
                  baseDir,
                  cache,
                  pubsub,
                  importFn,
                  logger,
                });
sources[0] = {
          name: 'fls-sepolia',
          handler: flsSepoliaHandler,
          transforms: flsSepoliaTransforms
        }
sources[2] = {
          name: 'fame-nft-base',
          handler: fameNftBaseHandler,
          transforms: fameNftBaseTransforms
        }
const additionalResolvers = [] as any[]
const merger = new(StitchingMerger as any)({
        cache,
        pubsub,
        logger: logger.child('stitchingMerger'),
        store: rootStore.child('stitchingMerger')
      })

  return {
    sources,
    transforms,
    additionalTypeDefs,
    additionalResolvers,
    cache,
    pubsub,
    merger,
    logger,
    additionalEnvelopPlugins,
    get documents() {
      return [
      {
        document: MainnetMintsDocument,
        get rawSDL() {
          return printWithCache(MainnetMintsDocument);
        },
        location: 'MainnetMintsDocument.graphql'
      },{
        document: MainnetOwnersDocument,
        get rawSDL() {
          return printWithCache(MainnetOwnersDocument);
        },
        location: 'MainnetOwnersDocument.graphql'
      },{
        document: SepoliaTokenByOwnerDocument,
        get rawSDL() {
          return printWithCache(SepoliaTokenByOwnerDocument);
        },
        location: 'SepoliaTokenByOwnerDocument.graphql'
      },{
        document: MainnetTokenByOwnerDocument,
        get rawSDL() {
          return printWithCache(MainnetTokenByOwnerDocument);
        },
        location: 'MainnetTokenByOwnerDocument.graphql'
      },{
        document: BaseFameNftTokenByOwnerDocument,
        get rawSDL() {
          return printWithCache(BaseFameNftTokenByOwnerDocument);
        },
        location: 'BaseFameNftTokenByOwnerDocument.graphql'
      },{
        document: MainnetTokenMintedOnDocument,
        get rawSDL() {
          return printWithCache(MainnetTokenMintedOnDocument);
        },
        location: 'MainnetTokenMintedOnDocument.graphql'
      },{
        document: SepoliaTokenMintedOnDocument,
        get rawSDL() {
          return printWithCache(SepoliaTokenMintedOnDocument);
        },
        location: 'SepoliaTokenMintedOnDocument.graphql'
      },{
        document: FamePresaleTokenHoldersDocument,
        get rawSDL() {
          return printWithCache(FamePresaleTokenHoldersDocument);
        },
        location: 'FamePresaleTokenHoldersDocument.graphql'
      }
    ];
    },
    fetchFn,
  };
}

export function createBuiltMeshHTTPHandler<TServerContext = {}>(): MeshHTTPHandler<TServerContext> {
  return createMeshHTTPHandler<TServerContext>({
    baseDir,
    getBuiltMesh: getBuiltGraphClient,
    rawServeConfig: undefined,
  })
}


let meshInstance$: Promise<MeshInstance> | undefined;

export function getBuiltGraphClient(): Promise<MeshInstance> {
  if (meshInstance$ == null) {
    meshInstance$ = getMeshOptions().then(meshOptions => getMesh(meshOptions)).then(mesh => {
      const id = mesh.pubsub.subscribe('destroy', () => {
        meshInstance$ = undefined;
        mesh.pubsub.unsubscribe(id);
      });
      return mesh;
    });
  }
  return meshInstance$;
}

export const execute: ExecuteMeshFn = (...args) => getBuiltGraphClient().then(({ execute }) => execute(...args));

export const subscribe: SubscribeMeshFn = (...args) => getBuiltGraphClient().then(({ subscribe }) => subscribe(...args));
export function getBuiltGraphSDK<TGlobalContext = any, TOperationContext = any>(globalContext?: TGlobalContext) {
  const sdkRequester$ = getBuiltGraphClient().then(({ sdkRequesterFactory }) => sdkRequesterFactory(globalContext));
  return getSdk<TOperationContext, TGlobalContext>((...args) => sdkRequester$.then(sdkRequester => sdkRequester(...args)));
}
export type MainnetMintsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type MainnetMintsQuery = { transfers: Array<Pick<Transfer, 'FameLadySociety_id' | 'blockNumber' | 'blockTimestamp'>> };

export type MainnetOwnersQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
}>;


export type MainnetOwnersQuery = { ownerships: Array<Pick<Ownership, 'tokenId' | 'owner'>> };

export type SepoliaTokenByOwnerQueryVariables = Exact<{
  owner: Scalars['Bytes'];
  first?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type SepoliaTokenByOwnerQuery = { sepolia_ownerships: Array<Pick<Ownership, 'tokenId'>> };

export type MainnetTokenByOwnerQueryVariables = Exact<{
  owner: Scalars['Bytes'];
  first?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type MainnetTokenByOwnerQuery = { ownerships: Array<Pick<Ownership, 'tokenId'>> };

export type BaseFameNftTokenByOwnerQueryVariables = Exact<{
  owner: Scalars['Bytes'];
  first?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type BaseFameNftTokenByOwnerQuery = { base_fame_nft_ownerships: Array<Pick<Ownership, 'tokenId'>> };

export type MainnetTokenMintedOnQueryVariables = Exact<{
  tokenId?: InputMaybe<Scalars['BigInt']>;
  first?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type MainnetTokenMintedOnQuery = { transfers: Array<Pick<Transfer, 'FameLadySociety_id' | 'blockNumber' | 'blockTimestamp'>> };

export type SepoliaTokenMintedOnQueryVariables = Exact<{
  tokenId?: InputMaybe<Scalars['BigInt']>;
  first?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type SepoliaTokenMintedOnQuery = { sepolia_transfers: Array<Pick<Transfer, 'FameLadySociety_id' | 'blockNumber' | 'blockTimestamp'>> };

export type FamePresaleTokenHoldersQueryVariables = Exact<{ [key: string]: never; }>;


export type FamePresaleTokenHoldersQuery = { base_fame_nft_tokenBalances: Array<Pick<TokenBalance, 'owner' | 'amount'>> };


export const MainnetMintsDocument = gql`
    query MainnetMints($first: Int, $skip: Int, $orderDirection: OrderDirection) {
  transfers(
    first: $first
    skip: $skip
    orderDirection: $orderDirection
    where: {from: "0x0000000000000000000000000000000000000000"}
  ) {
    FameLadySociety_id
    blockNumber
    blockTimestamp
  }
}
    ` as unknown as DocumentNode<MainnetMintsQuery, MainnetMintsQueryVariables>;
export const MainnetOwnersDocument = gql`
    query MainnetOwners($first: Int, $skip: Int) {
  ownerships(first: $first, skip: $skip) {
    tokenId
    owner
  }
}
    ` as unknown as DocumentNode<MainnetOwnersQuery, MainnetOwnersQueryVariables>;
export const SepoliaTokenByOwnerDocument = gql`
    query SepoliaTokenByOwner($owner: Bytes!, $first: Int, $skip: Int, $orderDirection: OrderDirection) {
  sepolia_ownerships(
    where: {owner: $owner}
    first: $first
    skip: $skip
    orderDirection: $orderDirection
  ) {
    tokenId
  }
}
    ` as unknown as DocumentNode<SepoliaTokenByOwnerQuery, SepoliaTokenByOwnerQueryVariables>;
export const MainnetTokenByOwnerDocument = gql`
    query MainnetTokenByOwner($owner: Bytes!, $first: Int, $skip: Int, $orderDirection: OrderDirection) {
  ownerships(
    where: {owner: $owner}
    first: $first
    skip: $skip
    orderDirection: $orderDirection
  ) {
    tokenId
  }
}
    ` as unknown as DocumentNode<MainnetTokenByOwnerQuery, MainnetTokenByOwnerQueryVariables>;
export const BaseFameNftTokenByOwnerDocument = gql`
    query BaseFameNftTokenByOwner($owner: Bytes!, $first: Int, $skip: Int, $orderDirection: OrderDirection) {
  base_fame_nft_ownerships(
    where: {owner: $owner}
    first: $first
    skip: $skip
    orderDirection: $orderDirection
  ) {
    tokenId
  }
}
    ` as unknown as DocumentNode<BaseFameNftTokenByOwnerQuery, BaseFameNftTokenByOwnerQueryVariables>;
export const MainnetTokenMintedOnDocument = gql`
    query MainnetTokenMintedOn($tokenId: BigInt, $first: Int, $skip: Int, $orderDirection: OrderDirection) {
  transfers(
    first: $first
    skip: $skip
    orderDirection: $orderDirection
    where: {from: "0x0000000000000000000000000000000000000000", FameLadySociety_id: $tokenId}
  ) {
    FameLadySociety_id
    blockNumber
    blockTimestamp
  }
}
    ` as unknown as DocumentNode<MainnetTokenMintedOnQuery, MainnetTokenMintedOnQueryVariables>;
export const SepoliaTokenMintedOnDocument = gql`
    query SepoliaTokenMintedOn($tokenId: BigInt, $first: Int, $skip: Int, $orderDirection: OrderDirection) {
  sepolia_transfers(
    first: $first
    skip: $skip
    orderDirection: $orderDirection
    where: {from: "0x0000000000000000000000000000000000000000", FameLadySociety_id: $tokenId}
  ) {
    FameLadySociety_id
    blockNumber
    blockTimestamp
  }
}
    ` as unknown as DocumentNode<SepoliaTokenMintedOnQuery, SepoliaTokenMintedOnQueryVariables>;
export const FamePresaleTokenHoldersDocument = gql`
    query FamePresaleTokenHolders {
  base_fame_nft_tokenBalances(
    where: {contract: "0xf09326082a0B360567c72b6FEd67c22Fe2f76B60", owner_not: "0x0000000000000000000000000000000000000000"}
  ) {
    owner
    amount
  }
}
    ` as unknown as DocumentNode<FamePresaleTokenHoldersQuery, FamePresaleTokenHoldersQueryVariables>;









export type Requester<C = {}, E = unknown> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R> | AsyncIterable<R>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    MainnetMints(variables?: MainnetMintsQueryVariables, options?: C): Promise<MainnetMintsQuery> {
      return requester<MainnetMintsQuery, MainnetMintsQueryVariables>(MainnetMintsDocument, variables, options) as Promise<MainnetMintsQuery>;
    },
    MainnetOwners(variables?: MainnetOwnersQueryVariables, options?: C): Promise<MainnetOwnersQuery> {
      return requester<MainnetOwnersQuery, MainnetOwnersQueryVariables>(MainnetOwnersDocument, variables, options) as Promise<MainnetOwnersQuery>;
    },
    SepoliaTokenByOwner(variables: SepoliaTokenByOwnerQueryVariables, options?: C): Promise<SepoliaTokenByOwnerQuery> {
      return requester<SepoliaTokenByOwnerQuery, SepoliaTokenByOwnerQueryVariables>(SepoliaTokenByOwnerDocument, variables, options) as Promise<SepoliaTokenByOwnerQuery>;
    },
    MainnetTokenByOwner(variables: MainnetTokenByOwnerQueryVariables, options?: C): Promise<MainnetTokenByOwnerQuery> {
      return requester<MainnetTokenByOwnerQuery, MainnetTokenByOwnerQueryVariables>(MainnetTokenByOwnerDocument, variables, options) as Promise<MainnetTokenByOwnerQuery>;
    },
    BaseFameNftTokenByOwner(variables: BaseFameNftTokenByOwnerQueryVariables, options?: C): Promise<BaseFameNftTokenByOwnerQuery> {
      return requester<BaseFameNftTokenByOwnerQuery, BaseFameNftTokenByOwnerQueryVariables>(BaseFameNftTokenByOwnerDocument, variables, options) as Promise<BaseFameNftTokenByOwnerQuery>;
    },
    MainnetTokenMintedOn(variables?: MainnetTokenMintedOnQueryVariables, options?: C): Promise<MainnetTokenMintedOnQuery> {
      return requester<MainnetTokenMintedOnQuery, MainnetTokenMintedOnQueryVariables>(MainnetTokenMintedOnDocument, variables, options) as Promise<MainnetTokenMintedOnQuery>;
    },
    SepoliaTokenMintedOn(variables?: SepoliaTokenMintedOnQueryVariables, options?: C): Promise<SepoliaTokenMintedOnQuery> {
      return requester<SepoliaTokenMintedOnQuery, SepoliaTokenMintedOnQueryVariables>(SepoliaTokenMintedOnDocument, variables, options) as Promise<SepoliaTokenMintedOnQuery>;
    },
    FamePresaleTokenHolders(variables?: FamePresaleTokenHoldersQueryVariables, options?: C): Promise<FamePresaleTokenHoldersQuery> {
      return requester<FamePresaleTokenHoldersQuery, FamePresaleTokenHoldersQueryVariables>(FamePresaleTokenHoldersDocument, variables, options) as Promise<FamePresaleTokenHoldersQuery>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;