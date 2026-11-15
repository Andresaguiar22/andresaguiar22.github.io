/* ==========================================================================
   PanaLink — versión y enlace de descarga SIEMPRE al día (auto-actualizable)
   --------------------------------------------------------------------------
   No hay que tocar el HTML en cada release: este script lee la última
   publicación del canal OTA y rellena los datos solos.

   Fuente primaria: la API de GitHub (releases/latest). GitHub la actualiza
   automáticamente al publicar un release, así que la web se pone al día sola.
   De ahí se obtienen: versión, URL del APK, SHA-256 (asset.digest), tamaño y
   nombre del archivo.

   Respaldo: el manifest.json del canal OTA (raw.githubusercontent), por si la
   API no responde o se agota su límite de peticiones.

   Los valores escritos en el HTML son el último respaldo: si todo falla, la
   página sigue mostrando la última versión conocida en vez de quedarse vacía.

   Rellena, por atributo data-rel:
     versionName  -> p. ej. "v1.4.17"
     apkUrl       -> href del botón de descarga
     sha256       -> huella SHA-256 del APK
     apkName      -> nombre del archivo (Panalink-vX.Y.Z.apk)
     size         -> tamaño del APK en MB
   ========================================================================== */
(function () {
  "use strict";

  var OWNER_REPO = "Andresaguiar22/panalink-ota";
  var API = "https://api.github.com/repos/" + OWNER_REPO + "/releases/latest";
  var MANIFEST = "https://raw.githubusercontent.com/" + OWNER_REPO + "/main/manifest.json";

  function setText(sel, txt) {
    if (!txt) return;
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) els[i].textContent = txt;
  }

  function setHref(sel, url) {
    if (!url) return;
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) els[i].setAttribute("href", url);
  }

  function sizeMB(bytes) {
    return bytes ? "~" + Math.floor(bytes / 1048576) + " MB" : "";
  }

  function apply(d) {
    setText('[data-rel="versionName"]', d.versionName);
    setHref('[data-rel="apkUrl"]', d.downloadUrl);
    setText('[data-rel="sha256"]', d.sha256);
    setText('[data-rel="apkName"]', d.apkName);
    setText('[data-rel="size"]', d.size);
  }

  // --- Fuente primaria: API de GitHub (se actualiza sola al publicar) ---
  fetch(API, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("api " + r.status); return r.json(); })
    .then(function (rel) {
      var apk = null, assets = rel.assets || [];
      for (var i = 0; i < assets.length; i++) {
        if (/\.apk$/i.test(assets[i].name)) { apk = assets[i]; break; }
      }
      if (!apk) throw new Error("sin APK en el release");
      apply({
        versionName: rel.tag_name || rel.name,
        downloadUrl: apk.browser_download_url,
        sha256: (apk.digest || "").replace(/^sha256:/, ""),
        apkName: apk.name,
        size: sizeMB(apk.size)
      });
    })
    .catch(function () {
      // --- Respaldo: manifest.json del canal OTA ---
      return fetch(MANIFEST + "?t=" + Date.now(), { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("manifest " + r.status); return r.json(); })
        .then(function (m) {
          apply({
            versionName: m.versionName,
            downloadUrl: m.downloadUrl,
            sha256: m.sha256,
            apkName: m.downloadUrl ? m.downloadUrl.split("/").pop() : "",
            size: ""
          });
        })
        .catch(function () { /* se conserva el respaldo del HTML */ });
    });
})();
