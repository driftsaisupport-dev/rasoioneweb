/*
 * RasoiOne website settings — the only file you edit. Everything here is public (no secrets).
 * After changing it, push to GitHub (Vercel redeploys by itself) or run `vercel --prod` in /website.
 */
window.RASOI = {
  // Google Apps Script web-app URL of the licence server (ends with /exec). Used by buy.html.
  licenseApi: "https://script.google.com/macros/s/AKfycbxCpzLPvItY9EBJSG9Igotc_Jr8Y7ulsgVXJ97qtH1LH5pOJD_p8sCKfrPBCdZrZd46/exec",
  // Support WhatsApp number: country code + number, digits only (e.g. "919876543210").
  supportWhatsApp: "918446525109",

  /*
   * Downloads from your Google Drive.
   * In Drive: right-click the file → Share → General access: "Anyone with the link" → Copy link,
   * and paste that link below (the whole link, or just the file ID). The site turns it into a
   * direct download. Leave "" and the button shows "Coming soon".
   */
  downloads: {
    version: "5.5.0",
    updated: "20 Oct 2026",
    android: { drive: "https://drive.google.com/file/d/15Pp_7aFMs1g_Bgz-HdpwuUzLB-QJlrwh/view?usp=sharing", size: "≈ 60 MB" },   // RasoiOne-5.5.0.apk
    windows: { drive: "https://drive.google.com/file/d/1tnvwy6Zc45zKJLAbP_E0j9f2b_9b_7N8/view?usp=sharing", size: "≈ 110 MB" },  // RasoiOne-Setup-5.5.0.exe
    mac:     { drive: "https://drive.google.com/file/d/1Tc2_Hzwurn-O91nxr808AjphQdAJNfNB/view?usp=sharing", size: "≈ 220 MB" },  // RasoiOne-5.5.0-mac.dmg
    playStore: "",                             // Play Store link, once the listing is live
  },
};
