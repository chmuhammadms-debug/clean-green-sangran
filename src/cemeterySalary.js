export const CEMETERY_SALARY_ID = "work-cemetery-worker-salary";
export function isCemeterySalary(system) {
  return (typeof system === "object" ? system?.id : system) === CEMETERY_SALARY_ID;
}
export function ensureCemeterySalary(systems = []) {
  if (!systems.some((system) => system.id === "cemetery")) return systems;
  const salary = {
    id: CEMETERY_SALARY_ID, parentProjectId: "cemetery",
    name: "Cemetery Worker Salary", nameUr: "ملازم کی تنخواہ",
    description: "Monthly salary payments for the cemetery worker, with payment dates and receipts.",
    descriptionUr: "قبرستان کے ملازم کی ماہانہ تنخواہ، ادائیگی کی تاریخ اور رسیدوں کا مکمل ریکارڈ۔",
    icon: "🧹", isActive: true,
  };
  return systems.some(isCemeterySalary)
    ? systems.map((system) => isCemeterySalary(system) ? { ...salary, ...system, parentProjectId: "cemetery", nameUr: salary.nameUr } : system)
    : [...systems, salary];
}
export function readSalaryDetails(value = "") {
  const text = String(value || "");
  const match = text.match(/^تنخواہ کا مہینہ: (\d{4}-(?:0[1-9]|1[0-2]))\n([\s\S]*)$/);
  return { salaryMonth: match?.[1] || "", details: match ? match[2] : text };
}
export function writeSalaryDetails(month, details = "") {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)) throw new Error("تنخواہ کا مہینہ منتخب کریں۔");
  return `تنخواہ کا مہینہ: ${month}\n${String(details).trim()}`;
}
