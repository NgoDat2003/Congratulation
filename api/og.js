// GET /api/og?to=Tên → 1200×630 PNG link-preview card personalised for the recipient.
// Background (blurred graduation photo + poster) is pre-rendered in
// public/images/og-background.jpg; this function only draws the text on top.
import { ImageResponse } from "@vercel/og";
import { cleanRecipientName } from "../server/recipient-name.js";

const FALLBACK_NAME = "Bạn thân mến";
const IVORY = "#FFF8E9";
const GOLD = "#F6DE8D";
const CORAL = "#E8826A";

// Minimal element factory so the function needs no JSX build step (Satori accepts this shape).
function h(type, style, ...children) {
  return { type, props: { style: { display: "flex", ...style }, children } };
}

// Downloads only the glyphs we render, as TTF/OTF (Satori cannot read WOFF2).
async function loadGoogleFont(family, weight, italic, text) {
  const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:${axis}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`Font ${family} ${weight} not available as TTF/OTF`);
  const font = await fetch(match[1]);
  if (!font.ok) throw new Error(`Font download failed: ${font.status}`);
  return font.arrayBuffer();
}

function nameFontSize(name) {
  if (name.length <= 10) return 88;
  if (name.length <= 20) return 70;
  return 54;
}

export function buildCard(name, backgroundDataUrl) {
  return h(
    "div",
    { width: "100%", height: "100%", position: "relative", fontFamily: "Be Vietnam Pro" },
    { type: "img", props: { src: backgroundDataUrl, width: 1200, height: 630, style: { position: "absolute", top: 0, left: 0 } } },
    h(
      "div",
      { position: "absolute", top: 0, left: 0, width: 690, height: 630, flexDirection: "column", justifyContent: "center", padding: "0 0 0 72px" },
      h("div", { color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: 5 }, "THIỆP MỜI LỄ TỐT NGHIỆP"),
      h("div", { width: 72, height: 3, background: CORAL, margin: "22px 0 24px" }),
      h("div", { color: CORAL, fontFamily: "Noto Serif Italic", fontSize: 40 }, "Thân mời"),
      h(
        "div",
        { color: IVORY, fontFamily: "Noto Serif", fontWeight: 700, fontSize: nameFontSize(name), lineHeight: 1.12, marginTop: 6, maxWidth: 600 },
        name,
      ),
      h(
        "div",
        { color: "#E9DCCB", fontSize: 26, marginTop: 22, lineHeight: 1.45, maxWidth: 560, flexWrap: "wrap" },
        "đến chung vui ngày tốt nghiệp của ",
        h("span", { color: GOLD, fontWeight: 700 }, "Ngô Quốc Đạt"),
      ),
      h(
        "div",
        { marginTop: 34, alignSelf: "flex-start", padding: "12px 26px", borderRadius: 999, border: `2px solid ${GOLD}`, color: GOLD, fontSize: 24, fontWeight: 700 },
        "Thứ Tư · 25/11/2026 · IUH",
      ),
    ),
  );
}

export async function GET(request) {
  const url = new URL(request.url);
  const name = cleanRecipientName(url.searchParams.get("to")) || FALLBACK_NAME;

  const background = await fetch(new URL("/images/og-background.jpg", url.origin));
  if (!background.ok) return new Response("Background image missing", { status: 500 });
  const backgroundDataUrl = `data:image/jpeg;base64,${Buffer.from(await background.arrayBuffer()).toString("base64")}`;

  const sansText = `THIỆP MỜI LỄ TỐT NGHIỆP đến chung vui ngày tốt nghiệp của Ngô Quốc Đạt Thứ Tư · 25/11/2026 · IUH`;
  const [sansRegular, sansBold, serifBold, serifItalic] = await Promise.all([
    loadGoogleFont("Be+Vietnam+Pro", 400, false, sansText),
    loadGoogleFont("Be+Vietnam+Pro", 700, false, sansText),
    loadGoogleFont("Noto+Serif", 700, false, name),
    loadGoogleFont("Noto+Serif", 400, true, "Thân mời"),
  ]);

  return new ImageResponse(buildCard(name, backgroundDataUrl), {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Be Vietnam Pro", data: sansRegular, weight: 400, style: "normal" },
      { name: "Be Vietnam Pro", data: sansBold, weight: 700, style: "normal" },
      { name: "Noto Serif", data: serifBold, weight: 700, style: "normal" },
      { name: "Noto Serif Italic", data: serifItalic, weight: 400, style: "normal" },
    ],
    headers: { "cache-control": "public, max-age=86400, s-maxage=31536000, immutable" },
  });
}
