// Main JavaScript

const pages = {
    login: {
        title: "Progress Tracking App",
        subtitle: "Login to proceed"
    },
    register: {
        title: "Progress Tracking App",
        subtitle: "Register to proceed"
    }
};

function typeText(element, text, speed, callback) {
    let i = 0;
    function typing() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typing, speed);
        } else if (callback) {
            callback();
        }
    }
    typing();
}

window.onload = () => {
    const page = document.body.dataset.page;

    if (!page) return;

    const title = document.getElementById("title");
    const subtitle = document.getElementById("subtitle");

    const data = pages[page];

    if (!title || !subtitle) return;

    typeText(title, data.title, 80, () => {
        typeText(subtitle, data.subtitle, 40);
    });
};

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const res = await fetch("login.php", { method: "POST", body: form });
    const data = await res.json();

    if (data.success) {
        window.location.href = "dashboard.php";
    } else {
        document.getElementById("error").textContent = data.message || "Invalid login";
    }
});

document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const res = await fetch("register.php", { method: "POST", body: form });
    const data = await res.json();

    if (data.success) {
        window.location.href = "login.php";
    } else {
        document.getElementById("error").textContent = data.message || "Registration failed";
    }
});
