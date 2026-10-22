// Keep legacy single-file receipts readable in the existing persisted column.
export function receiptAttachments(record = {}) {
  const value = record.slipData || "";
  try {
    const parsed = JSON.parse(value);
    if (parsed?.format === "cgs-receipt-pair-v1" && Array.isArray(parsed.files)) {
      return parsed.files.filter((file) => file && ["bill", "payment"].includes(file.kind)
        && typeof file.url === "string" && /^(https?:\/\/|data:(image\/|application\/pdf))/i.test(file.url))
        .map((file) => ({ kind: file.kind, name: String(file.name || "Receipt"), url: file.url }));
    }
  } catch { /* A legacy URL or data URL is already a complete attachment. */ }
  return value ? [{ kind: "bill", name: record.slipName || "Receipt", url: value }] : [];
}
export function receiptForm(record) {
  const files = receiptAttachments(record);
  const bill = files.find((file) => file.kind === "bill");
  const payment = files.find((file) => file.kind === "payment");
  return { slipName: bill?.name || "", slipData: bill?.url || "", paymentSlipName: payment?.name || "", paymentSlipData: payment?.url || "" };
}
export function packReceiptForm(form) {
  if (!form.paymentSlipData) return { slipName: form.slipName || "", slipData: form.slipData || "" };
  const files = [
    ...(form.slipData ? [{ kind: "bill", name: form.slipName, url: form.slipData }] : []),
    { kind: "payment", name: form.paymentSlipName, url: form.paymentSlipData },
  ];
  return { slipName: files.map((file) => file.name).join(" + "), slipData: JSON.stringify({ format: "cgs-receipt-pair-v1", files }) };
}
