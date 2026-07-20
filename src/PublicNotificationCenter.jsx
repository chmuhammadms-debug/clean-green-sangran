import { useCallback, useEffect, useMemo, useState } from "react";
import { resumeBloodRequest } from "./bloodBankService";
import {
  readActiveBloodRequest,
  readBloodNotificationKeys,
  saveActiveBloodRequest,
  saveBloodNotificationKeys,
} from "./bloodRequestStorage";
import "./PublicNotificationCenter.css";

function buildNotifications(request, ur) {
  if (!request?.id) return [];
  const reference = request.id.slice(0, 8).toUpperCase();
  const items = [];

  if (request.approval_status === "approved") {
    items.push({
      id: `${request.id}:approved:${request.approved_at || "approved"}`,
      title: ur ? "آپ کی بلڈ درخواست منظور ہوگئی" : "Blood request approved",
      message: ur
        ? `درخواست ${reference} کی management verification مکمل ہوگئی ہے۔`
        : `Management verification for request ${reference} is complete.`,
      createdAt: request.approved_at || request.created_at,
    });
  }

  if (request.assignment_status === "selected") {
    items.push({
      id: `${request.id}:selected:${request.assignment_selected_at || "selected"}`,
      title: ur ? "Management نے ڈونر منتخب کرلیا" : "A donor has been arranged",
      message: ur
        ? `درخواست ${reference} کے لیے ڈونر منتخب ہوگیا ہے۔ مکمل تفصیل کے لیے درخواست کھولیں۔`
        : `A donor has been selected for request ${reference}. Open the request for its current status.`,
      createdAt: request.assignment_selected_at || request.approved_at || request.created_at,
    });
  }

  if (request.assignment_status === "donated" || request.status === "fulfilled") {
    items.push({
      id: `${request.id}:fulfilled:${request.assignment_donated_at || "fulfilled"}`,
      title: ur ? "خون کا عطیہ مکمل ہوگیا" : "Blood donation completed",
      message: ur
        ? `درخواست ${reference} کامیابی سے مکمل کردی گئی ہے۔`
        : `Request ${reference} has been completed successfully.`,
      createdAt: request.assignment_donated_at || request.approved_at || request.created_at,
    });
  }

  if (request.approval_status === "rejected" || request.status === "closed") {
    items.push({
      id: `${request.id}:closed:${request.updated_at || request.created_at}`,
      title: ur ? "بلڈ درخواست بند کردی گئی" : "Blood request closed",
      message: ur
        ? `درخواست ${reference} کی موجودہ حالت دیکھنے کے لیے یہاں دبائیں۔`
        : `Open request ${reference} to see its current status.`,
      createdAt: request.updated_at || request.created_at,
    });
  }

  return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function dateLabel(value, ur) {
  if (!value) return "";
  return new Date(value).toLocaleString(ur ? "ur-PK" : "en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PublicNotificationCenter({ language = "en", onOpenBloodRequest }) {
  const ur = language === "ur";
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState(readActiveBloodRequest);
  const [readKeys, setReadKeys] = useState(readBloodNotificationKeys);

  const refresh = useCallback(async () => {
    const saved = readActiveBloodRequest();
    if (!saved?.id || !saved?.phone) {
      setRequest(saved);
      return;
    }
    try {
      const latest = await resumeBloodRequest(saved.id, saved.phone);
      const merged = { ...saved, ...latest };
      setRequest(merged);
      saveActiveBloodRequest(merged);
    } catch (error) {
      console.warn("Public blood-request notification refresh failed", error);
      setRequest(saved);
    }
  }, []);

  useEffect(() => {
    refresh();
    const poller = window.setInterval(refresh, 15000);
    const onStorage = () => {
      setRequest(readActiveBloodRequest());
      setReadKeys(readBloodNotificationKeys());
    };
    const onRequestUpdated = (event) => setRequest(event.detail || readActiveBloodRequest());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("cgs-blood-request-updated", onRequestUpdated);
    return () => {
      window.clearInterval(poller);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cgs-blood-request-updated", onRequestUpdated);
    };
  }, [refresh]);

  const notifications = useMemo(() => buildNotifications(request, ur), [request, ur]);
  const unread = notifications.filter((item) => !readKeys.includes(item.id)).length;

  const openItem = (item) => {
    const nextRead = [...readKeys, item.id];
    setReadKeys(nextRead);
    saveBloodNotificationKeys(nextRead);
    setOpen(false);
    onOpenBloodRequest?.(request, item);
  };

  if (!request?.id || !notifications.length) return null;

  return (
    <div className="public-notification-center" dir={ur ? "rtl" : "ltr"}>
      <button className="public-notification-bell" type="button" onClick={() => setOpen((value) => !value)}>
        <span>●</span><b>{ur ? "اطلاعات" : "Updates"}</b>{unread > 0 && <i>{unread}</i>}
      </button>
      {open && (
        <aside className="public-notification-panel">
          <header><div><span>{ur ? "آپ کی بلڈ درخواست" : "YOUR BLOOD REQUEST"}</span><h2>{ur ? "تازہ اطلاعات" : "Latest updates"}</h2></div><button type="button" onClick={() => setOpen(false)}>×</button></header>
          <div className="public-notification-list">
            {notifications.map((item) => (
              <button className={readKeys.includes(item.id) ? "" : "unread"} type="button" key={item.id} onClick={() => openItem(item)}>
                <span>✚</span><div><strong>{item.title}</strong><p>{item.message}</p><small>{dateLabel(item.createdAt, ur)}</small></div><b>{ur ? "←" : "→"}</b>
              </button>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
