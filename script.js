"use strict";

/* ==========================================================================
   1. GESTION DES MODALES & ZOOM PHOTO
   ========================================================================== */
const MODAL_IDS = ["modalServices", "modalRealisations", "modalContact"];

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
   2. INITIALISATION AU CHARGEMENT DE LA PAGE
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
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
  // B. Délégation des clics (Modales & Zoom Photo)
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
  // C. Accessibilité clavier (Entrée, Espace & Échap)
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
  // D. Envoi du formulaire de contact via Google Apps Script
  // ----------------------------------------------------------------------
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById("submitBtn");
      const successMsg = document.getElementById("successMsg");
      const originalText = submitBtn.textContent;

      submitBtn.textContent = "Envoi en cours... ⏳";
      submitBtn.disabled = true;

      const GOOGLE_SCRIPT_URL = "VOTRE_URL_GOOGLE_SCRIPT_ICI";

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
  // E. Inclinaison 3D directionnelle & halo lumineux sur les cartes
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
        `${((x / rect.width) * 100).toFixed(1)}%`
      );
      card.style.setProperty(
        "--glareY",
        `${((y / rect.height) * 100).toFixed(1)}%`
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
  // F. Bouton magnétique ultra-doux et non collant
  // ----------------------------------------------------------------------
  const magneticBtn = document.getElementById("magneticBtn");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
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
      { passive: true }
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
  // G. Rotation aléatoire du GIF d'en-tête à chaque actualisation
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