import { CEMETERY_SALARY_ID } from "./cemeterySalary";
export default function SalaryAccountButton({ onOpen, language = "ur" }) {
  return <div className="salary-account-access" style={{ margin: "18px 0" }}>
    <button type="button" onClick={() => onOpen(CEMETERY_SALARY_ID)} style={{ padding: "11px 18px", minHeight: 44, border: "1px solid #166534", borderRadius: 8, background: "#fff", color: "#166534", font: "inherit", fontWeight: 700, cursor: "pointer" }}>
      {language === "ur" ? "ملازم کی تنخواہ" : "Worker salary"}
    </button>
  </div>;
}
