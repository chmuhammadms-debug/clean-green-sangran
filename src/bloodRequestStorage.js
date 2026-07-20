export const ACTIVE_BLOOD_REQUEST_KEY = "cgs_active_blood_request";
export const PUBLIC_BLOOD_NOTIFICATION_READ_KEY = "cgs_read_blood_notifications";

export function readActiveBloodRequest() {
  try {
    const request = JSON.parse(window.localStorage.getItem(ACTIVE_BLOOD_REQUEST_KEY) || "null");
    return request?.id && request?.patient_name && request?.blood_group ? request : null;
  } catch {
    return null;
  }
}

export function saveActiveBloodRequest(request) {
  if (request?.id) {
    window.localStorage.setItem(ACTIVE_BLOOD_REQUEST_KEY, JSON.stringify(request));
    window.dispatchEvent(new CustomEvent("cgs-blood-request-updated", { detail: request }));
    return;
  }
  window.localStorage.removeItem(ACTIVE_BLOOD_REQUEST_KEY);
  window.dispatchEvent(new CustomEvent("cgs-blood-request-updated", { detail: null }));
}

export function readBloodNotificationKeys() {
  try {
    const keys = JSON.parse(window.localStorage.getItem(PUBLIC_BLOOD_NOTIFICATION_READ_KEY) || "[]");
    return Array.isArray(keys) ? keys : [];
  } catch {
    return [];
  }
}

export function saveBloodNotificationKeys(keys) {
  window.localStorage.setItem(
    PUBLIC_BLOOD_NOTIFICATION_READ_KEY,
    JSON.stringify(Array.from(new Set(keys)).slice(-100)),
  );
}
