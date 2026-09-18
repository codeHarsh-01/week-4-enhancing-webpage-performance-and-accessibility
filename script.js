/* ------------------------------------------------------------------
   Week 3 — JavaScript Interactivity (Week 4: minor accessibility fixes)
   Harsh Goyal | Interactive Developer Portfolio

   Builds directly on the Week 2 responsive layout. Every feature below
   is a small, independent function that owns one piece of behaviour;
   all of them are wired up once from the DOMContentLoaded listener at
   the bottom. Nothing here changes the page's layout — only classes,
   attributes, and text content are touched, so the CSS from Week 2
   keeps working exactly as before.

   Week 4 additions: the mobile-nav toggle's aria-label now flips
   between "Open navigation" / "Close navigation" instead of staying
   static, and the scroll-spy link highlight now sets aria-current
   ="page" alongside its .active class, so screen reader users get the
   same "you are here" signal that sighted users get from the color.
------------------------------------------------------------------- */

(function () {
    "use strict";

    /* ---------------- 1. Theme toggle (light / dark) ---------------- */
    /* Reads/writes localStorage so the choice survives a page reload. */

    function initThemeToggle() {
        const root = document.documentElement;
        const button = document.getElementById("themeToggle");
        const label = document.getElementById("themeToggleLabel");
        if (!button) return;

        const STORAGE_KEY = "hg-theme";

        function apply(theme) {
            root.setAttribute("data-theme", theme);
            const isDark = theme === "dark";
            button.setAttribute("aria-pressed", String(isDark));
            button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
            if (label) label.textContent = isDark ? "Light" : "Dark";
        }

        let saved = null;
        try {
            saved = localStorage.getItem(STORAGE_KEY);
        } catch (err) {
            /* localStorage can be unavailable; theme just won't persist */
        }

        const prefersDark = window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;

        apply(saved || (prefersDark ? "dark" : "light"));

        button.addEventListener("click", function () {
            const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            apply(next);
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch (err) {
                /* ignore persistence failures */
            }
        });
    }

    /* ---------------- 2. Mobile navigation ---------------- */
    /* Extends the Week 2 toggle: closes on outside click and Escape,
       and animates the hamburger icon into an X via the .active class. */

    function initMobileNav() {
        const toggle = document.getElementById("menuToggle");
        const nav = document.getElementById("nav");
        if (!toggle || !nav) return;

        function closeMenu() {
            nav.classList.remove("open");
            toggle.classList.remove("active");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open navigation");
        }

        function openMenu() {
            nav.classList.add("open");
            toggle.classList.add("active");
            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-label", "Close navigation");
        }

        toggle.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = nav.classList.contains("open");
            isOpen ? closeMenu() : openMenu();
        });

        nav.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("click", function (event) {
            if (nav.classList.contains("open") && !nav.contains(event.target) && event.target !== toggle) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && nav.classList.contains("open")) {
                closeMenu();
                toggle.focus();
            }
        });
    }

    /* ---------------- 3. Sticky header shadow on scroll ---------------- */

    function initHeaderScrollState() {
        const header = document.getElementById("siteHeader");
        if (!header) return;

        function update() {
            header.classList.toggle("scrolled", window.scrollY > 12);
        }

        window.addEventListener("scroll", update, { passive: true });
        update();
    }

    /* ---------------- 4. Active nav link while scrolling ---------------- */
    /* Highlights the nav link for whichever section is currently in view. */

    function initScrollSpy() {
        const sections = document.querySelectorAll("main section[id]");
        const links = document.querySelectorAll(".nav a");
        if (!sections.length || !links.length) return;

        const linkFor = {};
        links.forEach(function (link) {
            linkFor[link.getAttribute("href").replace("#", "")] = link;
        });

        if (!("IntersectionObserver" in window)) return;

        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    const link = linkFor[entry.target.id];
                    if (!link) return;
                    if (entry.isIntersecting) {
                        links.forEach(function (l) {
                            l.classList.remove("active");
                            l.removeAttribute("aria-current");
                        });
                        link.classList.add("active");
                        link.setAttribute("aria-current", "page");
                    }
                });
            },
            { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
        );

        sections.forEach(function (section) { observer.observe(section); });
    }

    /* ---------------- 5. Scroll-reveal entrance ---------------- */
    /* Adds .is-visible to each .reveal section the first time it enters
       the viewport, then stops watching it. */

    function initScrollReveal() {
        const targets = document.querySelectorAll(".reveal");
        if (!targets.length) return;

        if (!("IntersectionObserver" in window)) {
            targets.forEach(function (el) { el.classList.add("is-visible"); });
            return;
        }

        const observer = new IntersectionObserver(
            function (entries, obs) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        targets.forEach(function (el) { observer.observe(el); });
    }

    /* ---------------- 6. Project filter ---------------- */

    function initProjectFilter() {
        const bar = document.getElementById("filterBar");
        const cards = document.querySelectorAll("#projectsGrid .project-card");
        const empty = document.getElementById("filterEmpty");
        if (!bar || !cards.length) return;

        bar.addEventListener("click", function (event) {
            const button = event.target.closest(".filter-btn");
            if (!button) return;

            bar.querySelectorAll(".filter-btn").forEach(function (b) {
                b.classList.remove("active");
                b.setAttribute("aria-pressed", "false");
            });
            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");

            const filter = button.dataset.filter;
            let visibleCount = 0;

            cards.forEach(function (card) {
                const matches = filter === "all" || card.dataset.category === filter;
                card.hidden = !matches;
                if (matches) visibleCount += 1;
            });

            if (empty) empty.hidden = visibleCount !== 0;
        });
    }

    /* ---------------- 7. Contact form validation ---------------- */

    function initContactForm() {
        const form = document.getElementById("contactForm");
        if (!form) return;

        const nameField = document.getElementById("name");
        const emailField = document.getElementById("email");
        const messageField = document.getElementById("message");
        const messageCount = document.getElementById("messageCount");
        const submitBtn = document.getElementById("submitBtn");
        const status = document.getElementById("formStatus");

        const errors = {
            name: document.getElementById("nameError"),
            email: document.getElementById("emailError"),
            message: document.getElementById("messageError"),
        };

        const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        function setError(field, errorEl, message) {
            if (message) {
                field.setAttribute("aria-invalid", "true");
                errorEl.textContent = message;
                return false;
            }
            field.removeAttribute("aria-invalid");
            errorEl.textContent = "";
            return true;
        }

        function validateName() {
            const value = nameField.value.trim();
            if (!value) return setError(nameField, errors.name, "Please enter your name.");
            if (value.length < 2) return setError(nameField, errors.name, "That name looks too short.");
            return setError(nameField, errors.name, "");
        }

        function validateEmail() {
            const value = emailField.value.trim();
            if (!value) return setError(emailField, errors.email, "Please enter an email address.");
            if (!EMAIL_PATTERN.test(value)) return setError(emailField, errors.email, "Enter a valid email address.");
            return setError(emailField, errors.email, "");
        }

        function validateMessage() {
            const value = messageField.value.trim();
            if (!value) return setError(messageField, errors.message, "Please write a short message.");
            if (value.length < 10) return setError(messageField, errors.message, "A few more words would help.");
            return setError(messageField, errors.message, "");
        }

        nameField.addEventListener("blur", validateName);
        emailField.addEventListener("blur", validateEmail);
        messageField.addEventListener("blur", validateMessage);

        messageField.addEventListener("input", function () {
            messageCount.textContent = messageField.value.length;
            if (messageField.getAttribute("aria-invalid") === "true") validateMessage();
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const validName = validateName();
            const validEmail = validateEmail();
            const validMessage = validateMessage();

            if (!(validName && validEmail && validMessage)) {
                status.dataset.state = "error";
                status.textContent = "Please fix the highlighted fields and try again.";
                const firstInvalid = form.querySelector('[aria-invalid="true"]');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            // Simulate a short network delay so the disabled/loading state
            // is visible, since there is no real backend behind this demo.
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending...";
            status.dataset.state = "success";
            status.textContent = "";

            window.setTimeout(function () {
                submitBtn.disabled = false;
                submitBtn.textContent = "Send Message";
                status.textContent = "Thanks! Your message has been captured for this demo.";
                form.reset();
                messageCount.textContent = "0";
            }, 700);
        });
    }

    /* ---------------- 8. Back-to-top button ---------------- */

    function initBackToTop() {
        const button = document.getElementById("backToTop");
        if (!button) return;

        function update() {
            button.hidden = window.scrollY < 500;
        }

        window.addEventListener("scroll", update, { passive: true });
        update();

        button.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ---------------- 9. Footer year ---------------- */

    function initFooterYear() {
        const el = document.getElementById("currentYear");
        if (el) el.textContent = new Date().getFullYear();
    }

    /* ---------------- Boot ---------------- */

    document.addEventListener("DOMContentLoaded", function () {
        initThemeToggle();
        initMobileNav();
        initHeaderScrollState();
        initScrollSpy();
        initScrollReveal();
        initProjectFilter();
        initContactForm();
        initBackToTop();
        initFooterYear();
    });
})();
