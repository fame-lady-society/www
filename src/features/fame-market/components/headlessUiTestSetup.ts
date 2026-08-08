if (typeof Element === "undefined") {
  Object.defineProperty(globalThis, "Element", {
    configurable: true,
    value: class TestElement {},
  });
}
