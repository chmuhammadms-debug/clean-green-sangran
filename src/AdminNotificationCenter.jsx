import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteAdminNotification,
  fetchAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeAdminNotifications,
} from "./notificationService";
import "./SuggestionNotifications.css";

const ICONS = { suggestion: "✦", donation: "Rs", expense: "↘", blood_request: "🩸", blood_donor: "+", project: "▦" };

function timeLabel(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

function AdminNotificationCenter({ onOpenNotification }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await fetchAdminNotifications());
      setError("");
    } catch (loadError) {
      console.error("Notification load failed", loadError);
      setError("Notification database is not ready. Run the supplied Supabase SQL file.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeAdminNotifications(load);
    const poller = window.setInterval(load, 10000);
    return () => { unsubscribe(); window.clearInterval(poller); };
  }, [load]);

  const unread = useMemo(() => items.filter((item) => !item.is_read).length, [items]);
  const readOne = async (item) => {
    if (!item.is_read) { await markNotificationRead(item.id); await load(); }
  };
  const openNotification = async (item) => {
    setOpen(false);
    try {
      await readOne(item);
    } catch (readError) {
      console.warn("Notification could not be marked as read", readError);
    } finally {
      onOpenNotification?.(item);
    }
  };
  const readAll = async () => { await markAllNotificationsRead(); await load(); };
  const remove = async (event, id) => { event.stopPropagation(); await deleteAdminNotification(id); await load(); };

  return (
    <div className="admin-notification-center">
      <button className="notification-bell" type="button" onClick={() => setOpen((current) => !current)} aria-label="Admin notifications">
        <span>♟</span><b>Notifications</b>{unread > 0 && <i>{unread > 99 ? "99+" : unread}</i>}
      </button>
      {open && (
        <aside className="notification-panel">
          <header><div><span>LIVE ADMIN ALERTS</span><h2>Notification Center</h2></div><button type="button" onClick={() => setOpen(false)}>×</button></header>
          <div className="notification-panel__toolbar"><b>{unread} unread</b><button type="button" onClick={readAll} disabled={!unread}>Mark all as read</button></div>
          <div className="notification-list">
            {loading && <div className="notification-state">Loading notifications…</div>}
            {!loading && error && <div className="notification-state notification-state--error">{error}</div>}
            {!loading && !error && !items.length && <div className="notification-state">No notification yet.</div>}
            {items.map((item) => (
              <article className={item.is_read ? "notification-item" : "notification-item notification-item--unread"} key={item.id} onClick={() => openNotification(item)}>
                <div className={`notification-item__icon notification-item__icon--${item.event_type}`}>{ICONS[item.event_type] || "●"}</div>
                <div><span>{item.event_type.replaceAll("_", " ")}</span><h3>{item.title}</h3><p>{item.message}</p><small>{timeLabel(item.created_at)}</small></div>
                <button type="button" onClick={(event) => remove(event, item.id)} aria-label="Delete notification">×</button>
              </article>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

export default AdminNotificationCenter;
