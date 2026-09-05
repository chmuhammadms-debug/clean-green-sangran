export const CENTRAL_FUND_ID = "central-fund";

export const centralFundSystem = {
  id: CENTRAL_FUND_ID,
  name: "Central Fund",
  nameUr: "مرکزی فنڈ",
  description: "One shared fund for every community project except mosques.",
  descriptionUr: "مساجد کے علاوہ تمام اجتماعی منصوبوں کے لیے ایک مشترکہ مرکزی فنڈ۔",
  icon: "💰",
  isActive: true,
};

export function isCentralFund(systemOrId) {
  const id = typeof systemOrId === "object" ? systemOrId?.id : systemOrId;
  return String(id || "") === CENTRAL_FUND_ID;
}

export function isMosqueAccountId(value) {
  const id = String(typeof value === "object" ? value?.id : value || "");
  return id === "mosque" || id.startsWith("mosque-");
}

export function centralFundRecords(records = []) {
  return (Array.isArray(records) ? records : []).filter((record) => (
    record?.type === "income"
      ? isCentralFund(record.systemId)
      : !isMosqueAccountId(record?.systemId)
  ));
}

export function projectExpenseRecords(records = []) {
  return (Array.isArray(records) ? records : []).filter((record) => record?.type === "expense");
}
