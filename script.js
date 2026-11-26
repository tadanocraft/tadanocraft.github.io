"use strict";

/* ==========================================================================
   1. CONFIGURATION DE LA BOUTIQUE (GOOGLE SHEETS & PAIEMENT EN LIGNE)
   ========================================================================== */
// Colle ici l'URL CSV publiée depuis Google Sheets (Fichier > Partager > Publier sur le web > Format CSV)
const GOOGLE_SHEETS_CSV_URL = "";

// Ton lien PayPal Business (ex: "https://paypal.me/tadanocraft") pour le paiement en ligne par défaut
const PAYPAL_BUSINESS_URL = "https://paypal.me/tadanocraft";

// URL Google Apps Script pour recevoir les demandes de devis et les commandes
const GOOGLE_SCRIPT_URL = "VOTRE_URL_GOOGLE_SCRIPT_ICI";

// Catalogue de démonstration affiché tant que GOOGLE_SHEETS_CSV_URL est vide
const DEFAULT_SHOP_PRODUCTS = [
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

// Résout automatiquement le chemin d'image quand la page est dans /pages/
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

/* ==========================================================================
   2. GESTION DES MODALES & ZOOM PHOTO
   ========================================================================== */
const MODAL_IDS = [
  "modalServices",
  "modalRealisations",
  "modalContact",
  "modalOrder",
];

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");

  const hasOpenModal = MODAL_IDS.some((modalId) => {
    const el = document.getElementById(modalId);
    return el && el.classList.contains("is-open");
  });

  if (!hasOpenModal) {
    document.body.style.overflow = "";
  }
}

function openLightbox(src) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  if (!lightbox || !lightboxImg || !src) return;

  lightboxImg.src = src;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  if (!lightbox || !lightboxImg) return;

  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");

  const hasOpenModal = MODAL_IDS.some((modalId) => {
    const el = document.getElementById(modalId);
    return el && el.classList.contains("is-open");
  });

  if (!hasOpenModal) {
    document.body.style.overflow = "";
  }

  setTimeout(() => {
    if (!lightbox.classList.contains("is-open")) {
      lightboxImg.src = "";
    }
  }, 300);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

/* ==========================================================================
   3. PARSEUR CSV POUR GOOGLE SHEETS
   ========================================================================== */
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
   4. INITIALISATION AU CHARGEMENT DE LA PAGE
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Ouverture automatique de la modale contact si arrivée depuis boutique.html#sur-mesure
  if (window.location.hash === "#sur-mesure") {
    openModal("modalContact");
  }

  // ----------------------------------------------------------------------
  // A. Récupération automatique de la dernière publication Instagram
  // ----------------------------------------------------------------------
  const BEHOLD_FEED_URL = "https://feeds.behold.so/7axuN4we2Mc4uPPQrSop";
  const instaCard = document.getElementById("instaCard");
  const instaPostImg = document.getElementById("instaPostImg");

  if (instaCard && instaPostImg && BEHOLD_FEED_URL) {
    fetch(BEHOLD_FEED_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Erreur HTTP " + response.status);
        return response.json();
      })
      .then((data) => {
        const posts = Array.isArray(data) ? data : data.posts;
        if (!posts || posts.length === 0) return;

        const latestPost = posts[0];
        const imageUrl =
          latestPost.mediaType === "VIDEO"
            ? latestPost.thumbnailUrl || latestPost.sizes?.medium?.mediaUrl
            : latestPost.sizes?.medium?.mediaUrl ||
              latestPost.mediaUrl ||
              latestPost.thumbnailUrl;

        if (imageUrl) {
          instaPostImg.src = imageUrl;
        }
        if (latestPost.permalink) {
          instaCard.href = latestPost.permalink;
        }
        if (latestPost.caption) {
          instaPostImg.alt = latestPost.caption.slice(0, 120);
        }
      })
      .catch((err) => console.warn("Flux Instagram en mode secours :", err));
  }

  // ----------------------------------------------------------------------
  // B. Initialisation de la Boutique (pages/boutique.html)
  // ----------------------------------------------------------------------
  const shopGrid = document.getElementById("shopProductsGrid");
  const shopFilters = document.getElementById("shopCategoryFilters");
  const shopSearch = document.getElementById("shopSearchInput");
  const shopEmpty = document.getElementById("shopEmptyState");

  if (shopGrid && shopFilters) {
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

      openModal("modalOrder");
    }

    function renderShopProducts() {
      const filtered = allProducts.filter((p) => {
        const matchCat =
          activeCategory === "Tous" || p.categorie === activeCategory;
        const haystack =
          `${p.nom} ${p.categorie} ${p.description}`.toLowerCase();
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
          orderBtn.addEventListener("click", () =>
            openOrderForProduct(product),
          );
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

    if (GOOGLE_SHEETS_CSV_URL) {
      fetch(GOOGLE_SHEETS_CSV_URL)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur chargement Google Sheets");
          return res.text();
        })
        .then((csvText) => {
          const parsed = parseCSV(csvText);
          allProducts = parsed.length > 0 ? parsed : DEFAULT_SHOP_PRODUCTS;
          renderShopCategories(allProducts);
          renderShopProducts();
        })
        .catch(() => {
          allProducts = DEFAULT_SHOP_PRODUCTS;
          renderShopCategories(allProducts);
          renderShopProducts();
        });
    } else {
      allProducts = DEFAULT_SHOP_PRODUCTS;
      renderShopCategories(allProducts);
      renderShopProducts();
    }
  }

  // ----------------------------------------------------------------------
  // C. Délégation des clics (Modales & Zoom Photo)
  // ----------------------------------------------------------------------
  document.addEventListener("click", (e) => {
    const openTrigger = e.target.closest("[data-modal-open]");
    if (openTrigger) {
      openModal(openTrigger.dataset.modalOpen);
      return;
    }

    const closeTrigger = e.target.closest("[data-modal-close]");
    if (closeTrigger) {
      closeModal(closeTrigger.dataset.modalClose);
      return;
    }

    const switchTrigger = e.target.closest("[data-switch-modal]");
    if (switchTrigger) {
      const [fromId, toId] = switchTrigger.dataset.switchModal.split(":");
      closeModal(fromId);
      setTimeout(() => openModal(toId), 280);
      return;
    }

    const lightboxTrigger = e.target.closest("[data-lightbox-src]");
    if (lightboxTrigger) {
      openLightbox(lightboxTrigger.dataset.lightboxSrc);
      return;
    }

    if (
      e.target.closest("[data-lightbox-close]") ||
      e.target.id === "lightbox"
    ) {
      closeLightbox();
      return;
    }

    if (e.target.classList.contains("modal-backdrop")) {
      closeModal(e.target.id);
    }
  });

  // ----------------------------------------------------------------------
  // D. Accessibilité clavier (Entrée, Espace & Échap)
  // ----------------------------------------------------------------------
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const active = document.activeElement;
      if (
        active &&
        active.getAttribute("role") === "button" &&
        active.tagName !== "BUTTON"
      ) {
        e.preventDefault();
        active.click();
      }
    }

    if (e.key === "Escape") {
      const lightbox = document.getElementById("lightbox");
      if (lightbox && lightbox.classList.contains("is-open")) {
        closeLightbox();
        return;
      }

      MODAL_IDS.forEach((id) => {
        const modal = document.getElementById(id);
        if (modal && modal.classList.contains("is-open")) {
          closeModal(id);
        }
      });
    }
  });

  // ----------------------------------------------------------------------
  // E. Envoi du formulaire de contact via Google Apps Script
  // ----------------------------------------------------------------------
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById("submitBtn");
      const successMsg = document.getElementById("successMsg");
      const originalText = submitBtn.textContent;

      submitBtn.textContent = "Envoi en cours...";
      submitBtn.disabled = true;

      fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: new FormData(this),
        mode: "no-cors",
      })
        .then(() => {
          if (successMsg) successMsg.hidden = false;
          contactForm.reset();
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;

          setTimeout(() => {
            if (successMsg) successMsg.hidden = true;
            closeModal("modalContact");
          }, 3000);
        })
        .catch((error) => {
          console.error("Erreur d'envoi :", error);
          submitBtn.textContent = "Erreur. Réessayez.";
          submitBtn.disabled = false;

          setTimeout(() => {
            submitBtn.textContent = originalText;
          }, 3000);
        });
    });
  }

  // ----------------------------------------------------------------------
  // F. Envoi du formulaire de commande Boutique (Double paiement)
  // ----------------------------------------------------------------------
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

      submitBtn.textContent = "Validation en cours...";
      submitBtn.disabled = true;

      fetch(GOOGLE_SCRIPT_URL, {
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
              const targetPayUrl = stripeUrl || PAYPAL_BUSINESS_URL;
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

  // ----------------------------------------------------------------------
  // G. Inclinaison 3D directionnelle & halo lumineux sur les cartes
  // ----------------------------------------------------------------------
  const tiltCards = document.querySelectorAll(".tilt-effect");

  tiltCards.forEach((card) => {
    let enterTimeout;

    card.addEventListener("mousemove", (e) => {
      if (window.innerWidth < 768) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.setProperty("--rotateX", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--rotateY", `${rotateY.toFixed(2)}deg`);
      card.style.setProperty(
        "--glareX",
        `${((x / rect.width) * 100).toFixed(1)}%`,
      );
      card.style.setProperty(
        "--glareY",
        `${((y / rect.height) * 100).toFixed(1)}%`,
      );
    });

    card.addEventListener("mouseenter", () => {
      if (window.innerWidth < 768) return;
      clearTimeout(enterTimeout);
      enterTimeout = setTimeout(() => {
        card.style.transition = "border-color 0.3s ease, box-shadow 0.35s ease";
      }, 220);
    });

    card.addEventListener("mouseleave", () => {
      if (window.innerWidth < 768) return;
      clearTimeout(enterTimeout);
      card.style.transition =
        "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.35s ease";
      card.style.setProperty("--rotateX", "0deg");
      card.style.setProperty("--rotateY", "0deg");
      card.style.setProperty("--glareX", "50%");
      card.style.setProperty("--glareY", "50%");
    });
  });

  // ----------------------------------------------------------------------
  // H. Bouton magnétique ultra-doux et non collant
  // ----------------------------------------------------------------------
  const magneticBtn = document.getElementById("magneticBtn");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (magneticBtn && !prefersReducedMotion) {
    const magneticText = magneticBtn.querySelector(".btn-fab__text");
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener(
      "mousemove",
      (e) => {
        if (window.innerWidth < 768) {
          targetX = 0;
          targetY = 0;
          return;
        }

        const rect = magneticBtn.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;

        const margin = 32;
        const isNear =
          e.clientX >= rect.left - margin &&
          e.clientX <= rect.right + margin &&
          e.clientY >= rect.top - margin &&
          e.clientY <= rect.bottom + margin;

        if (isNear) {
          const dx = e.clientX - btnCenterX;
          const dy = e.clientY - btnCenterY;
          targetX = Math.max(-8, Math.min(8, dx * 0.14));
          targetY = Math.max(-5, Math.min(5, dy * 0.14));
        } else {
          targetX = 0;
          targetY = 0;
        }
      },
      { passive: true },
    );

    document.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
    });

    function animateMagneticBtn() {
      const ease = targetX === 0 && targetY === 0 ? 0.04 : 0.055;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;

      if (Math.abs(currentX) > 0.01 || Math.abs(currentY) > 0.01) {
        magneticBtn.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
        if (magneticText) {
          magneticText.style.transform = `translate3d(${(currentX * 0.25).toFixed(2)}px, ${(currentY * 0.25).toFixed(2)}px, 0)`;
        }
      } else if (currentX !== 0 || currentY !== 0) {
        currentX = 0;
        currentY = 0;
        magneticBtn.style.transform = "translate3d(0, 0, 0)";
        if (magneticText) {
          magneticText.style.transform = "translate3d(0, 0, 0)";
        }
      }

      requestAnimationFrame(animateMagneticBtn);
    }

    animateMagneticBtn();
  }

  // ----------------------------------------------------------------------
  // I. Rotation aléatoire du GIF d'en-tête à chaque actualisation
  // ----------------------------------------------------------------------
  const heroGif = document.getElementById("heroGif");

  if (heroGif) {
    const gifs = [
      "https://i.pinimg.com/originals/eb/50/87/eb50875a68b04b0480fa929af2c7547c.gif",
      "https://i.pinimg.com/originals/b1/5b/d5/b15bd596014d9d9310e59b07b85da550.gif",
      "https://i.pinimg.com/originals/1e/7d/d6/1e7dd6800a6ad9862861c878cfcc2fb2.gif",
    ];

    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
    heroGif.src = randomGif;
  }
});
