document.querySelectorAll("pre").forEach((block) => {
  const codeEl = block.querySelector("code");
  if (!codeEl) return;

  const button = document.createElement("button");
  button.className = "copy-button";
  button.type = "button";
  button.textContent = "Copy";

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(codeEl.textContent || "");
      const oldText = button.textContent;
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = oldText;
      }, 2000);
    } catch (error) {
      button.textContent = "Failed";
      setTimeout(() => {
        button.textContent = "Copy";
      }, 2000);
    }
  });

  block.style.position = "relative";
  block.appendChild(button);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const href = anchor.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const headers = document.querySelectorAll(".accordion-header");
headers.forEach((header) => {
  header.addEventListener("click", () => {
    const content = header.nextElementSibling;
    if (!content || !content.classList.contains("accordion-content")) return;

    const icon = header.querySelector(".accordion-icon");
    const isOpen = content.style.maxHeight && content.style.maxHeight !== "0px";

    document.querySelectorAll(".accordion-content").forEach((panel) => {
      panel.style.maxHeight = null;
      panel.classList.remove("open-pad");
      const panelHeader = panel.previousElementSibling;
      if (panelHeader) {
        const panelIcon = panelHeader.querySelector(".accordion-icon");
        if (panelIcon) panelIcon.textContent = "+";
      }
    });

    if (!isOpen) {
      content.style.maxHeight = content.scrollHeight + "px";
      content.classList.add("open-pad");
      if (icon) icon.textContent = "-";
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");
});
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");

  const currentPage = document.body.dataset.page;
  if (currentPage) {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === currentPage) {
        link.classList.add("active");
      }
    });
  }

  document.querySelectorAll("pre").forEach((block) => {
    const codeNode = block.querySelector("code");
    if (!codeNode) return;

    const button = document.createElement("button");
    button.className = "copy-button";
    button.type = "button";
    button.textContent = "Copy";

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(codeNode.textContent || "");
        const old = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = old;
        }, 2000);
      } catch (_error) {
        button.textContent = "Failed";
        setTimeout(() => {
          button.textContent = "Copy";
        }, 2000);
      }
    });

    block.appendChild(button);
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    });
  });

  const headers = document.querySelectorAll(".accordion-header");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      if (!content || !content.classList.contains("accordion-content")) return;

      const isOpen = content.style.maxHeight && content.style.maxHeight !== "0px";

      document.querySelectorAll(".accordion-content").forEach((panel) => {
        panel.style.maxHeight = null;
      });
      document.querySelectorAll(".accordion-icon").forEach((icon) => {
        icon.textContent = "+";
      });

      if (!isOpen) {
        content.style.maxHeight = `${content.scrollHeight}px`;
        const icon = header.querySelector(".accordion-icon");
        if (icon) icon.textContent = "-";
      }
    });
  });
});
