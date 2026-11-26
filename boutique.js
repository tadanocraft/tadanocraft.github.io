"use strict";

/* ==========================================================================
   1. BLOC DE CONFIGURATION DE LA BOUTIQUE
   ========================================================================== */
const CONFIG_BOUTIQUE = {
  // 1. Lien CSV de ton onglet "Catalogue" Google Sheets (Fichier > Partager > Publier sur le web > CSV)
  urlCatalogueCSV: "",

  // 2. Ton lien PayPal Business (ou lien de paiement par défaut)
  lienPayPal: "https://paypal.me/tadanocraft",

  // 3. Ton IBAN professionnel
  iban: "BE00 0000 0000 0000",
};

// Catalogue de démonstration affiché tant que urlCatalogueCSV est vide
const PRODUITS_DEMONSTRATION = [
  {
    nom: "Porte-clés Tadano Craft",
    categorie: "Accessoires",
    prix: "8,00 €",
    image: "media/images/realisations/Tadano-Craft_Porte-cle.webp",
    description:
      "Porte-clés double couleur imprimé en 3D haute précision avec finition bordeaux et noir.",
    options: "Bordeaux & Noir, Noir & Blanc, Sur demande",
    delai: "2 à 3 jours",
    statut: "Impression sur commande",
    lien_paiement: "",
  },
  {
    nom: "Boîte de Rangement Refermable",
    categorie: "Objets 3D",
    prix: "16,00 €",
    image: "media/images/realisations/boite-refermable.webp",
    description:
      "Boîte compartimentée robuste avec couvercle coulissant, idéale pour atelier ou bureau.",
    options: "Noir mat, Gris anthracite, Bordeaux",
    delai: "3 à 5 jours",
    statut: "Impression sur commande",
    lien_paiement: "",
  },
  {
    nom: "Plaque Déco Print My Car",
    categorie: "Auto / Moto",
    prix: "24,00 €",
    image: "media/images/realisations/Print-my-car.webp",
    description:
      "Silhouette automobile en relief imprimée en 3D pour passionnés et décoration murale.",
    options: "Noir mat, Rouge bordeaux, Blanc",
    delai: "3 à 5 jours",
    statut: "En stock",
    lien_paiement: "",
  },
  {
    nom: "T-shirt Atelier Tadano Craft",
    categorie: "T-shirts",
    prix: "25,00 €",
    image: "media/images/realisations/Pierret_Camionette.webp",
    description:
      "T-shirt coton épais marqué à la presse à chaud dans notre atelier à Charleroi.",
    options: "Taille S, Taille M, Taille L, Taille XL",
    delai: "3 à 5 jours",
    statut: "Stock faible",
    lien_paiement: "",
  },
];

/* ==========================================================================
   2. UTILITAIRES CSV & STATUTS DE STOCK
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
   3. RENDU DU CATALOGUE, FILTRES & COMMANDE
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
    const priceInput = document.getElementById("orderProductPrice");
    const stripeInput = document.getElementById("orderStripeUrl");
    const optionSelect = document.getElementById("orderOption");
    const successBox = document.getElementById("orderSuccessBox");

    if (successBox) successBox.hidden = true;
    if (summaryEl) {
      summaryEl.textContent = `${product.nom} • ${product.prix} (${product.statut || "Impression sur commande"})`;
    }
    if (nameInput) nameInput.value = product.nom;
    if (priceInput) priceInput.value = product.prix;
    if (stripeInput) stripeInput.value = product.lien_paiement || "";

    if (optionSelect) {
      const opts = (product.options || "Standard")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      optionSelect.innerHTML = "";
      opts.forEach((opt) => {
        const el = document.createElement("option");
        el.value = opt;
        el.textContent = opt;
        optionSelect.appendChild(el);
      });
    }

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
            <span>Retrait Charleroi / Envoi</span>
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

  // Envoi du formulaire de commande vers Google Apps Script
  const orderForm = document.getElementById("orderForm");
  if (orderForm) {
    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById("orderSubmitBtn");
      const successBox = document.getElementById("orderSuccessBox");
      const successDetail = document.getElementById("orderSuccessDetail");
      const onlinePayLink = document.getElementById("orderOnlinePayLink");
      const originalText = submitBtn.textContent;

      const formData = new FormData(this);
      const paymentMode = formData.get("paiement") || "";
      const stripeUrl = formData.get("stripe_url") || "";
      const orderRef = "TC-" + Math.floor(1000 + Math.random() * 9000);
      formData.append("reference", orderRef);

      const scriptUrl = window.STUDIO_CONFIG
        ? window.STUDIO_CONFIG.urlGoogleScript
        : "";

      submitBtn.textContent = "Validation en cours...";
      submitBtn.disabled = true;

      fetch(scriptUrl, {
        method: "POST",
        body: formData,
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
              successDetail.textContent = `Référence ${orderRef}. Nous lançons la fabrication à l'atelier ! Vous réglerez lors du retrait ou de la livraison (espèces ou Wero Pro).`;
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
