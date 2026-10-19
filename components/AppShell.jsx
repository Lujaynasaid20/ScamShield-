"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, timeAgo } from "@/lib/api-client";
import { NOTIFICATION_TYPES } from "@/lib/constants";
import { ConfirmProvider, ToastProvider, useToast } from "./ui";

const USER_NAV = [
  { label: "Overview", items: [{ href: "/overview", icon: "bi-speedometer2", label: "Security overview" }] },
  { label: "Check", items: [
    { href: "/analyze", icon: "bi-chat-left-text", label: "Analyze message" },
    { href: "/urls", icon: "bi-link-45deg", label: "URL scanner" },
    { href: "/sender", icon: "bi-person-vcard", label: "Sender checker" }
  ] },
  { label: "My records", items: [
    { href: "/history", icon: "bi-clock-history", label: "Scam history" },
    { href: "/reports", icon: "bi-flag", label: "My scam reports" }
  ] },
  { label: "Protect & learn", items: [
    { href: "/protection", icon: "bi-shield-check", label: "Protection center" },
    { href: "/academy", icon: "bi-mortarboard", label: "Scam Awareness Academy" }
  ] },
  { label: "Account", items: [
    { href: "/notifications", icon: "bi-bell", label: "Notifications", badge: true },
    { href: "/settings", icon: "bi-gear", label: "Profile & settings" }
  ] }
];

const ADMIN_NAV = [
  { label: "Administration", items: [
    { href: "/admin", icon: "bi-grid-1x2", label: "Admin dashboard" },
    { href: "/admin/reports", icon: "bi-flag", label: "Review reports" },
    { href: "/admin/cases", icon: "bi-collection", label: "Scam database" },
    { href: "/admin/users", icon: "bi-people", label: "Users" },
    { href: "/admin/insights", icon: "bi-graph-up", label: "Trends & alerts" }
  ] },
  { label: "Account", items: [
    { href: "/notifications", icon: "bi-bell", label: "Notifications", badge: true },
    { href: "/settings", icon: "bi-gear", label: "Profile & settings" }
  ] }
];

const ShellContext = createContext({ profile: null, refreshUnread: () => {}, setProfile: () => {} });
export const useShell = () => useContext(ShellContext);

const isActive = (pathname, href) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

function NotificationBell({ unread, onChanged }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const ref = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    api("/api/notifications?pageSize=6").then(data => setItems(data.items)).catch(error => toast(error.message, "error"));
    const onClick = event => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const onKey = event => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open, toast]);

  const markAll = async () => {
    try {
      await api("/api/notifications", { method: "PATCH", body: { all: true } });
      setItems(current => current?.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
      onChanged();
    } catch (error) { toast(error.message, "error"); }
  };
  const openItem = async item => {
    setOpen(false);
    if (!item.read_at) { await api("/api/notifications", { method: "PATCH", body: { ids: [item.id] } }).catch(() => {}); onChanged(); }
  };

  return (
    <div className="position-relative" ref={ref}>
      <button type="button" className="icon-button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <i className="bi bi-bell" aria-hidden="true" />
        {unread > 0 && <span className="count">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="notification-popover" role="dialog" aria-label="Recent notifications">
          <div className="notification-popover-head">
            <strong>Notifications</strong>
            <button type="button" className="btn-link-plain small" onClick={markAll} disabled={!unread}>Mark all as read</button>
          </div>
          <div className="notification-popover-body">
            {!items ? <div className="py-3 small-print">Loading…</div> : !items.length ? <div className="py-4 text-center small-print">You have no notifications yet.</div> : items.map(item => {
              const type = NOTIFICATION_TYPES[item.type];
              const body = (
                <>
                  <span className="row-icon"><i className={`bi ${type?.icon || "bi-bell"}`} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-grow-1">
                    <div className="notification-title break-anywhere">{item.title}</div>
                    <small className="muted">{timeAgo(item.created_at)}</small>
                  </div>
                  {!item.read_at && <span className="unread-dot mt-2" aria-label="Unread" />}
                </>
              );
              return item.link
                ? <Link key={item.id} href={item.link} className={`notification-item text-reset text-decoration-none ${item.read_at ? "" : "unread"}`} onClick={() => openItem(item)}>{body}</Link>
                : <div key={item.id} className={`notification-item ${item.read_at ? "" : "unread"}`}>{body}</div>;
            })}
          </div>
          <div className="notification-popover-foot"><Link href="/notifications" onClick={() => setOpen(false)}>View all notifications</Link></div>
        </div>
      )}
    </div>
  );
}

function Shell({ profile: initialProfile, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState(initialProfile);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const nav = profile.role === "admin" ? ADMIN_NAV : USER_NAV;
  const current = nav.flatMap(group => group.items).find(item => isActive(pathname, item.href));

  const refreshUnread = useCallback(() => {
    api("/api/notifications?countOnly=1").then(data => setUnread(data.unread)).catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnread();
    const timer = setInterval(() => { if (document.visibilityState === "visible") refreshUnread(); }, 60000);
    return () => clearInterval(timer);
  }, [refreshUnread]);
  useEffect(() => { setMenuOpen(false); refreshUnread(); }, [pathname, refreshUnread]);

  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch (error) { toast(error.message, "error"); }
    router.replace("/login");
    router.refresh();
  };

  return (
    <ShellContext.Provider value={{ profile, setProfile, refreshUnread }}>
      <a className="skip-link visually-hidden-focusable" href="#main-content">Skip to content</a>
      <div className="shell">
        <aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="Main navigation">
          <Link href={profile.role === "admin" ? "/admin" : "/overview"} className="sidebar-brand">
            <span className="brand-mark"><i className="bi bi-shield-check" aria-hidden="true" /></span>ScamShield
          </Link>
          {profile.role !== "admin" && (
            <div className="sidebar-cta"><Link href="/reports/new" className="btn btn-primary w-100"><i className="bi bi-flag" aria-hidden="true" />Report a scam</Link></div>
          )}
          <nav>
            {nav.map(group => (
              <div className="nav-group" key={group.label}>
                <div className="nav-group-label">{group.label}</div>
                {group.items.map(item => (
                  <Link key={item.href} href={item.href} className={`nav-link-item ${isActive(pathname, item.href) ? "active" : ""}`} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge && unread > 0 && <span className="nav-badge" aria-label={`${unread} unread`}>{unread > 99 ? "99+" : unread}</span>}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <span className="avatar" aria-hidden="true">{(profile.display_name || profile.email).slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <div className="text-truncate" style={{ maxWidth: 150 }}>{profile.display_name}</div>
                <small>{profile.role === "admin" ? "Administrator" : profile.email}</small>
              </div>
              <button type="button" className="sidebar-logout" onClick={logout} aria-label="Log out" title="Log out"><i className="bi bi-box-arrow-right" /></button>
            </div>
          </div>
        </aside>
        <div className={`sidebar-backdrop ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
        <div className="main">
          <header className="topbar">
            <button type="button" className="icon-button menu-toggle" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><i className="bi bi-list" /></button>
            <span className="topbar-title">{current?.label || "ScamShield"}</span>
            <div className="topbar-actions">
              <NotificationBell unread={unread} onChanged={refreshUnread} />
              <Link href="/settings" className="icon-button" aria-label="Profile and settings"><i className="bi bi-person" aria-hidden="true" /></Link>
            </div>
          </header>
          <main className="content" id="main-content" tabIndex={-1}>{children}</main>
        </div>
      </div>
    </ShellContext.Provider>
  );
}

export default function AppShell({ profile, children }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Shell profile={profile}>{children}</Shell>
      </ConfirmProvider>
    </ToastProvider>
  );
}
