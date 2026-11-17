// Vercel Routing Middleware: personalises the link-preview meta tags for "/?to=Tên"
// so Zalo / Messenger / Facebook show the recipient's own invitation card.
// Requests without ?to= fall through untouched to the static index.html.
import { cleanRecipientName, escapeHtmlAttribute } from "./server/recipient-name.js";

export const config = { matcher: "/" };

export function personalizeHtml(html, name, origin) {
  const encoded = encodeURIComponent(name);
  const title = escapeHtmlAttribute(`Thân mời ${name} · Lễ tốt nghiệp Ngô Quốc Đạt`);
  const image = escapeHtmlAttribute(`${origin}/api/og?to=${encoded}`);
  const pageUrl = escapeHtmlAttribute(`${origin}/?to=${encoded}`);
  const swap = (source, pattern, value) =>
    source.replace(pattern, (_, before, after) => `${before}${value}${after}`);

  let out = html;
  out = swap(out, /(<meta property="og:title" content=")[^"]*(")/, title);
  out = swap(out, /(<meta property="og:url" content=")[^"]*(")/, pageUrl);
  out = swap(out, /(<meta property="og:image" content=")[^"]*(")/, image);
  out = swap(out, /(<meta name="twitter:image" content=")[^"]*(")/, image);
  out = swap(out, /(<meta property="og:image:alt" content=")[^"]*(")/, title);
  return out;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const name = cleanRecipientName(url.searchParams.get("to"));
  if (!name) return; // continue to the static page

  try {
    // "/index.html" is outside the matcher, so this self-fetch cannot recurse.
    const page = await fetch(new URL("/index.html", url.origin));
    if (!page.ok) return;
    const html = personalizeHtml(await page.text(), name, url.origin);
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Link preview personalisation failed:", error.message);
    return; // fall back to the generic preview rather than breaking the page
  }
}
