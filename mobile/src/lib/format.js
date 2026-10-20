export function formatDate(value, { time = true } = {}) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

export function timeAgo(value) {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value, { time: false });
}

export const KIND = {
  message: { icon: "chatbox-ellipses-outline", label: "Message" },
  url: { icon: "link-outline", label: "Link" },
  sender: { icon: "person-circle-outline", label: "Sender" }
};

// Website paths used in server data (notification links, recommendations) mapped to app screens.
// Returns null when the app has no screen for it.
export function appRoute(webPath) {
  if (!webPath) return null;
  const [pathAndQuery] = webPath.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(query);
  const id = /^\/[a-z-]+\/([\w-]+)$/.exec(path)?.[1];
  if (path === "/overview" || path === "/") return "/";
  if (path === "/analyze") return "/scan";
  if (path === "/urls") return { pathname: "/check", params: { mode: "url", ...(params.get("url") ? { value: params.get("url") } : {}) } };
  if (path === "/sender") return { pathname: "/check", params: { mode: "sender", ...(params.get("value") ? { value: params.get("value") } : {}) } };
  if (path === "/history") return "/history";
  if (/^\/history\/\d+$/.test(path)) return { pathname: "/history/[id]", params: { id } };
  if (path === "/reports") return "/reports";
  if (path === "/reports/new") return "/reports/new";
  if (/^\/reports\/\d+$/.test(path)) return { pathname: "/reports/[id]", params: { id } };
  if (path === "/notifications") return "/notifications";
  if (path === "/academy") return "/academy";
  if (/^\/academy\/[\w-]+$/.test(path)) return { pathname: "/academy/[id]", params: { id } };
  if (path === "/settings") return "/account";
  return null;
}

export const formatBytes = bytes => (bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`);
