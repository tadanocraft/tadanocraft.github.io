document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. Gestion des Modales (Panneaux Rouges)
       ========================================= */
    window.openModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('translate-y-full');
            document.body.style.overflow = 'hidden'; // Empêche de scroller le fond
        }
    };

    window.closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('translate-y-full');
            document.body.style.overflow = 'auto'; // Réactive le scroll du fond
        }
    };

    /* =========================================
       2. Gestion de la Lightbox (Zoom Images)
       ========================================= */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    window.openLightbox = (src) => {
        if (!lightbox || !lightboxImg) return;
        lightboxImg.src = src;
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        
        // Petite animation d'apparition
        setTimeout(() => {
            lightbox.classList.remove('opacity-0');
            lightboxImg.classList.remove('scale-95');
            lightboxImg.classList.add('scale-100');
        }, 10);
    };

    window.closeLightbox = () => {
        if (!lightbox || !lightboxImg) return;
        
        // Animation de disparition
        lightbox.classList.add('opacity-0');
        lightboxImg.classList.remove('scale-100');
        lightboxImg.classList.add('scale-95');
        
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            lightboxImg.src = '';
        }, 300); // Temps de l'animation CSS
    };

    // Fermer la lightbox en cliquant sur le fond noir
    if(lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    /* =========================================
       3. Soumission du Formulaire vers Google
       ========================================= */
    const contactForm = document.getElementById('contactForm');
    if(contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Empêche le rechargement de la page
            
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            
            // État de chargement
            submitBtn.innerHTML = 'Envoi en cours... ⏳';
            submitBtn.disabled = true;

            const formData = new FormData(this);
            
            // REMPLACER ICI PAR TON URL GOOGLE APPS SCRIPT
            const GOOGLE_SCRIPT_URL = 'VOTRE_URL_GOOGLE_SCRIPT_ICI';
            
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors' // Requis pour éviter les erreurs CORS de Google
            })
            .then(() => {
                // Succès
                const successMsg = document.getElementById('successMsg');
                successMsg.classList.remove('hidden');
                this.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Fermeture automatique de la modale après 3 secondes
                setTimeout(() => {
                    successMsg.classList.add('hidden');
                    closeModal('modalContact');
                }, 3000);
            })
            .catch(error => {
                // Erreur
                console.error('Erreur lors de l'envoi:', error);
                submitBtn.innerHTML = 'Erreur. Réessayez.';
                submitBtn.disabled = false;
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                }, 3000);
            });
        });
    }
});
