// Fonction pour vérifier si l'utilisateur est connecté
function isUserLoggedIn() {
  // Vérifie la présence du cookie SecureShopJWT_Token
  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  return !!cookies.SecureShopJWT_Token;
}

// Navigation commune à toutes les pages
// Pour modifier le menu, éditer uniquement ce fichier
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("topbar");
  if (!nav) return;
  const isLoggedIn = isUserLoggedIn();
  nav.innerHTML = `
        <header class="topbar">
            <div class="container">
                <div class="brand">Secure Shop</div>
                <nav class="menu">
          <a href="/">Accueil</a>
          <a href="/profile">Profil</a>
          <a href="/admin">Admin</a>
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
