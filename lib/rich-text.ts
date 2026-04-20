const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h2",
  "h3",
  "span",
  "div",
]);

const ALLOWED_COLORS = new Set(["#ef7d5b", "#334155", "#1f2937"]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sanitizeRichHtml(html: string) {
  if (typeof window === "undefined") {
    return html;
  }

  const parser = new window.DOMParser();
  const documentNode = parser.parseFromString(html, "text/html");

  const cleanNode = (node: Node): string => {
    if (node.nodeType === window.Node.TEXT_NODE) {
      return escapeHtml(node.textContent ?? "");
    }

    if (node.nodeType !== window.Node.ELEMENT_NODE) {
      return "";
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes).map(cleanNode).join("");

    if (!ALLOWED_TAGS.has(tag)) {
      return children;
    }

    if (tag === "br") {
      return "<br />";
    }

    if (tag === "span") {
      const color = normalizeColor(element.style.color);
      if (!color) {
        return children;
      }

      return `<span style="color:${color}">${children}</span>`;
    }

    return `<${tag}>${children}</${tag}>`;
  };

  const normalized = Array.from(documentNode.body.childNodes).map(cleanNode).join("");
  return normalized.trim() || "<p></p>";
}

function normalizeColor(input: string) {
  if (!input) {
    return "";
  }

  const value = input.trim().toLowerCase();
  const rgbToHex: Record<string, string> = {
    "rgb(239, 125, 91)": "#ef7d5b",
    "rgb(51, 65, 85)": "#334155",
    "rgb(31, 41, 55)": "#1f2937",
  };

  if (ALLOWED_COLORS.has(value)) {
    return value;
  }

  return rgbToHex[value] ?? "";
}

export function renderDraftContent(value: string) {
  if (!value) {
    return "<p></p>";
  }

  const looksLikeHtml = /<[^>]+>/.test(value);

  if (looksLikeHtml) {
    return value;
  }

  const escaped = escapeHtml(value).replace(/\n/g, "<br />");
  return `<p>${escaped}</p>`;
}
