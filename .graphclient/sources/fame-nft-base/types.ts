// @ts-nocheck

import { InContextSdkMethod } from '@graphql-mesh/types';
import { MeshContext } from '@graphql-mesh/runtime';

export namespace FameNftBaseTypes {
  export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
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
};

export type ApprovalForAll = {
  id: Scalars['Bytes'];
  owner: Scalars['Bytes'];
  operator: Scalars['Bytes'];
  approved: Scalars['Boolean'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
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
};

export type ApprovalForAll_orderBy =
  | 'id'
  | 'owner'
  | 'operator'
  | 'approved'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash';

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
};

export type Approval_orderBy =
  | 'id'
  | 'owner'
  | 'spender'
  | 'FameLadySociety_id'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash';

export type BatchMetadataUpdate = {
  id: Scalars['Bytes'];
  _fromTokenId: Scalars['BigInt'];
  _toTokenId: Scalars['BigInt'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
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
};

export type BatchMetadataUpdate_orderBy =
  | 'id'
  | '_fromTokenId'
  | '_toTokenId'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash';

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
};

export type MetadataUpdate_orderBy =
  | 'id'
  | '_tokenId'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash';

/** Defines the order direction, either ascending or descending */
export type OrderDirection =
  | 'asc'
  | 'desc';

export type Ownership = {
  id: Scalars['ID'];
  owner?: Maybe<Scalars['Bytes']>;
  tokenId?: Maybe<Scalars['BigInt']>;
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
};

export type Ownership_orderBy =
  | 'id'
  | 'owner'
  | 'tokenId';

export type Query = {
  base_fame_nft_approval?: Maybe<Approval>;
  base_fame_nft_approvals: Array<Approval>;
  base_fame_nft_approvalForAll?: Maybe<ApprovalForAll>;
  base_fame_nft_approvalForAlls: Array<ApprovalForAll>;
  base_fame_nft_batchMetadataUpdate?: Maybe<BatchMetadataUpdate>;
  base_fame_nft_batchMetadataUpdates: Array<BatchMetadataUpdate>;
  base_fame_nft_metadataUpdate?: Maybe<MetadataUpdate>;
  base_fame_nft_metadataUpdates: Array<MetadataUpdate>;
  base_fame_nft_transfer?: Maybe<Transfer>;
  base_fame_nft_transfers: Array<Transfer>;
  base_fame_nft_ownership?: Maybe<Ownership>;
  base_fame_nft_ownerships: Array<Ownership>;
  /** Access to subgraph metadata */
  base_fame_nft__meta?: Maybe<_Meta_>;
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


export type Querybase_fame_nft__metaArgs = {
  block?: InputMaybe<Block_height>;
};

export type Subscription = {
  base_fame_nft_approval?: Maybe<Approval>;
  base_fame_nft_approvals: Array<Approval>;
  base_fame_nft_approvalForAll?: Maybe<ApprovalForAll>;
  base_fame_nft_approvalForAlls: Array<ApprovalForAll>;
  base_fame_nft_batchMetadataUpdate?: Maybe<BatchMetadataUpdate>;
  base_fame_nft_batchMetadataUpdates: Array<BatchMetadataUpdate>;
  base_fame_nft_metadataUpdate?: Maybe<MetadataUpdate>;
  base_fame_nft_metadataUpdates: Array<MetadataUpdate>;
  base_fame_nft_transfer?: Maybe<Transfer>;
  base_fame_nft_transfers: Array<Transfer>;
  base_fame_nft_ownership?: Maybe<Ownership>;
  base_fame_nft_ownerships: Array<Ownership>;
  /** Access to subgraph metadata */
  base_fame_nft__meta?: Maybe<_Meta_>;
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


export type Subscriptionbase_fame_nft__metaArgs = {
  block?: InputMaybe<Block_height>;
};

export type Transfer = {
  id: Scalars['Bytes'];
  from: Scalars['Bytes'];
  to: Scalars['Bytes'];
  FameLadySociety_id: Scalars['BigInt'];
  blockNumber: Scalars['BigInt'];
  blockTimestamp: Scalars['BigInt'];
  transactionHash: Scalars['Bytes'];
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
};

export type Transfer_orderBy =
  | 'id'
  | 'from'
  | 'to'
  | 'FameLadySociety_id'
  | 'blockNumber'
  | 'blockTimestamp'
  | 'transactionHash';

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

  export type QuerySdk = {
      /** null **/
  base_fame_nft_approval: InContextSdkMethod<Query['base_fame_nft_approval'], Querybase_fame_nft_approvalArgs, MeshContext>,
  /** null **/
  base_fame_nft_approvals: InContextSdkMethod<Query['base_fame_nft_approvals'], Querybase_fame_nft_approvalsArgs, MeshContext>,
  /** null **/
  base_fame_nft_approvalForAll: InContextSdkMethod<Query['base_fame_nft_approvalForAll'], Querybase_fame_nft_approvalForAllArgs, MeshContext>,
  /** null **/
  base_fame_nft_approvalForAlls: InContextSdkMethod<Query['base_fame_nft_approvalForAlls'], Querybase_fame_nft_approvalForAllsArgs, MeshContext>,
  /** null **/
  base_fame_nft_batchMetadataUpdate: InContextSdkMethod<Query['base_fame_nft_batchMetadataUpdate'], Querybase_fame_nft_batchMetadataUpdateArgs, MeshContext>,
  /** null **/
  base_fame_nft_batchMetadataUpdates: InContextSdkMethod<Query['base_fame_nft_batchMetadataUpdates'], Querybase_fame_nft_batchMetadataUpdatesArgs, MeshContext>,
  /** null **/
  base_fame_nft_metadataUpdate: InContextSdkMethod<Query['base_fame_nft_metadataUpdate'], Querybase_fame_nft_metadataUpdateArgs, MeshContext>,
  /** null **/
  base_fame_nft_metadataUpdates: InContextSdkMethod<Query['base_fame_nft_metadataUpdates'], Querybase_fame_nft_metadataUpdatesArgs, MeshContext>,
  /** null **/
  base_fame_nft_transfer: InContextSdkMethod<Query['base_fame_nft_transfer'], Querybase_fame_nft_transferArgs, MeshContext>,
  /** null **/
  base_fame_nft_transfers: InContextSdkMethod<Query['base_fame_nft_transfers'], Querybase_fame_nft_transfersArgs, MeshContext>,
  /** null **/
  base_fame_nft_ownership: InContextSdkMethod<Query['base_fame_nft_ownership'], Querybase_fame_nft_ownershipArgs, MeshContext>,
  /** null **/
  base_fame_nft_ownerships: InContextSdkMethod<Query['base_fame_nft_ownerships'], Querybase_fame_nft_ownershipsArgs, MeshContext>,
  /** Access to subgraph metadata **/
  base_fame_nft__meta: InContextSdkMethod<Query['base_fame_nft__meta'], Querybase_fame_nft__metaArgs, MeshContext>
  };

  export type MutationSdk = {
    
  };

  export type SubscriptionSdk = {
      /** null **/
  base_fame_nft_approval: InContextSdkMethod<Subscription['base_fame_nft_approval'], Subscriptionbase_fame_nft_approvalArgs, MeshContext>,
  /** null **/
  base_fame_nft_approvals: InContextSdkMethod<Subscription['base_fame_nft_approvals'], Subscriptionbase_fame_nft_approvalsArgs, MeshContext>,
  /** null **/
  base_fame_nft_approvalForAll: InContextSdkMethod<Subscription['base_fame_nft_approvalForAll'], Subscriptionbase_fame_nft_approvalForAllArgs, MeshContext>,
  /** null **/
  base_fame_nft_approvalForAlls: InContextSdkMethod<Subscription['base_fame_nft_approvalForAlls'], Subscriptionbase_fame_nft_approvalForAllsArgs, MeshContext>,
  /** null **/
  base_fame_nft_batchMetadataUpdate: InContextSdkMethod<Subscription['base_fame_nft_batchMetadataUpdate'], Subscriptionbase_fame_nft_batchMetadataUpdateArgs, MeshContext>,
  /** null **/
  base_fame_nft_batchMetadataUpdates: InContextSdkMethod<Subscription['base_fame_nft_batchMetadataUpdates'], Subscriptionbase_fame_nft_batchMetadataUpdatesArgs, MeshContext>,
  /** null **/
  base_fame_nft_metadataUpdate: InContextSdkMethod<Subscription['base_fame_nft_metadataUpdate'], Subscriptionbase_fame_nft_metadataUpdateArgs, MeshContext>,
  /** null **/
  base_fame_nft_metadataUpdates: InContextSdkMethod<Subscription['base_fame_nft_metadataUpdates'], Subscriptionbase_fame_nft_metadataUpdatesArgs, MeshContext>,
  /** null **/
  base_fame_nft_transfer: InContextSdkMethod<Subscription['base_fame_nft_transfer'], Subscriptionbase_fame_nft_transferArgs, MeshContext>,
  /** null **/
  base_fame_nft_transfers: InContextSdkMethod<Subscription['base_fame_nft_transfers'], Subscriptionbase_fame_nft_transfersArgs, MeshContext>,
  /** null **/
  base_fame_nft_ownership: InContextSdkMethod<Subscription['base_fame_nft_ownership'], Subscriptionbase_fame_nft_ownershipArgs, MeshContext>,
  /** null **/
  base_fame_nft_ownerships: InContextSdkMethod<Subscription['base_fame_nft_ownerships'], Subscriptionbase_fame_nft_ownershipsArgs, MeshContext>,
  /** Access to subgraph metadata **/
  base_fame_nft__meta: InContextSdkMethod<Subscription['base_fame_nft__meta'], Subscriptionbase_fame_nft__metaArgs, MeshContext>
  };

  export type Context = {
      ["fame-nft-base"]: { Query: QuerySdk, Mutation: MutationSdk, Subscription: SubscriptionSdk },
      
    };
}
