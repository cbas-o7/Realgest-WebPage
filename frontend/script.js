const form = document.getElementById("auth-form");
const nameGroup = document.getElementById("name-group");
const toggleBtn = document.getElementById("toggle-btn");
const toggleMessage = document.getElementById("toggle-message");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const errorMessage = document.getElementById("error-message");
const closeBtn = document.getElementById("close-btn");
const overlay = document.getElementById("overlay");

let isLogin = true;

toggleBtn.addEventListener("click", () => {
  isLogin = !isLogin;
  if (isLogin) {
    nameGroup.classList.add("hidden");
    formTitle.textContent = "Inicia sesión";
    submitBtn.textContent = "Iniciar Sesión";
    toggleMessage.textContent = "¿No tienes cuenta?";
    toggleBtn.textContent = "Regístrate";
  } else {
    nameGroup.classList.remove("hidden");
    formTitle.textContent = "Regístrate";
    submitBtn.textContent = "Crear Cuenta";
    toggleMessage.textContent = "¿Ya tienes cuenta?";
    toggleBtn.textContent = "Inicia sesión";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.textContent = "";

  const data = {
    name: form.name?.value,
    email: form.email.value,
    password: form.password.value
  };

  try {
    const response = await fetch(`http://localhost:3000/api/${isLogin ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    alert(result.message); 
  } catch (err) {
    errorMessage.textContent = err.message;
  }
});

closeBtn.addEventListener("click", () => {
  overlay.style.display = "none";
});
