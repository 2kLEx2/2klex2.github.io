const cookiePopup = document.getElementById("cookie-popup");
const acceptBtn = document.getElementById("cookie-accept");
const declineBtn = document.getElementById("cookie-decline");

function enableGA() {
  const gtagScript = document.createElement("script");
  gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"; // Replace with your ID
  gtagScript.async = true;
  document.head.appendChild(gtagScript);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', { anonymize_ip: true }); // Replace with your ID
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
