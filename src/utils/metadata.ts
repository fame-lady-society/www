export interface IAttributeString {
  value: string;
  trait_type: string;
  colors?: string[];
}

export interface IAttributeNumeric {
  value: number;
  trait_type: string;
  display_type?: "number" | "boost_number" | "boost_percentage";
}

export type IMetadataAttribute = IAttributeString | IAttributeNumeric;

export interface IMetadata {
  image: string;
  description?: string;
  tokenId?: string;
  external_url?: string;
  animation_url?: string;
  name: string;
  attributes?: IMetadataAttribute[];
  properties?: Record<string, string>;
  edition?: string | number;
  id?: string | number;
}

export const defaultDescription = `Fame Lady Society is the wrapped token for the first ever generative all-female avatar collection on the Ethereum blockchain. Yes, we are THE community who took over a project TWICE to write our own story. This is NFT history. This is HERstory. FLS are 8888 distinctive Ladies made up of millions of fierce trait combinations. Community = Everything. Commercial IP rights of each Lady NFT belong to its owner.`;

export function thumbnailImageUrl(tokenId: string | number) {
  return `https://fame.support/fls/thumb/${tokenId}`;
}

export function imageUrl(tokenId: string | number) {
  // return `https://fame.support/fls/image/${tokenId}`;
  return `https://gateway.irys.xyz/f5Lq-xaNRrAi2yCBHnTOPbhvJ6Q9CKXvXscit54Hdv0/${tokenId}.png`;
}


async function resolveIpfsUrl(url: string): Promise<{
  url: string;
  content: ArrayBuffer | null;
}> {
  if (!url.startsWith("ipfs://")) {
    const response = await fetch(url);
    if (response.ok) {
      return {
        url,
        content: await response.arrayBuffer(),
      };
    }
    return {
      url,
      content: null,
    };
  }

  const ipfsPath = url.slice("ipfs://".length);
  const [cid, ...pathParts] = ipfsPath.split("/");
  if (!cid) {
    throw new Error(`Invalid ipfs url: ${url}`);
  }

  const path = pathParts.length > 0 ? `/${pathParts.join("/")}` : "";
  const gatewayDomains = ["storry.tv", "dweb.link", "dget.top"];
  const gatewayUrls = gatewayDomains.map(
    (domain) => `https://${cid}.ipfs.${domain}${path}`,
  );

  for (const gatewayUrl of gatewayUrls) {
    const response = await fetch(gatewayUrl);
    if (response.ok) {
      return {
        url: gatewayUrl,
        content: await response.arrayBuffer(),
      };
    }
  }

  throw new Error(
    `Failed to resolve ipfs url via gateways: ${gatewayUrls.join(", ")}`,
  );
}
