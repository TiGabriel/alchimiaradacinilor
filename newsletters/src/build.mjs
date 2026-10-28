// Generates the newsletters in the website's design (botanical apothecary:
// paper, forest green, clay; Fraunces + Manrope). Table-based, inline styles.
//
//   node build.mjs                       → ../preview/*.html (local images, sample name)
//   IMG_BASE=https://… node build.mjs    → ../brevo/*.html (hosted images, Brevo tags)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = "https://alchimiaradacinilor.ro";
const IMG_BASE = process.env.IMG_BASE?.replace(/\/$/, "");
const MODE = IMG_BASE ? "brevo" : "preview";
// Hosted file names differ from ours when the host renames uploads (Brevo does).
const hosted = IMG_BASE
  ? JSON.parse(readFileSync(path.join(here, "../images/brevo-urls.json"), "utf8"))
  : {};
const img = (name) => (IMG_BASE ? `${IMG_BASE}/${hosted[name] ?? name}` : `../images/${name}`);

const c = {
  paper: "#f8f4ec",
  paperDeep: "#f0e9dc",
  surface: "#fffdf9",
  ink: "#1e2620",
  muted: "#5b6358",
  line: "#e2d9c9",
  forest: "#2d4a3a",
  forestDeep: "#213729",
  forestSoft: "#e3ebe3",
  sageSoft: "#e6ece2",
  clay: "#9a5234",
  claySoft: "#f3e3d9",
  ochreSoft: "#f4ead2",
  inverse: "#f8f4ec",
};
const sans = "'Manrope', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const serif = "'Fraunces', Georgia, 'Times New Roman', serif";

// Brevo personalisation and mandatory links; the preview shows sample values.
const T =
  MODE === "brevo"
    ? {
        hello: "Bună{% if contact.FIRSTNAME %}, {{ contact.FIRSTNAME }}{% endif %}!",
        mirror: "{{ mirror }}",
        unsubscribe: "{{ unsubscribe }}",
      }
    : { hello: "Bună, Ana!", mirror: "#", unsubscribe: "#" };

const link = (p, campaign) =>
  `${SITE}${p}${p.includes("?") ? "&" : "?"}utm_source=newsletter&utm_medium=email&utm_campaign=${campaign}`;

// ── Building blocks ────────────────────────────────────────────────────────

const button = (label, href, { light = false } = {}) => `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 0;"><tr>
<td style="border-radius:999px;background:${light ? c.inverse : c.forest};">
<a href="${href}" style="display:inline-block;padding:15px 30px;font:700 15px/1 ${sans};color:${light ? c.forestDeep : c.inverse};text-decoration:none;border-radius:999px;">${label}</a>
</td></tr></table>`;

const eyebrow = (text, color = c.clay) =>
  `<p style="margin:0 0 14px;font:700 11px/1.4 ${sans};letter-spacing:2px;text-transform:uppercase;color:${color};">${text}</p>`;

const heading = (text, size = 26) =>
  `<h2 style="margin:0 0 8px;font:400 ${size}px/1.2 ${serif};color:${c.ink};">${text}</h2>`;

const para = (text, { color = c.ink, size = 16, margin = "0 0 16px" } = {}) =>
  `<p style="margin:${margin};font:${size}px/1.65 ${sans};color:${color};">${text}</p>`;

const section = (inner, { bg = c.surface, pad = "36px 36px", border = true } = {}) => `
<tr><td class="px" style="background:${bg};${border ? `border:1px solid ${c.line};` : ""}border-radius:20px;padding:${pad};">
${inner}
</td></tr>
<tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>`;

const hero = ({ tag, title, body, extra = "", cta }) =>
  section(
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
<td valign="top" class="stack">
${eyebrow(tag)}
<h1 style="margin:0 0 18px;font:400 34px/1.15 ${serif};color:${c.forestDeep};">${title}</h1>
${para(T.hello, { margin: "0 0 10px" })}
${para(body)}
${extra}
${cta}
</td>
<td valign="bottom" width="120" class="hide-mobile" style="padding-left:16px;">
<img src="${img("plant.png")}" width="110" alt="" style="display:block;width:110px;height:auto;border:0;" />
</td>
</tr></table>`,
    { bg: c.paperDeep, border: false, pad: "40px 36px" },
  );

const codeBox = ({ code, title, note }) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:6px 0 22px;"><tr>
<td align="center" style="background:${c.surface};border:2px dashed ${c.clay};border-radius:16px;padding:20px 16px;">
<p style="margin:0 0 6px;font:700 11px/1.4 ${sans};letter-spacing:2px;text-transform:uppercase;color:${c.muted};">Codul tău</p>
<p style="margin:0 0 6px;font:500 32px/1.1 ${serif};letter-spacing:4px;color:${c.clay};">${code}</p>
<p style="margin:0 0 4px;font:700 15px/1.5 ${sans};color:${c.ink};">${title}</p>
<p style="margin:0;font:13px/1.5 ${sans};color:${c.muted};">${note}</p>
</td></tr></table>`;

const priceFmt = (v) => `${v.toFixed(2).replace(".", ",")} RON`;

const productCard = (p, campaign) => `
<a href="${link(`/produs/${p.slug}`, campaign)}" style="text-decoration:none;color:${c.ink};">
<img src="${img(`${p.slug}.jpg`)}" width="250" alt="${p.name}" style="display:block;width:100%;max-width:250px;height:auto;border:0;border-radius:14px;background:${c.paper};" />
</a>
<p style="margin:14px 0 4px;font:400 19px/1.25 ${serif};color:${c.ink};">${p.name}</p>
<p style="margin:0 0 10px;font:14px/1.55 ${sans};color:${c.muted};">${p.note}</p>
<p style="margin:0 0 4px;font:700 15px/1.4 ${sans};color:${c.ink};">${priceFmt(p.price)}</p>
<a href="${link(`/produs/${p.slug}`, campaign)}" style="font:700 14px/1.6 ${sans};color:${c.forest};text-decoration:underline;">Vezi produsul →</a>`;

const productGrid = (products, campaign) => {
  const rows = [];
  for (let i = 0; i < products.length; i += 2) {
    const [a, b] = products.slice(i, i + 2);
    rows.push(`<tr>
<td valign="top" width="50%" class="stack" style="padding:0 10px 28px 0;">${productCard(a, campaign)}</td>
<td valign="top" width="50%" class="stack" style="padding:0 0 28px 10px;">${b ? productCard(b, campaign) : ""}</td>
</tr>`);
  }
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">${rows.join("")}</table>`;
};

const productRow = (p, campaign) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 18px;"><tr>
<td width="128" valign="middle" style="padding-right:18px;">
<a href="${link(`/produs/${p.slug}`, campaign)}"><img src="${img(`${p.slug}.jpg`)}" width="128" alt="${p.name}" style="display:block;width:128px;height:128px;border:0;border-radius:14px;" /></a>
</td>
<td valign="middle">
<p style="margin:0 0 4px;font:400 20px/1.25 ${serif};color:${c.ink};">${p.name}</p>
<p style="margin:0 0 8px;font:14px/1.55 ${sans};color:${c.muted};">${p.note}</p>
<p style="margin:0;font:14px/1.5 ${sans};color:${c.ink};"><strong>${priceFmt(p.price)}</strong> &nbsp;·&nbsp; <a href="${link(`/produs/${p.slug}`, campaign)}" style="color:${c.forest};font-weight:700;">Vezi produsul</a></p>
</td>
</tr></table>`;

const ritual = ({ tag, title, body, cta }) =>
  section(
    `${eyebrow(tag, c.ochreSoft)}
<h2 style="margin:0 0 12px;font:400 26px/1.2 ${serif};color:${c.inverse};">${title}</h2>
${body.map((t) => `<p style="margin:0 0 14px;font:16px/1.65 ${sans};color:${c.inverse};">${t}</p>`).join("")}
${cta ?? ""}`,
    { bg: c.forest, border: false, pad: "34px 36px" },
  );

const perks = (campaign) => `
<tr><td style="padding:4px 0 20px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
${[
  ["Livrare gratuită", "pentru comenzile de peste 250 RON"],
  ["1–3 zile lucrătoare", "livrare prin curier rapid"],
  ["Plata la livrare", "plătești când primești coletul"],
]
  .map(
    ([a, b]) => `<td width="33%" align="center" valign="top" class="stack" style="padding:8px 6px;">
<p style="margin:0 0 2px;font:400 17px/1.3 ${serif};color:${c.forestDeep};">${a}</p>
<p style="margin:0;font:13px/1.5 ${sans};color:${c.muted};">${b}</p></td>`,
  )
  .join("")}
</tr></table>
<p style="margin:12px 0 0;text-align:center;font:13px/1.5 ${sans};"><a href="${link("/livrare-si-retur", campaign)}" style="color:${c.muted};">Livrare și retur</a></p>
</td></tr>`;

function layout({ subject, preheader, edition, body, campaign }) {
  return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<title>${subject}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Manrope:wght@400;700&display=swap" rel="stylesheet" />
<style>
  body { margin:0; padding:0; background:${c.paper}; -webkit-text-size-adjust:100%; }
  a { color:${c.forest}; }
  @media (max-width: 620px) {
    .px { padding-left:22px !important; padding-right:22px !important; }
    .stack { display:block !important; width:100% !important; padding-left:0 !important; padding-right:0 !important; }
    .hide-mobile { display:none !important; }
    h1 { font-size:29px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${c.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${c.paper};">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">

<tr><td style="padding:0 6px 18px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
<td style="font:700 11px/1.4 ${sans};letter-spacing:2px;text-transform:uppercase;color:${c.clay};">Scrisoare botanică · ${edition}</td>
<td align="right" style="font:12px/1.4 ${sans};"><a href="${T.mirror}" style="color:${c.muted};">Vezi online</a></td>
</tr></table>
</td></tr>

<tr><td align="center" style="padding:6px 0 26px;">
<a href="${link("/", campaign)}"><img src="${img("logo.png")}" width="224" alt="Alchimia Rădăcinilor" style="display:block;width:224px;height:auto;border:0;" /></a>
</td></tr>

${body}

${perks(campaign)}

<tr><td align="center" style="padding:24px 18px 0;border-top:1px solid ${c.line};">
<img src="${img("icon.png")}" width="36" alt="" style="display:block;width:36px;height:36px;border:0;margin:0 auto 12px;" />
<p style="margin:0 0 6px;font:400 17px/1.3 ${serif};color:${c.forestDeep};">Alchimia Rădăcinilor</p>
<p style="margin:0 0 14px;font:13px/1.6 ${sans};color:${c.muted};">Uleiuri esențiale și ritualuri botanice<br />
<a href="${link("/", campaign)}" style="color:${c.muted};">alchimiaradacinilor.ro</a> · <a href="mailto:broascabianca58@gmail.com" style="color:${c.muted};">broascabianca58@gmail.com</a> · 0774 075 003<br />Eforie, România</p>
<p style="margin:0;font:12px/1.6 ${sans};color:${c.muted};">Primești acest email pentru că te-ai abonat la scrisorile botanice Alchimia Rădăcinilor.<br />
Nu mai vrei să le primești? <a href="${T.unsubscribe}" style="color:${c.muted};font-weight:700;">Dezabonează-te</a> oricând, cu un clic.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Content ────────────────────────────────────────────────────────────────

const P = {
  cinnamon: { slug: "cinnamon", name: "Scorțișoară", price: 279.05, note: "Caldă și condimentată — aroma serilor de toamnă." },
  wildOrange: { slug: "wild-orange", name: "Portocală Sălbatică", price: 131.69, note: "Dulce și însorită — o aromă care încălzește casa." },
  lavender: { slug: "lavender", name: "Levănțică", price: 290.82, note: "Florală și rotundă — aroma serilor liniștite." },
  lemon: { slug: "lemon", name: "Lămâie", price: 141.55, note: "Citrică și luminoasă, pentru dimineți proaspete." },
  peppermint: { slug: "peppermint", name: "Mentă", price: 241.7, note: "Mentolată și clară, pentru pauzele din mijlocul zilei." },
  abode: { slug: "abode", name: "abōde™", price: 237.82, note: "Lămâie verde, eucalipt și lavandină — prospețime pentru fiecare zi." },
  airX: { slug: "air-x", name: "Air-X™", price: 310.48, note: "Citrice, note lemnoase și ușor erbacee — o aromă intensă." },
  lumo: { slug: "difuzor-lumo", name: "Difuzor Lumo™", price: 699.7, note: "Bază din lemn de arțar și șapte culori de lumină; 2 sau 5 ore de difuzare continuă ori 10 ore intermitent." },
  roam: { slug: "difuzor-roam", name: "Difuzor Roam™", price: 501.21, note: "Portabil, din piatră naturală, cu baterie reîncărcabilă — pentru încăperi de până la 25 m²." },
  rollOn: { slug: "sticlute-roll-on", name: "Sticluțe roll-on, 6 buc.", price: 49.12, note: "Sticlă chihlimbarie de 10 ml, cu bilă din oțel — pentru amestecurile tale." },
};

const CODE = "TOAMNA15";
const UNTIL = "duminică, 26 octombrie 2026";

const newsletters = [
  {
    file: "01-promotie-toamna15",
    campaign: "toamna15",
    subject: "15% pentru ritualurile tale de toamnă",
    preheader: `Cu codul ${CODE}, la toată comanda, până ${UNTIL}. Scorțișoară, portocală sălbatică și seri liniștite.`,
    edition: "Octombrie 2026",
    body: (k) => `
${hero({
  tag: "Ofertă de toamnă · până pe 26 octombrie",
  title: "Seri lungi, arome calde — și 15% pentru ritualul tău",
  body: "Serile se lungesc, iar casa cere ceva cald: o notă de scorțișoară, dulceața portocalei sălbatice, lumina discretă a unui difuzor în colțul tău preferat. Pentru toamna aceasta îți lăsăm un mic cadou, la toată comanda.",
  extra: codeBox({ code: CODE, title: "15% reducere la toată comanda", note: `Introdu codul în coș · valabil până ${UNTIL}` }),
  cta: button("Alege-ți aromele de toamnă", link("/produse", k)),
})}
${section(`${eyebrow("Aromele sezonului")}
${heading("Patru alegeri pentru casa ta")}
${para("De la serile cu ceai până la diminețile cu ferestrele deschise.", { color: c.muted, margin: "0" })}
${productGrid([P.cinnamon, P.wildOrange, P.lavender, P.roam], k)}`)}
${ritual({
  tag: "Ritualul lunii",
  title: "Seara de toamnă, în difuzor",
  body: [
    "3 picături de portocală sălbatică și 1 picătură de scorțișoară, în apa difuzorului.",
    "Lasă aroma să umple camera cât pregătești ceaiul — dulce, caldă, ca un măr copt pe sobă.",
  ],
  cta: button("Vezi difuzoarele", link("/produse/difuzoare", k), { light: true }),
})}
${section(
  para(`Codul <strong>${CODE}</strong> se aplică o singură dată per client și nu se cumulează cu alte coduri de reducere. Livrarea gratuită pentru comenzile de peste 250 RON se calculează după aplicarea reducerii.`, { color: c.muted, size: 13, margin: "0" }),
  { bg: c.paper, pad: "18px 24px" },
)}`,
  },
  {
    file: "02-cele-5-esentiale",
    campaign: "cele-5-esentiale",
    subject: "Cinci arome cu care să începi",
    preheader: "Levănțică, lămâie, mentă, portocală sălbatică și un amestec pentru toată casa. Plus un quiz de un minut.",
    edition: "Ghid pentru început",
    body: (k) => `
${hero({
  tag: "Ghid pentru început",
  title: "Cinci arome cu care să începi",
  body: "Lumea uleiurilor esențiale poate părea mare la început. Noi pornim mereu de la câteva arome simple, care se potrivesc în aproape orice zi — iată-le, cu un gând scurt despre fiecare.",
  cta: button("Descoperă uleiurile", link("/produse/uleiuri-individuale", k)),
})}
${section(`${eyebrow("Cele 5 esențiale")}
${heading("Câte o aromă pentru fiecare moment")}
${para("Alese pentru diminețile proaspete, pauzele de la birou și serile liniștite.", { color: c.muted, margin: "0 0 26px" })}
${[P.lavender, P.lemon, P.peppermint, P.wildOrange, P.abode].map((p) => productRow(p, k)).join("")}`)}
${section(
  `${eyebrow("Quiz aromatic", c.forest)}
${heading("Nu știi care ți se potrivește?")}
${para("Răspunde la câteva întrebări despre momentele tale preferate ale zilei și îți recomandăm aromele potrivite. Durează un minut.")}
${button("Fă quiz-ul aromatic", link("/quiz", k))}`,
  { bg: c.sageSoft, border: false },
)}
${section(`${eyebrow("Pentru amestecurile tale")}
${productRow(P.rollOn, k)}
${para(`<strong>P.S.</strong> Până ${UNTIL}, codul <strong>${CODE}</strong> îți aduce 15% reducere la toată comanda.`, { color: c.muted, size: 14, margin: "6px 0 0" })}`)}`,
  },
  {
    file: "03-difuzoare-colt-linistit",
    campaign: "difuzoare",
    subject: "Un colț liniștit, cu lumină și aromă",
    preheader: "Două difuzoare, două feluri de a fi acasă — și două rețete simple pentru dimineață și seară.",
    edition: "Pentru casă",
    body: (k) => `
${hero({
  tag: "Pentru casă",
  title: "Un colț liniștit, cu lumină și aromă",
  body: "Un difuzor transformă câteva picături într-o atmosferă: lumină caldă seara, prospețime dimineața. Am ales două, pentru două feluri de a fi acasă.",
  cta: button("Vezi difuzoarele", link("/produse/difuzoare", k)),
})}
${section(`${eyebrow("Alege-ți difuzorul")}
${heading("Lumo sau Roam?")}
${productGrid([P.lumo, P.roam], k)}`)}
${ritual({
  tag: "Două rețete pentru difuzor",
  title: "Dimineața și seara",
  body: [
    "<strong>Dimineață luminoasă:</strong> 3 picături de lămâie și 2 picături de mentă.",
    "<strong>Seară liniștită:</strong> 4 picături de levănțică, sau 3 picături de portocală sălbatică și 1 de levănțică.",
  ],
})}
${section(`${eyebrow("Ce pui în difuzor")}
${heading("Arome care umplu casa")}
${productGrid([P.airX, P.abode, P.lavender, P.lemon], k)}
${para(`<strong>P.S.</strong> Până ${UNTIL}, codul <strong>${CODE}</strong> îți aduce 15% reducere la toată comanda — inclusiv la difuzoare.`, { color: c.muted, size: 14, margin: "0" })}`)}`,
  },
];

const outDir = path.join(here, "..", MODE);
mkdirSync(outDir, { recursive: true });
for (const n of newsletters) {
  const html = layout({ ...n, body: n.body(n.campaign) });
  writeFileSync(path.join(outDir, `${n.file}.html`), html);
}
writeFileSync(
  path.join(outDir, "subiecte.txt"),
  newsletters.map((n) => `${n.file}\n  Subiect: ${n.subject}\n  Preheader: ${n.preheader}\n`).join("\n"),
);
console.log(`${newsletters.length} newsletters → ${outDir}`);
