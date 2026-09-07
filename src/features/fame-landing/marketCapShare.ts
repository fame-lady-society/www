import {
  formatFameUsdc,
  formatSocietyEth,
  formatSocietyUsdc,
  type MarketCapCalculation,
} from "./marketCapCalculator";

type AvailableCalculation = Extract<
  MarketCapCalculation,
  { status: "available" }
>;

export function marketCapShareValues(calculation: AvailableCalculation) {
  const whole = calculation.marketCapUsdc / 1_000_000n;
  const fraction = (calculation.marketCapUsdc % 1_000_000n)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return {
    marketCap: `$${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`,
    society: formatSocietyUsdc(calculation.marketCapUsdc),
    eth:
      calculation.societyEthWei === null
        ? "ETH value unavailable"
        : formatSocietyEth(calculation.societyEthWei),
    fame: formatFameUsdc(calculation.marketCapUsdc),
  };
}

// Keep generation synchronous so the native share call retains the click's
// transient user activation, including in Safari. No network assets are needed.
export function createMarketCapShareImage(calculation: AvailableCalculation) {
  const values = marketCapShareValues(calculation);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the market cap image.");

  context.fillStyle = "#11100d";
  context.fillRect(0, 0, 1200, 630);
  function text(
    value: string,
    x: number,
    y: number,
    size: number,
    width: number,
    color = "#f4eee2",
    serif = false,
  ) {
    context!.fillStyle = color;
    context!.font = `${size}px ${serif ? '"Iowan Old Style", Baskerville, "Times New Roman", serif' : "Arial, sans-serif"}`;
    context!.fillText(value, x, y, width);
  }
  text("$FAME  /  FAME LADY SOCIETY", 64, 72, 22, 1072, "#c9aa67");
  text("At a market cap of", 64, 148, 30, 1072, "#f4eee2", true);
  text(values.marketCap, 64, 250, 88, 1072, "#f4eee2", true);
  context.fillStyle = "#c9aa67";
  context.fillRect(64, 292, 1072, 1);
  text("ONE SOCIETY NFT", 64, 350, 20, 510, "#c9aa67");
  text(values.society, 64, 420, 56, 510, "#f4eee2", true);
  text(values.eth, 64, 466, 26, 510);
  text("EACH $FAME", 664, 350, 20, 472, "#c9aa67");
  text(values.fame, 664, 420, 56, 472, "#f4eee2", true);
  text(
    "Market cap calculator · Hypothetical values",
    64,
    558,
    20,
    1072,
    "#9f9789",
  );
  text("fameladysociety.com/fame", 64, 592, 20, 1072, "#c9aa67");

  const dataUrl = canvas.toDataURL("image/png");
  const bytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (char) =>
    char.charCodeAt(0),
  );
  const file = new File([bytes], "fame-market-cap.png", { type: "image/png" });
  return { file, dataUrl };
}

export async function shareMarketCap(calculation: AvailableCalculation) {
  const { file, dataUrl } = createMarketCapShareImage(calculation);
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    const values = marketCapShareValues(calculation);
    await navigator.share({
      files: [file],
      text: `What would your Society NFT be worth?\n\nAt a ${values.marketCap} market cap:\n• 1 Society NFT = ${values.society}\n• 1 $FAME = ${values.fame}\n\nExplore the possibilities:\nhttps://fameladysociety.com/fame`,
    });
    return "shared";
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return "downloaded";
}
