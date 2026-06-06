document.addEventListener('DOMContentLoaded', () => {
    
    // --- Custom Cursor ---
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const links = document.querySelectorAll('a, .gallery-item, .close-lightbox');

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    // Smooth follower animation
    function animateFollower() {
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';
        
        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Hover effects for cursor
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            cursor.classList.add('hovering');
            follower.style.display = 'none'; // Hide follower on hover to emphasize dot
        });
        link.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovering');
            follower.style.display = 'block';
        });
    });

    // --- Scroll Reveal Animation ---
    const reveals = document.querySelectorAll('.reveal');

    function checkReveal() {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;

        reveals.forEach(reveal => {
            const revealTop = reveal.getBoundingClientRect().top;
            if (revealTop < windowHeight - revealPoint) {
                reveal.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', checkReveal);
    checkReveal(); // Check on initial load

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Lightbox Functionality ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.close-lightbox');
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const title = item.querySelector('h3').innerText;
            
            lightboxImg.src = img.src;
            lightboxCaption.innerText = title;
            lightbox.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    });

    // Close lightbox
    const closeLightbox = () => {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.style.display === 'block') {
            closeLightbox();
        }
    });

    // --- Size Selector Logic ---
    const sizeSelectors = document.querySelectorAll('.size-selector');
    sizeSelectors.forEach(select => {
        select.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            const size = selectedOption.value;
            const printName = e.target.getAttribute('data-print-name');
            
            // Find the price element and buy button in the same product card
            const productInfo = e.target.closest('.product-info');
            const priceEl = productInfo.querySelector('.price');
            const buyBtn = productInfo.querySelector('.btn-buy');
            
            // Update price text
            priceEl.innerText = '$' + price;
            
            // Update mailto link if it exists
            if (buyBtn) {
                const newSubject = encodeURIComponent(`Purchase Inquiry: ${printName} (${size})`);
                buyBtn.href = `mailto:Riice.tabitha@gmail.com?subject=${newSubject}`;
            }
        });
    });

    // --- PayPal Integration ---
    const initPayPalButton = (containerId) => {
        if (!window.paypal) return;
        
        window.paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'gold',
                layout: 'vertical',
                label: 'paypal',
            },
            createOrder: (data, actions) => {
                const container = document.getElementById(containerId);
                const productInfo = container.closest('.product-info');
                const select = productInfo.querySelector('.size-selector');
                const selectedOption = select.options[select.selectedIndex];
                
                const price = selectedOption.getAttribute('data-price');
                const itemName = select.getAttribute('data-print-name') + " - " + selectedOption.value;

                return actions.order.create({
                    purchase_units: [{
                        description: itemName,
                        amount: {
                            currency_code: 'USD',
                            value: price
                        },
                        shipping: {
                            type: 'SHIPPING'
                        }
                    }],
                    application_context: {
                        shipping_preference: 'GET_FROM_FILE',
                        user_action: 'PAY_NOW'
                    }
                });
            },
            onApprove: (data, actions) => {
                return actions.order.capture().then((details) => {
                    const shipping = details.purchase_units[0].shipping;
                    const address = shipping ? `${shipping.address.address_line_1}, ${shipping.address.admin_area_2}` : 'No address captured';
                    
                    alert('Transaction completed!\n\nBuyer: ' + details.payer.name.given_name + '\nShipping to: ' + address + '\n\nPlease check your PayPal dashboard for full details.');
                });
            }
        }).render(`#${containerId}`);
    };

    // Initialize buttons for the 3 prints
    initPayPalButton('paypal-button-container-1');
    initPayPalButton('paypal-button-container-2');
    initPayPalButton('paypal-button-container-3');

    // --- Mobile Menu Toggle ---
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinksList = document.querySelector('.nav-links');
    
    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navLinksList.classList.toggle('active');
            mobileMenu.classList.toggle('is-active');
        });
        
        // Close menu when a link is clicked
        const navItems = document.querySelectorAll('.nav-links a');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navLinksList.classList.remove('active');
                mobileMenu.classList.remove('is-active');
            });
        });
    }

    // --- Review Form Submission (Formspree AJAX) ---
    const reviewForm = document.getElementById('review-form');
    const reviewSuccess = document.getElementById('review-success');

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = reviewForm.querySelector('.btn-submit-review');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const formData = new FormData(reviewForm);

            try {
                const response = await fetch(reviewForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    reviewForm.style.display = 'none';
                    reviewSuccess.style.display = 'block';
                } else {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Review';
                    alert('There was an issue submitting your review. Please try again.');
                }
            } catch (error) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Review';
                alert('Connection error. Please check your internet and try again.');
            }
        });
    }
});
