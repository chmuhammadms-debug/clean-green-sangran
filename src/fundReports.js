import { useEffect, useState } from "react";
import archive from "./fundSlipArchive.json";
import { uploadWebsiteImage } from "./mediaUpload";
import { supabase } from "./supabase";

export function mergeFundReports(changes) {
  const reports = new Map(
    archive.filter((item) => item.kind === "reports").map((item) => [item.date, item]),
  );
  for (const { report_date: date, image_url: url, image_name: name } of changes) {
    if (url) reports.set(date, { id: date, date, url, name, kind: "reports" });
    else reports.delete(date);
  }
  return [...reports.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function useFundReports() {
  const [changes, setChanges] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase
        .from("monthly_fund_reports")
        .select("report_date,image_url,image_name");
      if (!active) return;
      if (error) setLoadError(error.message);
      else setChanges(data);
    }
    load();
    return () => { active = false; };
  }, []);

  async function saveReport(date, file) {
    if (!changes) throw new Error("رپورٹوں کا ریکارڈ ابھی لوڈ نہیں ہوا۔");
    if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("JPG، PNG یا WebP تصویر منتخب کریں۔");
    }
    const image = file ? await uploadWebsiteImage(file, "monthly-fund-reports") : null;
    const row = {
      report_date: date,
      image_url: image?.url ?? null,
      image_name: image?.name ?? null,
    };
    const { error } = await supabase.from("monthly_fund_reports").upsert(row);
    if (error) throw error;
    setChanges((current) => [...current.filter((item) => item.report_date !== date), row]);
  }

  return {
    reports: mergeFundReports(changes ?? []),
    loaded: changes !== null,
    loadError,
    saveReport,
  };
}
