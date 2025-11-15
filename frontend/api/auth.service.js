const API_URL = `https://1h994dd7-3000.usw3.devtunnels.ms/api/`;

const register = async (newUser) => {
  try {
    const response = await fetch(`${API_URL}register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    return { error: error.message || "Error en la solicitud" };
  }
};

const login = async (user) => {
  try {
    //console.log("Login attempt:", user);

     const response = await fetch(`${API_URL}login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });

    const result = await response.json();
 
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    //console.log("Login error:", error);
    return { error: error.message || "Error en la solicitud" };
  }
};

export { register, login };
