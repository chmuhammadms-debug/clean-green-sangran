// Store the bill number alongside the purpose in the existing persisted text field.
export function readBillDetails(value = "") {
  const text = String(value || "");
  const match = text.match(/^Bill No: ([^\n]*)\n([\s\S]*)$/);
  return match ? { billNumber: match[1], details: match[2] } : { billNumber: "", details: text };
}
export function writeBillDetails(billNumber, details) {
  const number = String(billNumber || "").replace(/[\r\n]/g, " ").trim();
  const purpose = String(details || "").trim();
  return number ? `Bill No: ${number}\n${purpose}` : purpose;
}
