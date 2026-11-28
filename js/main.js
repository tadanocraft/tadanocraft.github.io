"use strict";

/* ==========================================================================
   1. CONFIGURATION GLOBALE DU STUDIO
   ========================================================================== */
const STUDIO_CONFIG = {
  // Ton script Google Apps Script (Devis + Commandes)
  urlGoogleScript:
    "https://script.google.com/macros/s/AKfycbxN9xbn4fy66dGJVV_KyI3ezns0fs4T6lvamwU_1IKBDD27Fbd6LP-UH8YbtuPkVTKa8w/exec",
  // Flux Instagram Behold.so
  urlBeholdFeed: "https://feeds.behold.so/7axuN4we2Mc4uPPQrSop",
};

window.STUDIO_CONFIG = STUDIO_CONFIG;

/* ==========================================================================
   2. VALIDATION INTERACTIVE & FILTRE ANTI-TROLL (PARTAGÉ STUDIO + BOUTIQUE)
   ========================================================================== */
const MOTS_INTERDITS = [
  "caca",
  "pipi",
  "merde",
  "putain",
  "connard",
  "connasse",
  "salope",
  "encule",
  "bite",
  "couille",
  "fdp",
  "ntm",
  "fuck",
  "shit",
  "bitch",
  "azer",
  "azerty",
  "qsdf",
  "wxcv",
];

function normalizeText(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function containsForbiddenWord(str) {
  const clean = normalizeText(str);
  return MOTS_INTERDITS.some((word) => {
    const regex = new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, "i");
    return regex.test(clean);
  });
}

function setFieldError(input, message) {
  if (!input) return;
  const group = input.closest(".form-group") || input.parentElement;
  let errEl = group.querySelector(".form-error");

  if (message) {
    input.classList.add("is-invalid");
    if (!errEl) {
      errEl = document.createElement("p");
      errEl.className = "form-error";
      group.appendChild(errEl);
    }
    errEl.textContent = message;
  } else {
    input.classList.remove("is-invalid");
    if (errEl) errEl.remove();
  }
}

const TadanoValidator = {
  validateEmail(input) {
    const val = (input.value || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(val)) {
      setFieldError(
        input,
        "Veuillez saisir une adresse e-mail valide (ex: nom@domaine.be).",
      );
      return false;
    }
    setFieldError(input, "");
    return true;
  },

  validatePhone(input, required = false) {
    const val = (input.value || "").trim();
    if (!val && !required) {
      setFieldError(input, "");
      return true;
    }
    const digitsOnly = val.replace(/\D/g, "");
    const phoneRegex = /^[0-9+\s./()-]+$/;
    if (
      !phoneRegex.test(val) ||
      digitsOnly.length < 8 ||
      digitsOnly.length > 15
    ) {
      setFieldError(
        input,
        "Veuillez saisir un numéro de téléphone valide (ex: 0470 12 34 56).",
      );
      return false;
    }
    setFieldError(input, "");
    return true;
  },

  validateName(input) {
    const val = (input.value || "").trim();
    if (val.length < 2 || !/[a-zA-ZÀ-ÿ]{2,}/.test(val)) {
      setFieldError(input, "Veuillez indiquer votre nom et prénom.");
      return false;
    }
    if (containsForbiddenWord(val)) {
      setFieldError(input, "Merci d'indiquer un nom valide.");
      return false;
    }
    setFieldError(input, "");
    return true;
  },

  validateText(input, minLength = 5) {
    const val = (input.value || "").trim();
    if (val.length < minLength) {
      setFieldError(
        input,
        `Veuillez préciser un peu plus (${minLength} caractères minimum).`,
      );
      return false;
    }
    if (containsForbiddenWord(val)) {
      setFieldError(input, "Merci d'utiliser un langage approprié.");
      return false;
    }
    setFieldError(input, "");
    return true;
  },
};

window.TadanoValidator = TadanoValidator;

/* ==========================================================================
   3. COMPOSANT HEADER UNIQUE (<tadano-header>)
   ========================================================================== */
class TadanoHeader extends HTMLElement {
  connectedCallback() {
    const inPages = window.location.pathname.includes("/pages/");
    const base = inPages ? "../" : "";
    const pagesBase = inPages ? "" : "pages/";

    const isBoutique = window.location.pathname.includes("boutique.html");
    const isLegal = window.location.pathname.includes("mentions-legales.html");
    const isHome = !isBoutique && !isLegal;

    const ctaHtml = isHome
      ? `<button type="button" class="site-navbar__cta" data-modal-open="modalContact">Contact</button>`
      : `<a href="${base}index.html#sur-mesure" class="site-navbar__cta">Contact</a>`;

    this.innerHTML = `
      <nav class="site-navbar" aria-label="Navigation principale">
        <div class="site-navbar__inner">
          <a href="${base}index.html" class="site-navbar__brand" aria-label="Accueil Tadano Craft">
            <img
              src="${base}media/images/identite/tranche1.webp"
              alt="Tadano Craft"
              width="180"
              height="48"
              class="site-navbar__logo"
            />
          </a>
          <div class="site-navbar__links">
            <a href="${base}index.html" class="site-navbar__link ${isHome ? "is-active" : ""}">Studio</a>
            <a href="${pagesBase}boutique.html" class="site-navbar__link ${isBoutique ? "is-active" : ""}">
              <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Boutique</span>
            </a>
            ${ctaHtml}
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define("tadano-header", TadanoHeader);

/* ==========================================================================
   4. GESTION DES MODALES, LIGHTBOX & BOUTON RETOUR MOBILE
   ========================================================================== */
const MODAL_IDS = [
  "modalServices",
  "modalRealisations",
  "modalContact",
  "modalOrder",
];

function isAnyOverlayOpen() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox && lightbox.classList.contains("is-open")) return true;
  return MODAL_IDS.some((id) => {
    const el = document.getElementById(id);
    return el && el.classList.contains("is-open");
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal || modal.classList.contains("is-open")) return;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (window.history && window.history.pushState) {
    window.history.pushState({ tadanoOverlay: id }, "");
  }
}

function closeModal(id, fromPopState = false) {
  const modal = document.getElementById(id);
  if (!modal || !modal.classList.contains("is-open")) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");

  if (!isAnyOverlayOpen()) {
    document.body.style.overflow = "";
  }

  if (
    !fromPopState &&
    window.history.state &&
    window.history.state.tadanoOverlay === id
  ) {
    window.history.back();
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

  if (window.history && window.history.pushState) {
    window.history.pushState({ tadanoOverlay: "lightbox" }, "");
  }
}

function closeLightbox(fromPopState = false) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  if (!lightbox || !lightboxImg || !lightbox.classList.contains("is-open"))
    return;

  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");

  if (!isAnyOverlayOpen()) {
    document.body.style.overflow = "";
  }

  if (
    !fromPopState &&
    window.history.state &&
    window.history.state.tadanoOverlay === "lightbox"
  ) {
    window.history.back();
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

window.addEventListener("popstate", () => {
  const lightbox = document.getElementById("lightbox");
  if (lightbox && lightbox.classList.contains("is-open")) {
    closeLightbox(true);
    return;
  }
  MODAL_IDS.forEach((id) => {
    const modal = document.getElementById(id);
    if (modal && modal.classList.contains("is-open")) {
      closeModal(id, true);
    }
  });
});

/* ==========================================================================
   5. INITIALISATION AU CHARGEMENT DE LA PAGE
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash === "#sur-mesure") {
    openModal("modalContact");
  }

  // A. Flux Instagram Behold.so
  const instaCard = document.getElementById("instaCard");
  const instaPostImg = document.getElementById("instaPostImg");

  if (instaCard && instaPostImg && STUDIO_CONFIG.urlBeholdFeed) {
    fetch(STUDIO_CONFIG.urlBeholdFeed)
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

        if (imageUrl) instaPostImg.src = imageUrl;
        if (latestPost.permalink) instaCard.href = latestPost.permalink;
        if (latestPost.caption)
          instaPostImg.alt = latestPost.caption.slice(0, 120);
      })
      .catch((err) => console.warn("Flux Instagram en mode secours :", err));
  }

  // B. Délégation des clics (Modales & Zoom Photo)
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

  // C. Accessibilité clavier (Entrée, Espace & Échap)
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

  // D. Envoi du formulaire de contact sur mesure (avec validation interactive)
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    const inputProjet = document.getElementById("inputProjet");
    const inputEmail = document.getElementById("inputEmail");
    const inputPhone = document.getElementById("inputPhone");

    if (inputProjet)
      inputProjet.addEventListener("blur", () =>
        TadanoValidator.validateText(inputProjet, 5),
      );
    if (inputEmail)
      inputEmail.addEventListener("blur", () =>
        TadanoValidator.validateEmail(inputEmail),
      );
    if (inputPhone)
      inputPhone.addEventListener("blur", () =>
        TadanoValidator.validatePhone(inputPhone, false),
      );

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const validProjet = TadanoValidator.validateText(inputProjet, 5);
      const validEmail = TadanoValidator.validateEmail(inputEmail);
      const validPhone = TadanoValidator.validatePhone(inputPhone, false);

      if (!validProjet || !validEmail || !validPhone) return;

      const submitBtn = document.getElementById("submitBtn");
      const successMsg = document.getElementById("successMsg");
      const originalText = submitBtn.textContent;

      submitBtn.textContent = "Envoi en cours...";
      submitBtn.disabled = true;

      fetch(STUDIO_CONFIG.urlGoogleScript, {
        method: "POST",
        body: new URLSearchParams(new FormData(this)),
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

  // E. Inclinaison 3D directionnelle & halo lumineux sur les cartes
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

  // F. Bouton magnétique doux
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

  // G. Rotation aléatoire du GIF d'en-tête
  const heroGif = document.getElementById("heroGif");
  if (heroGif) {
    const gifs = [
      "media/videos/igor-freitas-mesa.webm",
      "media/videos/eb50875a68b04b0480fa929af2c7547c.webm",
      "media/videos/0add5a26394fa458118f96c0bb49e840.webm",
    ];
    heroGif.src = gifs[Math.floor(Math.random() * gifs.length)];
  }
});
