'use strict';

/* ==========================================================================
   1. GESTION DES MODALES & LIGHTBOX
   ========================================================================== */
const MODAL_IDS = ['modalServices', 'modalRealisations', 'modalContact'];

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    const hasOpenModal = MODAL_IDS.some(modalId => {
        const el = document.getElementById(modalId);
        return el && el.classList.contains('is-open');
    });

    if (!hasOpenModal) {
        document.body.style.overflow = '';
    }
}

function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightbox || !lightboxImg || !src) return;

    lightboxImg.src = src;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightbox || !lightboxImg) return;

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');

    const hasOpenModal = MODAL_IDS.some(modalId => {
        const el = document.getElementById(modalId);
        return el && el.classList.contains('is-open');
    });

    if (!hasOpenModal) {
        document.body.style.overflow = '';
    }

    setTimeout(() => {
        if (!lightbox.classList.contains('is-open')) {
            lightboxImg.src = '';
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
document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------------------
    // A. Récupération automatique de la dernière publication Instagram
    // ----------------------------------------------------------------------
    const BEHOLD_FEED_URL = 'https://feeds.behold.so/7axuN4we2Mc4uPPQrSop';
    const instaCard = document.getElementById('instaCard');
    const instaPostImg = document.getElementById('instaPostImg');

    if (instaCard && instaPostImg && BEHOLD_FEED_URL) {
        fetch(BEHOLD_FEED_URL)
            .then(response => {
                if (!response.ok) throw new Error('Erreur HTTP ' + response.status);
                return response.json();
            })
            .then(data => {
                const posts = Array.isArray(data) ? data : data.posts;
                if (!posts || posts.length === 0) return;

                const latestPost = posts[0];
                const imageUrl = latestPost.mediaType === 'VIDEO'
                    ? (latestPost.thumbnailUrl || latestPost.sizes?.medium?.mediaUrl)
                    : (latestPost.sizes?.medium?.mediaUrl || latestPost.mediaUrl || latestPost.thumbnailUrl);

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
            .catch(err => console.warn('Flux Instagram en mode secours :', err));
    }

    // ----------------------------------------------------------------------
    // B. Délégation des clics (Modales & Lightbox)
    // ----------------------------------------------------------------------
    document.addEventListener('click', (e) => {
        const openTrigger = e.target.closest('[data-modal-open]');
        if (openTrigger) {
            openModal(openTrigger.dataset.modalOpen);
            return;
        }

        const closeTrigger = e.target.closest('[data-modal-close]');
        if (closeTrigger) {
            closeModal(closeTrigger.dataset.modalClose);
            return;
        }

        const switchTrigger = e.target.closest('[data-switch-modal]');
        if (switchTrigger) {
            const [fromId, toId] = switchTrigger.dataset.switchModal.split(':');
            closeModal(fromId);
            setTimeout(() => openModal(toId), 280);
            return;
        }

        const lightboxTrigger = e.target.closest('[data-lightbox-src]');
        if (lightboxTrigger) {
            openLightbox(lightboxTrigger.dataset.lightboxSrc);
            return;
        }

        if (e.target.closest('[data-lightbox-close]') || e.target.id === 'lightbox') {
            closeLightbox();
            return;
        }

        if (e.target.classList.contains('modal-backdrop')) {
            closeModal(e.target.id);
        }
    });

    // ----------------------------------------------------------------------
    // C. Accessibilité clavier (Entrée, Espace & Échap)
    // ----------------------------------------------------------------------
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const active = document.activeElement;
            if (active && active.getAttribute('role') === 'button' && active.tagName !== 'BUTTON') {
                e.preventDefault();
                active.click();
            }
        }

        if (e.key === 'Escape') {
            const lightbox = document.getElementById('lightbox');
            if (lightbox && lightbox.classList.contains('is-open')) {
                closeLightbox();
                return;
            }

            MODAL_IDS.forEach(id => {
                const modal = document.getElementById(id);
                if (modal && modal.classList.contains('is-open')) {
                    closeModal(id);
                }
            });
        }
    });

    // ----------------------------------------------------------------------
    // D. Envoi du formulaire de contact via Google Apps Script
    // ----------------------------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const successMsg = document.getElementById('successMsg');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Envoi en cours... ⏳';
            submitBtn.disabled = true;

            const GOOGLE_SCRIPT_URL = 'VOTRE_URL_GOOGLE_SCRIPT_ICI';

            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: new FormData(this),
                mode: 'no-cors'
            })
            .then(() => {
                if (successMsg) successMsg.hidden = false;
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

                setTimeout(() => {
                    if (successMsg) successMsg.hidden = true;
                    closeModal('modalContact');
                }, 3000);
            })
            .catch((error) => {
                console.error("Erreur d'envoi :", error);
                submitBtn.textContent = 'Erreur. Réessayez.';
                submitBtn.disabled = false;

                setTimeout(() => {
                    submitBtn.textContent = originalText;
                }, 3000);
            });
        });
    }
});