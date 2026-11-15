/* ==========================================================================
   PanaLink — versión y enlace de descarga SIEMPRE al día (auto-actualizable)
   --------------------------------------------------------------------------
   Lee la fuente de verdad del canal OTA (el mismo manifest.json que consulta
   la app) y rellena los datos de la última release publicada, sin volver a
   tocar el HTML. Así la web NO se queda desfasada cada vez que sale versión.

   Rellena, por atributo data-rel:
     versionName  -> p. ej. "v1.4.17"
     apkUrl       -> href del botón de descarga (y descarga directa)
     sha256       -> huella SHA-256 del APK
     apkName      -> nombre del archivo (Panalink-vX.Y.Z.apk)
     size         -> tamaño del APK en MB (se pide a la API de GitHub)

   Los valores escritos en el HTML quedan como RESPALDO: si el fetch falla
   (sin red, límite de la API...), la página sigue mostrando la última versión
   conocida en vez de quedarse en blanco.
   ========================================================================== */
(function () {
  "use strict";

  var MANIFEST = "https://raw.githubusercontent.com/Andresaguiar22/panalink-ota/main/manifest.json";
  var API = "https://api.github.com/repos/Andresaguiar22/panalink-ota/releases/latest";

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

  function sizeLabel(bytes) {
    if (!bytes) return "";
    return "~" + Math.floor(bytes / 1048576) + " MB";
  }

  // Cache-buster: el CDN de raw.githubusercontent tarda unos minutos en
  // propagar el manifest nuevo; con esto siempre se lee la última publicación.
  var manifestUrl = MANIFEST + "?t=" + Date.now();

  fetch(manifestUrl, { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("manifest " + r.status); return r.json(); })
    .then(function (m) {
      setText('[data-rel="versionName"]', m.versionName);
      setHref('[data-rel="apkUrl"]', m.downloadUrl);
      setText('[data-rel="sha256"]', m.sha256);
      if (m.downloadUrl) setText('[data-rel="apkName"]', m.downloadUrl.split("/").pop());
    })
    .catch(function () { /* se conserva el respaldo del HTML */ });

  fetch(API, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("api " + r.status); return r.json(); })
    .then(function (rel) {
      var assets = rel.assets || [];
      for (var i = 0; i < assets.length; i++) {
        if (/\.apk$/i.test(assets[i].name)) { setText('[data-rel="size"]', sizeLabel(assets[i].size)); break; }
      }
    })
    .catch(function () { /* el tamaño es cosmético: no rompe nada si falla */ });
})();
