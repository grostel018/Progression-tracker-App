console.log("SCRIPT LOADED");

/* =========================
   PAGE TEXT CONFIG
========================= */
const pages = {
    login: {
        title: "Progress Tracking App",
        subtitle: "Login to proceed"
    },
    register: {
        title: "Progress Tracking App",
        subtitle: "Register to proceed"
    },
    forgot: {
        title: "Progress Tracking App",
        subtitle: "Reset your password"
    }
};


/* =========================
   TERMINAL TYPING EFFECT
========================= */
function typeText(element, text, speed, callback) {
    if (!element) return;

    element.innerHTML = '<span class="cursor"></span>';
    const cursor = element.querySelector(".cursor");
    let i = 0;

    function typing() {
        if (i < text.length) {
            cursor.insertAdjacentText("beforebegin", text.charAt(i));
            i++;
            setTimeout(typing, speed);
        } else {
            cursor.remove();
            if (callback) callback();
        }
    }
    typing();
}


/* =========================
   PAGE LOAD HANDLER
========================= */
window.addEventListener("load", () => {
    document.body.classList.add("loaded");

    const page = document.body.dataset.page;
    if (!page || !pages[page]) return;

    const title = document.getElementById("title");
    const subtitle = document.getElementById("subtitle");

    if (!title || !subtitle) return;

    typeText(title, pages[page].title, 80, () => {
        typeText(subtitle, pages[page].subtitle, 40);
    });
});


/* =========================
   SAFE FETCH WRAPPER
========================= */
async function postForm(url, formData) {
    try {
        const res = await fetch(url, {
            method: "POST",
            body: formData,
            credentials: "include" // IMPORTANT for sessions later
        });
        return await res.text();
    } catch (err) {
        console.error("Network error:", err);
        return "SERVER_ERROR";
    }
}


/* =========================
   CLIENT-SIDE VALIDATION
========================= */
function validateRegister(form) {
    const email = form.email.value.trim();
    const username = form.username.value.trim();
    const password = form.password.value;
    const password2 = form.password2.value;

    if (!email || !username || !password || !password2) return "All fields required";
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return "Invalid email format";
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return "Username must be 3-20 chars (letters/numbers/_)";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== password2) return "Passwords do not match";

    return null;
}


/* =========================
   GENERIC AUTH FORM HANDLER
========================= */
function handleAuthForm(formId, url, redirectUrl, validator = null) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const errorBox = document.getElementById("error");
        errorBox.textContent = "";

        // Frontend validation
        if (validator) {
            const error = validator(form);
            if (error) {
                errorBox.textContent = error;
                return;
            }
        }

        // Loading terminal effect
        errorBox.textContent = "> Processing...";

        const data = new FormData(form);
        const result = await postForm(url, data);

        if (result.includes("SUCCESS")) {
            errorBox.textContent = "> Success. Redirecting...";
            setTimeout(() => window.location.href = redirectUrl, 800);
        } 
        else if (result === "SERVER_ERROR") {
            errorBox.textContent = "> Server offline. Try later.";
        } 
        else {
            errorBox.textContent = "> " + result;
        }
    });
}


/* =========================
   INIT AUTH FORMS
========================= */
handleAuthForm("loginForm", "backend/login.php", "setup.html");
handleAuthForm("registerForm", "backend/register.php", "login.html", validateRegister);
handleAuthForm("forgotForm", "backend/forgot.php", "login.html");
