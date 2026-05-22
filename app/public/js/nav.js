// Fonction pour récupérer et décoder les données de l'utilisateur à partir du JWT
function getUserFromToken() {
  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const parts = cookie.trim().split("=");
    const key = parts[0];
    const value = parts.slice(1).join("=");
    if (key) acc[key] = value;
    return acc;
  }, {});

  const token = cookies.SecureShopJWT_Token;
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Navigation commune à toutes les pages
// Pour modifier le menu, éditer uniquement ce fichier
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("topbar");
  if (!nav) return;
  
  const user = getUserFromToken();
  const isLoggedIn = !!user;
  const isAdmin = user && user.role === "admin";

  nav.innerHTML = `
        <header class="topbar">
            <div class="container">
                <div class="brand">Secure Shop</div>
                <nav class="menu">
          <a href="/">Accueil</a>
          ${isLoggedIn ? `<a href="/profile">Profil</a>` : ""}
          ${isAdmin ? `<a href="/admin">Admin</a>` : ""}
          ${
            isLoggedIn
              ? `<a href="/api/auth/logout">Déconnexion</a>`
              : `<a href="/login">Connexion</a><a href="/register">Inscription</a>`
          }
        </nav>
            </div>
        </header>
    `;
});

