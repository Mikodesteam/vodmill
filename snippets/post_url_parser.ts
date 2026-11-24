// Excerpt from Vodmill (src/server/campaigns/urls.ts). Shown for illustration only.
// The full source code is available at https://store.mikodes.com/p/vodmill/
//
// Turns a pasted link to a posted clip into a platform and a stable post id, so the same post
// cannot be submitted twice to a campaign whatever tracking parameters or host variant it carries.
// Nothing here opens a connection; refusals are sentences the clipper can act on.

const host = (u: URL) => u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, "");

/** Parse a link to a posted clip. Throws 422 with a sentence the clipper can act on. */
export function parsePostUrl(raw: unknown): ParsedPost {
  let s = String(raw ?? "").trim();
  if (!s || s.length > 500) throw new HttpError(422, "Paste the link to your posted clip.");
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u: URL;
  try { u = new URL(s); } catch { throw new HttpError(422, "That is not a link. Paste the address of your posted clip."); }
  if (u.username || u.password) throw new HttpError(422, "That is not a link to a posted clip.");
  const h = host(u);
  const seg = u.pathname.split("/").filter(Boolean);
  const clean = (v: string | undefined) => (v ?? "").replace(/^@/, "").toLowerCase();

  if (h === "youtube.com" || h === "youtu.be" || h === "music.youtube.com") {
  // … Twitch branch …
  if (h === "vm.tiktok.com" || h === "vt.tiktok.com") throw new HttpError(422, "Short TikTok links cannot be read. Open the video and paste its full link (tiktok.com/@you/video/…).");
  if (h === "tiktok.com") {
    if (seg[0]?.startsWith("@") && seg[1] === "video" && /^\d{8,25}$/.test(seg[2] ?? "")) {
      const handle = clean(seg[0]);
      return { platform: "tiktok", remoteId: seg[2]!, url: `https://www.tiktok.com/@${handle}/video/${seg[2]}`, handle };
    }
    throw new HttpError(422, "That TikTok link is not a video. Paste the full link (tiktok.com/@you/video/…).");
  }
  // … Instagram, X and the other platforms follow the same pattern …
}
