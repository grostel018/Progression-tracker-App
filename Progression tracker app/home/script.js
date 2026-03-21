console.log("SCRIPT LOADED");







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
    const page = document.body.dataset.page; // <-- reliable detection

    if (!page) return; // safety

    const title = document.getElementById("title");
    const subtitle = document.getElementById("subtitle");

    const data = pages[page];

    if (!title || !subtitle) return; // avoid errors

    typeText(title, data.title, 80, () => {
        typeText(subtitle, data.subtitle, 40);
    });
};



document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    let form = new FormData(e.target);
    let res = await fetch("backend/login.php", { method: "POST", body: form });
    let text = await res.text();

    if (text === "LOGIN_SUCCESS") {
        window.location.href = "dashboard.php";
    } else {
        document.getElementById("error").textContent = "Invalid login";
    }
});


document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    let form = new FormData(e.target);
    let res = await fetch("backend/register.php", { method: "POST", body: form });
    let text = await res.text();

    if (text === "REGISTER_SUCCESS") {
        window.location.href = "login.html";
    } else {
        document.getElementById("error").textContent = text;
    }
});
