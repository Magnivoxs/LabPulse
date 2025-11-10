export function toast(msg: string) {
  const el = document.createElement("div");
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed", right: "12px", bottom: "12px",
    background: "#111", color: "#fff", padding: "8px 12px",
    borderRadius: "8px", fontSize: "12px", zIndex: 9999, opacity: "0.95"
  });
  document.body.appendChild(el);
  setTimeout(()=>document.body.removeChild(el), 1800);
}

