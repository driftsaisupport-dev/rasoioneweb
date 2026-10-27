# Put rasoione.shop live on Vercel (free)

The website is plain files in this `website/` folder — no build step, no server, no database.

## 1. Put the app files on Google Drive
1. Upload `RasoiOne-5.0.0.apk`, `RasoiOne-Setup-5.0.0.exe` and `RasoiOne-5.0.0-mac.dmg` to a Drive folder.
2. For each file: right-click → **Share** → General access **Anyone with the link** (Viewer) → **Copy link**.
3. Paste each link into `config.js` → `downloads.android.drive`, `.windows.drive`, `.mac.drive`.
   Update `version`, `updated` and the sizes too. A file left empty shows "Coming soon".

Drive shows a "can't scan this file for viruses" page for files over about 100 MB; visitors tap
**Download anyway** (the install steps on the page say so). For a new version, use Drive's
**Manage versions → Upload new version** on the same file and the link stays the same.

## 2. Deploy
**Easiest (GitHub):** push the repo to GitHub → vercel.com → **Add New → Project** → import the repo →
**Root Directory: `website`**, Framework preset **Other**, leave Build Command and Output Directory empty → **Deploy**.
Every push to `main` redeploys by itself.

**Or from your computer:** `npm i -g vercel`, then inside `website/` run `vercel` (first time) and `vercel --prod`.

## 3. Connect rasoione.shop
Vercel project → **Settings → Domains** → add `rasoione.shop` and `www.rasoione.shop`.
At your domain registrar set the DNS records Vercel shows (usually an **A** record `@ → 76.76.21.21`
and a **CNAME** `www → cname.vercel-dns.com`). HTTPS is automatic.


this is apk link:
(https://drive.google.com/file/d/15Pp_7aFMs1g_Bgz-HdpwuUzLB-QJlrwh/view?usp=sharing)
this is mac app
(https://drive.google.com/file/d/1Tc2_Hzwurn-O91nxr808AjphQdAJNfNB/view?usp=sharing)
this is windows app
(https://drive.google.com/file/d/1tnvwy6Zc45zKJLAbP_E0j9f2b_9b_7N8/view?usp=sharing)

## Keep working
- `/m/` is the table-QR menu page that printed QR codes open — never delete or rename it.
- `/buy.html` needs `licenseApi` in `config.js` (your Apps Script `/exec` URL).
- Legal pages are generated: edit `src/legal.js`, then run `node website/build.mjs` from the project root.
- `rasoione.shop/download` and `/apk` jump straight to the downloads.
