document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // CONFIG
  // =========================
  const STORAGE_KEY = "postits_v1";              // post-its activos (escritorio)
  const ARCHIVE_KEY = "postits_archivados_v1";   // post-its guardados (carpeta)

  const FONDOS = [
    "fondos/diente de leon.jpg",
    "fondos/ciudad.jpg",
    "fondos/mandala.jpg",
    "fondos/margaritas.jpg",
    "fondos/cielo.jpg",
    "fondos/desierto.jpg"
  ];

  // Resize (derecha + abajo)
  const BORDE = 10;
  const MIN_W = 200, MAX_W = 800;
  const MIN_H = 180, MAX_H = 800;

  const logoBtn = document.querySelector(".logo-accion-principal");
  const plantilla = document.querySelector(".post-it");
  if (!logoBtn || !plantilla) return;

  // =========================
  // UI CARPETA (usa tus ids existentes en HTML)
  // Requiere en tu HTML:
  // #carpeta, #panel-carpeta, #lista-carpeta, #cerrar-carpeta
  // =========================
  const carpetaBtn = document.getElementById("carpeta");
  const panelCarpeta = document.getElementById("panel-carpeta");
  const listaCarpeta = document.getElementById("lista-carpeta");
  const cerrarCarpetaBtn = document.getElementById("cerrar-carpeta");

  const loadJSON = (k, fallback) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));

  function renderCarpeta() {
    if (!listaCarpeta) return;

    const data = loadJSON(ARCHIVE_KEY, []);
    if (!data.length) {
      listaCarpeta.innerHTML = "<small>No hay post-its guardados.</small>";
      return;
    }

    listaCarpeta.innerHTML = data.map((p, i) => `
      <div class="item-carpeta" data-i="${i}">
        <strong>${esc(p.titulo || "Sin título")}</strong><br>
        <small>${esc(p.texto || "").slice(0, 160)}</small>

        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
          <button class="abrir-guardado">Abrir</button>
          <button class="eliminar-guardado">Eliminar</button>
        </div>
      </div>
    `).join("");
  }

  if (carpetaBtn && panelCarpeta) {
    carpetaBtn.addEventListener("click", () => {
      panelCarpeta.classList.toggle("abierta");
      if (panelCarpeta.classList.contains("abierta")) renderCarpeta();
    });
  }

  if (cerrarCarpetaBtn && panelCarpeta) {
    cerrarCarpetaBtn.addEventListener("click", () => {
      panelCarpeta.classList.remove("abierta");
    });
  }

  // =========================
  // CONTENEDOR POST-ITS (sin tocar HTML)
  // =========================
  const padreOriginal = plantilla.parentNode;
  const contenedor = document.createElement("div");
  contenedor.className = "postits-wrapper";
  padreOriginal.insertBefore(contenedor, plantilla);

  // Plantilla oculta
  plantilla.style.display = "none";

  // =========================
  // GUARDAR / CARGAR ACTIVOS
  // =========================
  function snapshotPostIt(p) {
    const titulo = p.querySelector(".title")?.value ?? "";
    const texto = p.querySelector(".contenido-postit")?.value ?? "";
    const imgSrc = p.querySelector(".imagenes-fondos")?.getAttribute("src") ?? FONDOS[0];

    let fondoIndex = p.dataset.fondoIndex;
    if (fondoIndex == null) {
      const idx = FONDOS.indexOf(imgSrc);
      fondoIndex = String(idx >= 0 ? idx : 0);
    }

    // Guardamos también si el modo lista está activo en ese post-it
    const modoLista = p.dataset.modoLista === "1" ? "1" : "0";

    return {
      titulo,
      texto,
      imgSrc,
      fondoIndex,
      modoLista,
      left: p.style.left || null,
      top: p.style.top || null,
      width: p.style.width || null,
      height: p.style.height || null,
      position: p.style.position || null,
    };
  }

  function guardarActivos() {
    const postits = [...contenedor.querySelectorAll(".post-it")];
    saveJSON(STORAGE_KEY, postits.map(snapshotPostIt));
  }

  let saveTimer = null;
  function guardarDebounced() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(guardarActivos, 250);
  }

  function crearPostIt(desdeData = null) {
    const nuevo = plantilla.cloneNode(true);
    nuevo.style.display = "flex";

    const tituloEl = nuevo.querySelector(".title");
    const textoEl = nuevo.querySelector(".contenido-postit");
    const imgEl = nuevo.querySelector(".imagenes-fondos");

    if (tituloEl) tituloEl.value = desdeData?.titulo ?? "";
    if (textoEl) textoEl.value = desdeData?.texto ?? "";

    const src = desdeData?.imgSrc ?? FONDOS[0];
    if (imgEl) imgEl.setAttribute("src", src);

    const idx = desdeData?.fondoIndex ?? String(Math.max(0, FONDOS.indexOf(src)));
    nuevo.dataset.fondoIndex = idx;

    // Restaurar modo lista si venía guardado
    nuevo.dataset.modoLista = (desdeData?.modoLista === "1") ? "1" : "0";

    if (desdeData?.position) nuevo.style.position = desdeData.position;
    if (desdeData?.left) nuevo.style.left = desdeData.left;
    if (desdeData?.top) nuevo.style.top = desdeData.top;
    if (desdeData?.width) nuevo.style.width = desdeData.width;
    if (desdeData?.height) nuevo.style.height = desdeData.height;

    if ((desdeData?.left || desdeData?.top) && !nuevo.style.position) {
      nuevo.style.position = "absolute";
    }

    contenedor.appendChild(nuevo);
    guardarDebounced();
    return nuevo;
  }

  // Cargar activos al iniciar
  const activos = loadJSON(STORAGE_KEY, []);
  if (Array.isArray(activos)) activos.forEach(crearPostIt);

  // =========================
  // BOTÓN LOGO CREA POST-IT
  // =========================
  logoBtn.addEventListener("click", () => crearPostIt());

  // =========================
  // HOVER BOTONES (igual que tu código)
  // =========================
  contenedor.addEventListener("mouseover", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.classList.contains("abrir-mas-postit")) btn.style.backgroundColor = "#f5a3a3";
    if (btn.classList.contains("cambio-fondo")) btn.style.backgroundColor = "#f5a3a3";
    if (btn.classList.contains("cerrar-postit")) btn.style.backgroundColor = "#f5a3a3";
    if (btn.classList.contains("guardar-postit")) btn.style.backgroundColor = "#f5a3a3";
    if (btn.classList.contains("crear-lista")) btn.style.backgroundColor = "#f5a3a3";
  });

  contenedor.addEventListener("mouseout", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    btn.style.backgroundColor = "transparent";
  });

  // =========================
  // HELPERS MODO LISTA (VIÑETAS)
  // =========================
  const BULLET = "• ";

  function activarModoLista(postit) {
    postit.dataset.modoLista = "1";
    const ta = postit.querySelector(".contenido-postit");
    if (!ta) return;

    // Si está vacío, inicia con viñeta. Si no, asegura viñeta al inicio.
    if (ta.value.trim().length === 0) {
      ta.value = BULLET;
    } else {
      // Si NO empieza con viñeta en la primera línea, la agrega.
      if (!ta.value.startsWith(BULLET) && !ta.value.startsWith("•\t") && !ta.value.startsWith("•")) {
        ta.value = BULLET + ta.value;
      }
    }
  }

  function desactivarModoLista(postit) {
    postit.dataset.modoLista = "0";
    const ta = postit.querySelector(".contenido-postit");
    if (!ta) return;

    // Quita viñetas al inicio de cada línea
    ta.value = ta.value.replace(/^(?:•\s*)/gm, "");
  }

  function toggleModoLista(postit) {
    const activo = postit.dataset.modoLista === "1";
    if (activo) desactivarModoLista(postit);
    else activarModoLista(postit);
  }

  // =========================
  // SELECTOR DE FONDOS (SIN TOCAR CSS/HTML)
  // =========================
  function cerrarSelectorFondos(postit) {
    const sel = postit.querySelector(".selector-fondos-inline");
    if (sel) sel.remove();
  }

  function abrirSelectorFondos(postit) {
    // Toggle: si ya está abierto, lo cierra
    const existente = postit.querySelector(".selector-fondos-inline");
    if (existente) {
      existente.remove();
      return;
    }

    // Cierra cualquier selector abierto en otros post-its
    document.querySelectorAll(".selector-fondos-inline").forEach(el => el.remove());

    const selector = document.createElement("div");
    selector.className = "selector-fondos-inline";

    // Estilos inline para NO depender de CSS
    Object.assign(selector.style, {
      position: "absolute",
      top: "38px",          // debajo del menú superior
      right: "6px",
      width: "170px",
      maxHeight: "220px",
      overflow: "auto",
      background: "white",
      border: "2px solid black",
      borderRadius: "10px",
      padding: "8px",
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      zIndex: "99999",
      boxShadow: "0 10px 25px rgba(0,0,0,.25)"
    });

    // Para que el absolute se posicione respecto al post-it
    // (si ya tienes position absolute/relative no molesta)
    if (!postit.style.position) postit.style.position = "relative";

    const actualSrc = postit.querySelector(".imagenes-fondos")?.getAttribute("src") || "";

    FONDOS.forEach((src, index) => {
      const thumb = document.createElement("img");
      thumb.src = src;
      thumb.alt = "fondo";
      Object.assign(thumb.style, {
        width: "48px",
        height: "48px",
        objectFit: "cover",
        cursor: "pointer",
        borderRadius: "8px",
        border: (src === actualSrc) ? "2px solid #000" : "2px solid transparent"
      });

      thumb.addEventListener("mouseenter", () => {
        thumb.style.border = "2px solid #f5a3a3";
      });
      thumb.addEventListener("mouseleave", () => {
        thumb.style.border = (src === actualSrc) ? "2px solid #000" : "2px solid transparent";
      });

      thumb.addEventListener("click", (ev) => {
        ev.stopPropagation();

        const imgPrincipal = postit.querySelector(".imagenes-fondos");
        if (!imgPrincipal) return;

        imgPrincipal.setAttribute("src", src);
        postit.dataset.fondoIndex = String(index);

        selector.remove();
        guardarDebounced();
      });

      selector.appendChild(thumb);
    });

    postit.appendChild(selector);
  }

  // Cerrar selector al hacer click fuera
  document.addEventListener("click", (e) => {
    const abierto = document.querySelector(".selector-fondos-inline");
    if (!abierto) return;

    // Si haces click dentro del selector o en el botón cambio-fondo, no cierres aquí
    if (e.target.closest(".selector-fondos-inline")) return;
    if (e.target.closest(".cambio-fondo")) return;

    abierto.remove();
  });

  // =========================
  // CLICK BOTONES (delegación)
  // =========================
  contenedor.addEventListener("click", (e) => {
    const postit = e.target.closest(".post-it");
    if (!postit) return;

    const btnGuardar = e.target.closest(".guardar-postit");
    const btnAbrir = e.target.closest(".abrir-mas-postit");
    const btnFondo = e.target.closest(".cambio-fondo");
    const btnCerrar = e.target.closest(".cerrar-postit");
    const btnLista  = e.target.closest(".crear-lista"); // ✅ NUEVO

    // 🟢 LISTA: toggle viñetas
    if (btnLista) {
      const textarea = postit.querySelector(".contenido-postit");
      toggleModoLista(postit);

      if (textarea) textarea.focus();
      guardarDebounced();
      return;
    }

    // 💾 guardar en carpeta (archivar)
    if (btnGuardar) {
      const snap = snapshotPostIt(postit);

      const data = loadJSON(ARCHIVE_KEY, []);
      data.unshift({ ...snap, fecha: Date.now() });
      saveJSON(ARCHIVE_KEY, data);

      // Si había selector abierto, ciérralo
      cerrarSelectorFondos(postit);

      postit.remove();
      guardarDebounced();

      if (panelCarpeta?.classList.contains("abierta")) renderCarpeta();
      return;
    }

    // ➕ crear nuevo
    if (btnAbrir) {
      crearPostIt();
      return;
    }

    // 🎨 cambiar fondo (AHORA ABRE SELECTOR)
    if (btnFondo) {
      // evita que el click global cierre inmediatamente
      e.stopPropagation();
      abrirSelectorFondos(postit);
      return;
    }

    // ❌ cerrar
    if (btnCerrar) {
      e.preventDefault();

      // Si había selector abierto, ciérralo
      cerrarSelectorFondos(postit);

      postit.classList.add("closing");

      const borrar = () => {
        postit.remove();
        guardarDebounced();
      };

      postit.addEventListener("transitionend", borrar, { once: true });
      setTimeout(() => {
        if (document.body.contains(postit)) borrar();
      }, 250);
    }
  });

  // =========================
  // ABRIR / ELIMINAR dentro de la carpeta
  // =========================
  if (listaCarpeta) {
    listaCarpeta.addEventListener("click", (e) => {
      const card = e.target.closest(".item-carpeta");
      if (!card) return;

      const i = Number(card.dataset.i);
      const data = loadJSON(ARCHIVE_KEY, []);
      const item = data[i];
      if (!item) return;

      // Abrir (restaurar al escritorio)
      if (e.target.closest(".abrir-guardado")) {
        crearPostIt(item);
        data.splice(i, 1);          // quítalo de la carpeta (mover)
        saveJSON(ARCHIVE_KEY, data);
        renderCarpeta();
        return;
      }

      // Eliminar
      if (e.target.closest(".eliminar-guardado")) {
        data.splice(i, 1);
        saveJSON(ARCHIVE_KEY, data);
        renderCarpeta();
      }
    });
  }

  // =========================
  // ESCRITURA: guardar automático
  // =========================
  contenedor.addEventListener("input", (e) => {
    if (e.target.closest(".post-it")) guardarDebounced();
  });

  // =========================
  // MODO LISTA: Enter agrega nueva viñeta (por post-it)
  // =========================
  contenedor.addEventListener("keydown", (e) => {
    const ta = e.target.closest(".contenido-postit");
    if (!ta) return;

    const postit = e.target.closest(".post-it");
    if (!postit) return;

    if (postit.dataset.modoLista !== "1") return;

    // ENTER => nueva línea con viñeta
    if (e.key === "Enter") {
      e.preventDefault();

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value;

      ta.value =
        value.substring(0, start) +
        "\n" + BULLET +
        value.substring(end);

      const newPos = start + 1 + BULLET.length;
      ta.selectionStart = ta.selectionEnd = newPos;

      guardarDebounced();
    }
  });

  // =========================
  // ARRASTRAR (MOVER)
  // =========================
  let arrastrando = null;
  let offsetX = 0;
  let offsetY = 0;

  contenedor.addEventListener("mousedown", (e) => {
    const postit = e.target.closest(".post-it");
    if (!postit) return;

    if (e.target.closest("button") || e.target.closest("textarea")) return;
    if (postit.dataset.resizing === "1") return;

    // Si haces mousedown en el selector, no arrastres
    if (e.target.closest(".selector-fondos-inline")) return;

    // Si hay selector abierto, lo cierro al empezar a mover
    cerrarSelectorFondos(postit);

    arrastrando = postit;
    arrastrando.style.position = "absolute";
    arrastrando.style.zIndex = String(Date.now());

    const rect = arrastrando.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!arrastrando) return;

    arrastrando.style.left = `${e.clientX - offsetX}px`;
    arrastrando.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", () => {
    if (!arrastrando) return;
    arrastrando = null;
    guardarDebounced();
  });

  // =========================
  // REDIMENSIONAR (derecha + abajo)
  // =========================
  let resizePostit = null;
  let resizeModo = null; // "right" | "bottom" | "corner"
  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;

  contenedor.addEventListener("mousemove", (e) => {
    if (resizePostit) return;

    const postit = e.target.closest(".post-it");
    if (!postit) {
      document.body.style.cursor = "";
      return;
    }

    // Si estás encima del selector, no cambies cursor de resize
    if (e.target.closest(".selector-fondos-inline")) {
      document.body.style.cursor = "";
      return;
    }

    if (e.target.closest("button") || e.target.closest("textarea")) {
      document.body.style.cursor = "";
      return;
    }

    const rect = postit.getBoundingClientRect();
    const cercaDerecha = rect.right - e.clientX <= BORDE;
    const cercaAbajo = rect.bottom - e.clientY <= BORDE;

    if (cercaDerecha && cercaAbajo) document.body.style.cursor = "nwse-resize";
    else if (cercaDerecha) document.body.style.cursor = "ew-resize";
    else if (cercaAbajo) document.body.style.cursor = "ns-resize";
    else document.body.style.cursor = "";
  });

  contenedor.addEventListener("mousedown", (e) => {
    const postit = e.target.closest(".post-it");
    if (!postit) return;

    // Si haces mousedown en el selector, no redimensiones
    if (e.target.closest(".selector-fondos-inline")) return;

    if (e.target.closest("button") || e.target.closest("textarea")) return;

    const rect = postit.getBoundingClientRect();
    const cercaDerecha = rect.right - e.clientX <= BORDE;
    const cercaAbajo = rect.bottom - e.clientY <= BORDE;
    if (!cercaDerecha && !cercaAbajo) return;

    e.preventDefault();

    // Si hay selector abierto, lo cierro al empezar a redimensionar
    cerrarSelectorFondos(postit);

    resizePostit = postit;
    if (cercaDerecha && cercaAbajo) resizeModo = "corner";
    else if (cercaDerecha) resizeModo = "right";
    else resizeModo = "bottom";

    startX = e.clientX;
    startY = e.clientY;
    startW = rect.width;
    startH = rect.height;

    resizePostit.style.position = "absolute";
    resizePostit.style.zIndex = String(Date.now());
    resizePostit.dataset.resizing = "1";
  });

  document.addEventListener("mousemove", (e) => {
    if (!resizePostit) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (resizeModo === "right" || resizeModo === "corner") {
      let newW = startW + dx;
      newW = Math.max(MIN_W, Math.min(MAX_W, newW));
      resizePostit.style.width = `${newW}px`;
    }

    if (resizeModo === "bottom" || resizeModo === "corner") {
      let newH = startH + dy;
      newH = Math.max(MIN_H, Math.min(MAX_H, newH));
      resizePostit.style.height = `${newH}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    if (!resizePostit) return;

    resizePostit.dataset.resizing = "0";
    resizePostit = null;
    resizeModo = null;
    document.body.style.cursor = "";

    guardarDebounced();
  });

  // guarda al salir
  window.addEventListener("beforeunload", () => guardarActivos());
});
