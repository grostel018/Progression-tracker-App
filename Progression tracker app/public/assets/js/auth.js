const pages = {
    login: {
        title: 'Progression Tracker',
        subtitle: 'Resume your streak and continue from the last checkpoint.',
    },
    register: {
        title: 'Progression Tracker',
        subtitle: 'Create your node and start turning plans into visible progress.',
    },
    forgot: {
        title: 'Progression Tracker',
        subtitle: 'Recover access and get back to your active workspace.',
    },
};

function typeText(element, text, speed, callback) {
    element.textContent = '';
    let i = 0;

    function typing() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i += 1;
            setTimeout(typing, speed);
        } else if (callback) {
            callback();
        }
    }

    typing();
}

async function submitAuthForm(url, form) {
    const response = await fetch(url, {
        method: 'POST',
        body: new FormData(form),
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    return response.json();
}

document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const errorBox = document.getElementById('error');
    errorBox.textContent = '';

    try {
        const data = await submitAuthForm('api/auth/login.php', event.target);

        if (data.success) {
            window.location.href = 'dashboard.php';
            return;
        }

        errorBox.textContent = data.message || 'Invalid login';
    } catch (error) {
        errorBox.textContent = 'Login failed. Try again.';
        console.error(error);
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const errorBox = document.getElementById('error');
    errorBox.textContent = '';

    try {
        const data = await submitAuthForm('api/auth/register.php', event.target);

        if (data.success) {
            window.location.href = 'login.php';
            return;
        }

        errorBox.textContent = data.message || 'Registration failed';
    } catch (error) {
        errorBox.textContent = 'Registration failed. Try again.';
        console.error(error);
    }
});

document.getElementById('forgotForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const errorBox = document.getElementById('error');
    const successBox = document.getElementById('success');

    errorBox.textContent = '';
    successBox.textContent = '';

    try {
        const data = await submitAuthForm('api/auth/forgot.php', event.target);

        if (data.success) {
            successBox.textContent = data.message || 'Reset request received';
            return;
        }

        errorBox.textContent = data.message || 'Failed to send reset link';
    } catch (error) {
        errorBox.textContent = 'Failed to send reset link';
        console.error(error);
    }
});

window.addEventListener('load', () => {
    const page = document.body.dataset.page;
    document.body.classList.add('is-ready');

    if (!page || !pages[page]) {
        return;
    }

    const title = document.getElementById('title');
    const subtitle = document.getElementById('subtitle');

    if (!title || !subtitle) {
        return;
    }

    typeText(title, pages[page].title, 80, () => {
        typeText(subtitle, pages[page].subtitle, 40);
    });
});
