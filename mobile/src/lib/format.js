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
// Returns null when the app has no screen for it yet.
export function appRoute(webPath) {
  if (!webPath) return null;
  const [path, query = ""] = webPath.split("?");
  const params = new URLSearchParams(query);
  if (path === "/overview") return "/";
  if (path === "/analyze") return "/scan";
  if (path === "/urls") return params.get("url") ? { pathname: "/check", params: { mode: "url", value: params.get("url") } } : { pathname: "/check", params: { mode: "url" } };
  if (path === "/sender") return params.get("value") ? { pathname: "/check", params: { mode: "sender", value: params.get("value") } } : { pathname: "/check", params: { mode: "sender" } };
  if (path === "/history") return "/history";
  const history = /^\/history\/(\d+)$/.exec(path);
  if (history) return { pathname: "/history/[id]", params: { id: history[1] } };
  return null;
}
