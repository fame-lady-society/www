import "./headlessUiTestSetup";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  acceptGalleryPurchaseDisclosure,
  cancelGalleryPurchaseDisclosure,
  isGalleryPurchaseDisclosureAccepted,
  requestGalleryPurchaseDisclosure,
  understandGalleryPurchaseDisclosure,
} from "../purchaseDisclosure";
import {
  GalleryPurchaseDisclosureActions,
  GalleryPurchaseDisclosureContent,
} from "./GalleryPurchaseDisclosureModal";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("gallery purchase disclosure", () => {
  it("requires acknowledgement until the buyer chooses not to see it again", () => {
    const storage = memoryStorage();

    assert.equal(isGalleryPurchaseDisclosureAccepted(storage), false);
    acceptGalleryPurchaseDisclosure(storage);
    assert.equal(isGalleryPurchaseDisclosureAccepted(storage), true);
  });

  it("blocks wallet work until acknowledgement and honors cancel and persistence", () => {
    const storage = memoryStorage();
    const pending = { current: false };
    const openStates: boolean[] = [];
    let attempts = 0;
    let aborts = 0;
    const request = () =>
      requestGalleryPurchaseDisclosure({
        getStorage: () => storage,
        pending,
        setOpen: (open) => openStates.push(open),
        beginAttempt: () => attempts++,
        onStorageError: () => assert.fail("storage should be available"),
      });
    const understand = (doNotShowAgain: boolean) =>
      understandGalleryPurchaseDisclosure({
        getStorage: () => storage,
        pending,
        setOpen: (open) => openStates.push(open),
        beginAttempt: () => attempts++,
        onStorageError: () => assert.fail("storage should be available"),
        doNotShowAgain,
      });

    request();
    assert.equal(attempts, 0);
    assert.equal(pending.current, true);
    assert.deepEqual(openStates, [true]);

    cancelGalleryPurchaseDisclosure({
      pending,
      setOpen: (open) => openStates.push(open),
      abortAttempt: () => aborts++,
    });
    assert.equal(aborts, 1);
    assert.equal(attempts, 0);
    assert.equal(pending.current, false);
    cancelGalleryPurchaseDisclosure({
      pending,
      setOpen: (open) => openStates.push(open),
      abortAttempt: () => aborts++,
    });
    assert.equal(aborts, 1);

    request();
    understand(false);
    assert.equal(attempts, 1);
    assert.equal(isGalleryPurchaseDisclosureAccepted(storage), false);
    understand(false);
    assert.equal(attempts, 1);

    request();
    understand(true);
    assert.equal(attempts, 2);
    assert.equal(isGalleryPurchaseDisclosureAccepted(storage), true);

    request();
    assert.equal(attempts, 3);
    assert.equal(pending.current, false);
  });

  it("prompts on storage read failure and continues on storage write failure", () => {
    const pending = { current: false };
    const errors: string[] = [];
    let attempts = 0;

    requestGalleryPurchaseDisclosure({
      getStorage: () => {
        throw new Error("storage blocked");
      },
      pending,
      setOpen: () => undefined,
      beginAttempt: () => attempts++,
      onStorageError: (operation) => errors.push(operation),
    });
    assert.equal(pending.current, true);
    assert.equal(attempts, 0);

    understandGalleryPurchaseDisclosure({
      getStorage: () => {
        throw new Error("storage blocked");
      },
      pending,
      setOpen: () => undefined,
      beginAttempt: () => attempts++,
      onStorageError: (operation) => errors.push(operation),
      doNotShowAgain: true,
    });
    assert.equal(attempts, 1);
    assert.deepEqual(errors, ["read", "write"]);
  });

  it("plainly explains the atomic metadata swap and delayed cache updates", () => {
    const html = renderToStaticMarkup(
      <>
        <GalleryPurchaseDisclosureContent
          doNotShowAgain={false}
          onDoNotShowAgainChange={() => undefined}
        />
        <GalleryPurchaseDisclosureActions
          onCancel={() => undefined}
          onUnderstand={() => undefined}
        />
      </>,
    );

    assert.match(html, /buying a FAME Society NFT/i);
    assert.match(html, /marketplace contract/i);
    assert.match(html, /mint or unrevealed token pools/i);
    assert.match(html, /same checkout transaction/i);
    assert.match(html, /set on-chain/i);
    assert.match(html, /OpenSea, wallets, and other websites/i);
    assert.match(html, /several minutes or longer/i);
    assert.match(html, /ERC-4906 metadata update events/i);
    assert.match(html, /Do not show this again/i);
    assert.doesNotMatch(html, /checked=""/u);
    assert.match(html, /Cancel/);
    assert.match(html, /I understand/);
  });
});
