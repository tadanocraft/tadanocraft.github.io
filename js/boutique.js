"use strict";

/* ==========================================================================
   1. CONFIGURATION DE LA BOUTIQUE & DICTIONNAIRE DES COULEURS
   ========================================================================== */
const CONFIG_BOUTIQUE = {
  // 1. Lien CSV de ton onglet "Catalogue" Google Sheets
  urlCatalogueCSV:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-tlASqtvlqmNIfn_PnLSI2oXvD2Yb2HPO1BfBeDzRnc4DpYH_rviigkV74Tel_hVjQ31IhJgbIzU5/pub?output=csv",

  // 2. Ton lien PayPal Business (ou lien de paiement par défaut)
  lienPayPal: "https://paypal.me/tadanocraft",

  // 3. Ton IBAN professionnel
  iban: "BE00 0000 0000 0000",
};

// Ajoute ou modifie tes couleurs de filaments ici (en minuscules, sans accents)
const COULEURS_FILAMENTS = {
  bordeaux: "#7f2b3f",
  "rouge bordeaux": "#7f2b3f",
  noir: "#18181b",
  "noir mat": "#1f1f23",
  blanc: "#f4f4f5",
  "gris anthracite": "#3f3f46",
  gris: "#71717a",
  argent: "#a1a1aa",
  rouge: "#dc2626",
  bleu: "#2563eb",
  "bleu marine": "#1e3a8a",
  vert: "#16a34a",
  jaune: "#eab308",
  orange: "#ea580c",
  or: "#d4af37",
  rose: "#ec4899",
  violet: "#7c3aed",
  transparent:
    "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.12))",
};

// Catalogue de secours (affiché uniquement si Google Sheets est inaccessible)
const PRODUITS_DEMONSTRATION = [
  {
    nom: "Porte-clés Tadano Craft",
    categorie: "Accessoires",
    prix: "8,00 €",
    image: "media/images/realisations/Tadano-Craft_Porte-cle.webp",
    description:
      "Porte-clés double couleur imprimé en 3D haute précision avec finition bordeaux et noir.",
    options: "Bordeaux & Noir, Noir & Blanc",
    delai: "2 à 3 jours",
    statut: "Impression sur commande",
    lien_paiement: "",
    quantite_max: "20",
  },
  {
    nom: "Boîte de Rangement Refermable",
    categorie: "Objets 3D",
    prix: "16,00 €",
    image: "media/images/realisations/boite-refermable.webp",
    description:
      "Boîte compartimentée robuste avec couvercle coulissant, idéale pour bureau ou rangement.",
    options: "Noir mat, Gris anthracite, Bordeaux",
    delai: "3 à 5 jours",
    statut: "Impression sur commande",
    lien_paiement: "",
    quantite_max: "5",
  },
  {
    nom: "Plaque Déco Print My Car",
    categorie: "Auto / Moto",
    prix: "24,00 €",
    image: "media/images/realisations/Print-my-car.webp",
    description:
      "Silhouette automobile en relief imprimée en 3D pour passionnés et décoration murale.",
    options: "", // Produit à couleur fixe
    delai: "3 à 5 jours",
    statut: "En stock",
    lien_paiement: "",
    quantite_max: "3",
  },
];

/* ==========================================================================
   2. UTILITAIRES COULEURS, PRIX & CSV
   ========================================================================== */
function resolveAssetPath(path) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("../") ||
    path.startsWith("/")
  ) {
    return path;
  }
  return window.location.pathname.includes("/pages/") ? `../${path}` : path;
}

function getSwatchColor(label) {
  const clean = String(label || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (COULEURS_FILAMENTS[clean]) return COULEURS_FILAMENTS[clean];

  // Gestion automatique des couleurs doubles (ex: "Bordeaux & Noir")
  if (clean.includes("&") || clean.includes("/")) {
    const parts = clean.split(/[&/]/).map((p) => p.trim());
    const c1 = COULEURS_FILAMENTS[parts[0]];
    const c2 = COULEURS_FILAMENTS[parts[1]];
    if (c1 && c2) {
      return `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`;
    }
  }

  for (const key of Object.keys(COULEURS_FILAMENTS)) {
    if (clean.includes(key)) return COULEURS_FILAMENTS[key];
  }
  return null;
}

function parsePriceToNumber(priceStr) {
  if (!priceStr) return 0;
  const cleaned = String(priceStr)
    .replace(/[^0-9,.-]/g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

function formatEuro(amount) {
  return amount.toFixed(2).replace(".", ",") + " €";
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let val = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        val += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        val += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(val.trim());
        val = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        if (char === "\r") i++;
        row.push(val.trim());
        if (row.some((cell) => cell !== "")) rows.push(row);
        row = [];
        val = "";
      } else {
        val += char;
      }
    }
  }
  if (val !== "" || row.length > 0) {
    row.push(val.trim());
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_"),
  );

  return rows.slice(1).map((cells) => {
    const item = {};
    headers.forEach((header, idx) => {
      item[header] = cells[idx] || "";
    });
    return item;
  });
}

function getStockBadgeConfig(statutRaw) {
  const s = (statutRaw || "").toLowerCase();
  if (s.includes("rupture")) {
    return {
      label: "Rupture de stock",
      className: "product-badge--out",
      disabled: true,
    };
  }
  if (s.includes("faible")) {
    return {
      label: "Stock faible",
      className: "product-badge--low",
      disabled: false,
    };
  }
  if (s.includes("stock") || s.includes("beaucoup")) {
    return {
      label: "En stock",
      className: "product-badge--instock",
      disabled: false,
    };
  }
  return {
    label: statutRaw || "Impression sur commande",
    className: "product-badge--order",
    disabled: false,
  };
}

/* ==========================================================================
   3. RENDU DU CATALOGUE, PASTILLES COULEUR & COMMANDE
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const shopGrid = document.getElementById("shopProductsGrid");
  const shopFilters = document.getElementById("shopCategoryFilters");
  const shopSearch = document.getElementById("shopSearchInput");
  const shopEmpty = document.getElementById("shopEmptyState");

  if (!shopGrid || !shopFilters) return;

  let allProducts = [];
  let activeCategory = "Tous";
  let searchQuery = "";

  // Valeurs temporaires mises à jour automatiquement dès qu'on clique sur un produit
  let currentUnitPrice = 0;
  let currentMaxQty = 10;

  const qtyInput = document.getElementById("orderQty");
  const deliverySelect = document.getElementById("orderDelivery");
  const subtotalEl = document.getElementById("orderSubtotal");
  const shippingFeeEl = document.getElementById("orderShippingFee");
  const grandTotalEl = document.getElementById("orderGrandTotal");
  const priceInput = document.getElementById("orderProductPrice");

  function updateOrderTotals() {
    let qty = parseInt(qtyInput?.value || "1", 10) || 1;
    if (qty < 1) qty = 1;
    if (qty > currentMaxQty) {
      qty = currentMaxQty;
      if (qtyInput) qtyInput.value = String(currentMaxQty);
    }

    const selectedOpt = deliverySelect?.options[deliverySelect.selectedIndex];
    const shippingFee = selectedOpt
      ? parseFloat(selectedOpt.dataset.fee || "0")
      : 0;

    const subtotal = currentUnitPrice * qty;
    const total = subtotal + shippingFee;

    if (subtotalEl) subtotalEl.textContent = formatEuro(subtotal);
    if (shippingFeeEl) shippingFeeEl.textContent = formatEuro(shippingFee);
    if (grandTotalEl) grandTotalEl.textContent = formatEuro(total);

    if (priceInput) {
      priceInput.value = `${formatEuro(currentUnitPrice)} (Total : ${formatEuro(total)})`;
    }
  }

  if (qtyInput) qtyInput.addEventListener("input", updateOrderTotals);
  if (deliverySelect)
    deliverySelect.addEventListener("change", updateOrderTotals);

  function renderShopCategories(products) {
    const categories = [
      "Tous",
      ...new Set(products.map((p) => p.categorie).filter(Boolean)),
    ];
    shopFilters.innerHTML = "";
    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "shop-filter-pill" + (cat === activeCategory ? " is-active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        activeCategory = cat;
        shopFilters
          .querySelectorAll(".shop-filter-pill")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        renderShopProducts();
      });
      shopFilters.appendChild(btn);
    });
  }

  function openOrderForProduct(product) {
    const summaryEl = document.getElementById("orderProductSummary");
    const nameInput = document.getElementById("orderProductName");
    const stripeInput = document.getElementById("orderStripeUrl");
    const optionHiddenInput = document.getElementById("orderOption");
    const swatchContainer = document.getElementById("orderSwatchGrid");
    const fixedOptionEl = document.getElementById("orderFixedOption");
    const maxQtyHint = document.getElementById("orderMaxQtyHint");
    const successBox = document.getElementById("orderSuccessBox");

    // Lecture du prix et de la colonne Quantite_max depuis Google Sheets
    currentUnitPrice = parsePriceToNumber(product.prix);
    const parsedMax = parseInt(product.quantite_max, 10);
    currentMaxQty = !Number.isNaN(parsedMax) && parsedMax > 0 ? parsedMax : 10;

    if (successBox) successBox.hidden = true;
    if (qtyInput) {
      qtyInput.value = "1";
      qtyInput.max = String(currentMaxQty);
    }
    if (maxQtyHint) {
      maxQtyHint.innerHTML = `Maximum ${currentMaxQty} par commande directe. Pour une plus grande quantité, <a href="../index.html#sur-mesure">demandez un devis</a>.`;
    }
    if (summaryEl) {
      summaryEl.textContent = `${product.nom} • ${product.prix} (${product.statut || "Impression sur commande"})`;
    }
    if (nameInput) nameInput.value = product.nom;
    if (stripeInput) stripeInput.value = product.lien_paiement || "";

    // Génération des pastilles de couleur cliquables
    if (swatchContainer && optionHiddenInput && fixedOptionEl) {
      const opts = (product.options || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);

      swatchContainer.innerHTML = "";

      if (opts.length === 0) {
        optionHiddenInput.value = "Couleur d'origine (fixe)";
        swatchContainer.hidden = true;
        fixedOptionEl.hidden = false;
      } else {
        swatchContainer.hidden = false;
        fixedOptionEl.hidden = true;

        opts.forEach((opt, index) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "swatch-btn" + (index === 0 ? " is-selected" : "");

          const colorValue = getSwatchColor(opt);
          if (colorValue) {
            const dot = document.createElement("span");
            dot.className = "swatch-dot";
            dot.style.background = colorValue;
            btn.appendChild(dot);
          }

          const labelSpan = document.createElement("span");
          labelSpan.textContent = opt;
          btn.appendChild(labelSpan);

          btn.addEventListener("click", () => {
            swatchContainer
              .querySelectorAll(".swatch-btn")
              .forEach((b) => b.classList.remove("is-selected"));
            btn.classList.add("is-selected");
            optionHiddenInput.value = opt;
          });

          swatchContainer.appendChild(btn);
        });

        optionHiddenInput.value = opts[0];
      }
    }

    updateOrderTotals();
    window.openModal("modalOrder");
  }

  function renderShopProducts() {
    const filtered = allProducts.filter((p) => {
      const matchCat =
        activeCategory === "Tous" || p.categorie === activeCategory;
      const haystack = `${p.nom} ${p.categorie} ${p.description}`.toLowerCase();
      const matchSearch = haystack.includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    shopGrid.innerHTML = "";
    if (shopEmpty) shopEmpty.hidden = filtered.length > 0;

    filtered.forEach((product) => {
      const badge = getStockBadgeConfig(product.statut);
      const imgSrc = resolveAssetPath(product.image);
      const card = document.createElement("article");
      card.className = "product-card";

      card.innerHTML = `
        <div class="product-card__media" data-lightbox-src="${imgSrc}" role="button" tabindex="0">
          <span class="product-badge ${badge.className}">${badge.label}</span>
          <img src="${imgSrc}" alt="${product.nom} — Tadano Craft" width="800" height="800" loading="lazy" class="product-card__img" />
        </div>
        <div class="product-card__body">
          <div class="product-card__top">
            <span class="product-card__cat">${product.categorie || "Création"}</span>
            <span class="product-card__price">${product.prix}</span>
          </div>
          <h2 class="product-card__title">${product.nom}</h2>
          <p class="product-card__desc">${product.description || ""}</p>
          <div class="product-card__meta">
            <span>Délai : ${product.delai || "3 à 5 jours"}</span>
            <span>Livraison Charleroi / Envoi</span>
          </div>
          <button type="button" class="btn-primary product-card__btn" ${badge.disabled ? "disabled" : ""}>
            ${badge.disabled ? "Indisponible" : "Commander"}
          </button>
        </div>
      `;

      const orderBtn = card.querySelector(".product-card__btn");
      if (orderBtn && !badge.disabled) {
        orderBtn.addEventListener("click", () => openOrderForProduct(product));
      }

      shopGrid.appendChild(card);
    });
  }

  if (shopSearch) {
    shopSearch.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderShopProducts();
    });
  }

  // Chargement du catalogue Google Sheets ou secours local
  if (CONFIG_BOUTIQUE.urlCatalogueCSV) {
    fetch(CONFIG_BOUTIQUE.urlCatalogueCSV)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement Google Sheets");
        return res.text();
      })
      .then((csvText) => {
        const parsed = parseCSV(csvText);
        allProducts = parsed.length > 0 ? parsed : PRODUITS_DEMONSTRATION;
        renderShopCategories(allProducts);
        renderShopProducts();
      })
      .catch(() => {
        allProducts = PRODUITS_DEMONSTRATION;
        renderShopCategories(allProducts);
        renderShopProducts();
      });
  } else {
    allProducts = PRODUITS_DEMONSTRATION;
    renderShopCategories(allProducts);
    renderShopProducts();
  }

  // Validation interactive & envoi de la commande
  const orderForm = document.getElementById("orderForm");
  if (orderForm) {
    const nameInput = document.getElementById("orderName");
    const emailInput = document.getElementById("orderEmail");
    const phoneInput = document.getElementById("orderPhone");
    const addressInput = document.getElementById("orderAddress");

    if (nameInput)
      nameInput.addEventListener("blur", () =>
        window.TadanoValidator.validateName(nameInput),
      );
    if (emailInput)
      emailInput.addEventListener("blur", () =>
        window.TadanoValidator.validateEmail(emailInput),
      );
    if (phoneInput)
      phoneInput.addEventListener("blur", () =>
        window.TadanoValidator.validatePhone(phoneInput, true),
      );
    if (addressInput)
      addressInput.addEventListener("blur", () =>
        window.TadanoValidator.validateText(addressInput, 8),
      );

    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const okName = window.TadanoValidator.validateName(nameInput);
      const okEmail = window.TadanoValidator.validateEmail(emailInput);
      const okPhone = window.TadanoValidator.validatePhone(phoneInput, true);
      const okAddr = window.TadanoValidator.validateText(addressInput, 8);

      if (!okName || !okEmail || !okPhone || !okAddr) return;

      updateOrderTotals();

      const submitBtn = document.getElementById("orderSubmitBtn");
      const successBox = document.getElementById("orderSuccessBox");
      const successDetail = document.getElementById("orderSuccessDetail");
      const onlinePayLink = document.getElementById("orderOnlinePayLink");
      const originalText = submitBtn.textContent;

      const formData = new FormData(this);
      const paymentMode = formData.get("paiement") || "";
      const stripeUrl = formData.get("stripe_url") || "";
      const orderRef = "TC-" + Math.floor(1000 + Math.random() * 9000);

      // Recombine téléphone + adresse dans "coordonnees" pour Google Apps Script
      const phoneVal = (phoneInput?.value || "").trim();
      const addrVal = (addressInput?.value || "").trim();
      formData.set("coordonnees", `Tél : ${phoneVal} | Adresse : ${addrVal}`);
      formData.append("reference", orderRef);

      const scriptUrl = window.STUDIO_CONFIG
        ? window.STUDIO_CONFIG.urlGoogleScript
        : "";

      submitBtn.textContent = "Validation en cours...";
      submitBtn.disabled = true;

      fetch(scriptUrl, {
        method: "POST",
        body: new URLSearchParams(formData),
        mode: "no-cors",
      })
        .then(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;

          if (successBox && successDetail) {
            successBox.hidden = false;
            const isOnline = paymentMode.toLowerCase().includes("en ligne");

            if (isOnline) {
              const targetPayUrl = stripeUrl || CONFIG_BOUTIQUE.lienPayPal;
              successDetail.textContent = `Référence ${orderRef}. La fabrication démarrera dès réception de votre règlement en ligne.`;
              if (onlinePayLink && targetPayUrl) {
                onlinePayLink.href = targetPayUrl;
                onlinePayLink.hidden = false;
              }
            } else {
              successDetail.textContent = `Référence ${orderRef}. Nous lançons la fabrication ! Vous réglerez lors de la livraison (espèces, carte NFC, PayPal ou Lydia).`;
              if (onlinePayLink) onlinePayLink.hidden = true;
            }
          }
        })
        .catch(() => {
          submitBtn.textContent = "Erreur. Réessayez.";
          submitBtn.disabled = false;
          setTimeout(() => {
            submitBtn.textContent = originalText;
          }, 3000);
        });
    });
  }
});
