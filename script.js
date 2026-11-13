/* =========================================
   1. Fonctions Globales pour les Modales
   ========================================= */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('translate-y-full');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('translate-y-full');
        document.body.style.overflow = '';
    }
}

/* =========================================
   2. Fonctions Globales pour la Lightbox
   ========================================= */
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightbox || !lightboxImg) return;
    
    lightboxImg.src = src;
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    
    setTimeout(() => {
        lightbox.classList.remove('opacity-0');
        lightboxImg.classList.remove('scale-95');
        lightboxImg.classList.add('scale-100');
    }, 10);
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightbox || !lightboxImg) return;
    
    lightbox.classList.add('opacity-0');
    lightboxImg.classList.remove('scale-100');
    lightboxImg.classList.add('scale-95');
    
    setTimeout(() => {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
        lightboxImg.src = '';
    }, 300);
}

// Exposer explicitement au scope global window
window.openModal = openModal;
window.closeModal = closeModal;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

/* =========================================
   3. Écouteurs d'événements (Clavier & Formulaires)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {

    // Fermeture avec la touche Échap (Escape)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const lightbox = document.getElementById('lightbox');
            // 1. Si le zoom photo est ouvert, on le ferme en priorité
            if (lightbox && !lightbox.classList.contains('hidden')) {
                closeLightbox();
                return;
            }

            // 2. Sinon, on ferme la fenêtre modale ouverte
            const modals = ['modalServices', 'modalRealisations', 'modalContact'];
            modals.forEach(id => {
                const modal = document.getElementById(id);
                if (modal && !modal.classList.contains('translate-y-full')) {
                    closeModal(id);
                }
            });
        }
    });

    // Fermer la modale Contact en cliquant à côté de la carte
    const modalContact = document.getElementById('modalContact');
    if (modalContact) {
        modalContact.addEventListener('click', (e) => {
            if (e.target === modalContact) {
                closeModal('modalContact');
            }
        });
    }

    // Gestion du Formulaire Google Apps Script
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = "Envoi en cours... ⏳";
            submitBtn.disabled = true;

            const formData = new FormData(this);
            
            // REMPLACER PAR TON URL GOOGLE APPS SCRIPT
            const GOOGLE_SCRIPT_URL = "VOTRE_URL_GOOGLE_SCRIPT_ICI";
            
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            })
            .then(() => {
                const successMsg = document.getElementById('successMsg');
                if (successMsg) successMsg.classList.remove('hidden');
                contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                setTimeout(() => {
                    if (successMsg) successMsg.classList.add('hidden');
                    closeModal('modalContact');
                }, 3000);
            })
            .catch(error => {
                console.error("Erreur d'envoi :", error);
                submitBtn.innerHTML = "Erreur. Réessayez.";
                submitBtn.disabled = false;
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                }, 3000);
            });
        });
    }
});