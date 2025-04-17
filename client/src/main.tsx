import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom fonts
const fontLinks = [
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap",
  "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap"
];

// Dynamically add font links to head
fontLinks.forEach(href => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
});

// Add meta tags
const meta = document.createElement("meta");
meta.name = "description";
meta.content = "Interactive Bahá'í Calendar for Riḍván - A 19-day spiritual experience";
document.head.appendChild(meta);

// Set page title
document.title = "Riḍván Calendar";

// Create and inject the app
createRoot(document.getElementById("root")!).render(<App />);
