const cookiePopup = document.getElementById("cookie-popup");
const acceptBtn = document.getElementById("cookie-accept");
const declineBtn = document.getElementById("cookie-decline");

function enableGA() {
  const gtagScript = document.createElement("script");
  gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-JSZ1DEH2NP";
  gtagScript.async = true;
  document.head.appendChild(gtagScript);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-JSZ1DEH2NP', { anonymize_ip: true });
}

// Check if user already responded
if (localStorage.getItem("cookie_consent") === "accept") {
  cookiePopup.style.display = "none";
  enableGA();
} else if (localStorage.getItem("cookie_consent") === "decline") {
  cookiePopup.style.display = "none";
} else {
  cookiePopup.style.display = "flex";
}

acceptBtn.onclick = () => {
  localStorage.setItem("cookie_consent", "accept");
  cookiePopup.style.display = "none";
  enableGA();
};

declineBtn.onclick = () => {
  localStorage.setItem("cookie_consent", "decline");
  cookiePopup.style.display = "none";
};
