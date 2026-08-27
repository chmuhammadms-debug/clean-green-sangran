import { Component, useEffect, useState } from "react";
import "./App.css";
import CentralTools from "./CentralTools";
import ProjectManager from "./ProjectManager";
import WebsiteSettings from "./WebsiteSettings";
import ProjectIcon, {
  ensureSingleBloodBankSystem,
  isBloodBankProject,
} from "./ProjectIcon";
import BloodBankAdmin from "./BloodBankAdmin";
import AdminNotificationCenter from "./AdminNotificationCenter";
import MembershipAdmin from "./MembershipAdmin";
import ComplaintAdmin from "./ComplaintAdmin";
import MosqueManagementHub from "./MosqueManagementHub";
import WorkItemsHub from "./WorkItemsHub";
import WelfareManagementHub from "./WelfareManagementHub";
import WelfareOperationsPanel from "./WelfareOperationsPanel";
import { InfrastructureAdmin } from "./InfrastructureManagement";
import PlantationSurveyAdmin from "./PlantationSurveyAdmin";
import DemographyAdmin from "./DemographyAdmin";
import { isDemographyProject } from "./demographyService";
import {
  defaultMosqueSystems,
  ensureMosqueSystems,
  isMosqueChild,
  isMosqueParent,
  mosqueChildSystems,
  topLevelSystems,
} from "./mosqueManagement";
import {
  defaultWelfareSystems,
  ensureWelfareSystems,
  isWelfareChild,
  isWelfareParent,
  welfareChildSystems,
} from "./welfareManagement";
import { isCurrentUserAdmin } from "./bloodBankService";
import { supabase } from "./supabase";
import { deleteDatabaseProject, deleteDatabaseTransaction, fetchDatabaseData, syncDatabaseData } from "./dataService";
import { uploadWebsiteImage } from "./mediaUpload";
import {
  createWorkItemId,
  isWorkItem,
  recordsForProject,
  workParentId,
} from "./workItems";

const defaultSystems = [
  {
    id: "blood-bank",
    name: "Blood Bank",
    nameUr: "بلڈ بینک",
    description: "Blood donor registry and emergency request management",
    descriptionUr: "خون کے عطیہ دہندگان کا محفوظ ریکارڈ اور ہنگامی درخواستوں کا نظام",
    icon: "🩸",
  },
  {
    id: "cemetery",
    name: "Cemetery Management",
    description: "Cemetery funds, expenses and reports",
    icon: "🌿",
  },
  {
    id: "plantation",
    name: "Plantation Management",
    description: "Plantation funds, expenses and reports",
    icon: "🌳",
  },
  {
    id: "mosque",
    name: "Mosque Management",
    description: "Mosque funds, expenses and reports",
    icon: "🕌",
  },
  {
    id: "welfare",
    name: "Welfare Management",
    nameUr: "فلاحی منصوبہ جات",
    description: "Clean water, community support, sports and youth development projects",
    descriptionUr: "صاف پانی، اجتماعی معاونت، کھیل اور نوجوانوں کی ترقی کے منصوبے",
    icon: "🤝",
  },
  ...defaultMosqueSystems,
  ...defaultWelfareSystems,
];

function normalizeSystems(systems = []) {
  const safeSystems = Array.isArray(systems)
    ? systems.filter((system) => system && typeof system === "object")
    : [];
  return ensureWelfareSystems(
    ensureMosqueSystems(
      ensureSingleBloodBankSystem(safeSystems, defaultSystems[0])
    )
  );
}

const defaultTransactions = [];
const legacyTransactionIds = new Set(["cemetery-first-record"]);

function withoutLegacyTransactions(records = []) {
  const safeRecords = Array.isArray(records) ? records : [];
  return safeRecords.filter(
    (record) => record && typeof record === "object" && !legacyTransactionIds.has(String(record.id))
  );
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function emptyForm() {
  return {
    person: "",
    amount: "",
    date: getToday(),
    method: "Cash",
    details: "",
    slipName: "",
    slipData: "",
    donorPhoto: "",
    donorPhotoName: "",
  };
}

function loadSystems() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("sangrahnSystems")
    );

    if (!Array.isArray(saved)) return normalizeSystems(defaultSystems);

    const savedIds = new Set(saved.map((system) => String(system.id)));
    return normalizeSystems([
      ...saved,
      ...defaultSystems.filter((system) => !savedIds.has(String(system.id))),
    ]);
  } catch {
    return normalizeSystems(defaultSystems);
  }
}

function loadTransactions() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("sangrahnTransactions")
    );

    if (!Array.isArray(saved)) return defaultTransactions;

    return withoutLegacyTransactions(saved).map((record) => {
      const methodTranslations = {
        نقد: "Cash",
        بینک: "Bank",
        دیگر: "Other",
      };

      return {
        ...record,
        method:
          methodTranslations[record.method] || record.method,
      };
    });
  } catch {
    return defaultTransactions;
  }
}

function totalsFor(records) {
  const safeRecords = Array.isArray(records) ? records : [];
  const amountFor = (record) => {
    const amount = Number(record?.amount);
    return Number.isFinite(amount) ? amount : 0;
  };
  const income = safeRecords
    .filter((record) => record.type === "income")
    .reduce(
      (total, record) => total + amountFor(record),
      0
    );

  const expenses = safeRecords
    .filter((record) => record.type === "expense")
    .reduce(
      (total, record) => total + amountFor(record),
      0
    );

  return {
    income,
    expenses,
    balance: income - expenses,
  };
}

function donorSummaryFor(records = []) {
  const donors = new Map();

  (Array.isArray(records) ? records : [])
    .filter((record) => record?.type === "income")
    .forEach((record) => {
      const displayName = String(record?.person || "Anonymous").trim().replace(/\s+/g, " ") || "Anonymous";
      const key = displayName.toLocaleLowerCase("en");
      const current = donors.get(key) || { name: displayName, entries: 0, amount: 0 };
      current.entries += 1;
      current.amount += Number(record?.amount) || 0;
      donors.set(key, current);
    });

  const people = [...donors.values()].sort((a, b) => b.amount - a.amount);
  return {
    people,
    uniquePeople: people.length,
    singleEntryPeople: people.filter((person) => person.entries === 1).length,
    repeatEntryPeople: people.filter((person) => person.entries > 1).length,
  };
}

function safeRecordText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function normalizeTransactionRecord(record, index = 0) {
  const source = record && typeof record === "object" ? record : {};
  const amount = Number(source.amount);
  const type = source.type === "expense" ? "expense" : "income";

  return {
    ...source,
    id: safeRecordText(source.id || source.databaseId, `record-${index}`),
    systemId: safeRecordText(source.systemId),
    type,
    person: safeRecordText(source.person, type === "income" ? "Anonymous" : "Expense"),
    amount: Number.isFinite(amount) ? amount : 0,
    date: safeRecordText(source.date, getToday()),
    method: safeRecordText(source.method, "Other"),
    details: safeRecordText(source.details),
    slipName: safeRecordText(source.slipName),
    slipData: typeof source.slipData === "string" ? source.slipData : "",
    donorPhoto: typeof source.donorPhoto === "string" ? source.donorPhoto : "",
  };
}

function receiptNumber(record) {
  const shortId = String(record.id)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8)
    .toUpperCase();

  return `CGS-${shortId}`;
}

function escapeHtml(value) {
  const characters = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => characters[character]
  );
}

function SummaryCards({ totals, labels }) {
  const items = [
    { label: labels[0], value: totals.income },
    { label: labels[1], value: totals.expenses },
    { label: labels[2], value: totals.balance },
  ];

  return (
    <div className="summary-grid">
      {items.map((item) => (
        <div className="summary-card" key={item.label}>
          <p>{item.label}</p>
          <h2>Rs. {item.value.toLocaleString()}</h2>
        </div>
      ))}
    </div>
  );
}

class OptionalProjectPanelBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Optional project panel failed to load", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="empty-message" style={{ marginTop: "22px" }}>
          The project payment page is ready. An optional project panel could not be loaded.
        </div>
      );
    }

    return this.props.children;
  }
}

class AdminProjectBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("Admin project page failed to render", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section className="panel" style={{ marginTop: "22px" }}>
        <h2>Project page could not load</h2>
        <p>A damaged old record was blocked so the complete admin dashboard does not turn white.</p>
        <p style={{ color: "#b91c1c", overflowWrap: "anywhere" }}>
          {safeRecordText(this.state.error?.message, "Unknown project error")}
        </p>
        <button type="button" className="primary-button" onClick={this.props.onBack}>
          Back to Central Dashboard
        </button>
      </section>
    );
  }
}

function RecordsTable({
  records,
  onEdit,
  onDelete,
  onPrint,
  emptyText,
}) {
  if (!records.length) {
    return (
      <div className="empty-message">{emptyText}</div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Receipt No.</th>
            <th>Date</th>
            <th>Type</th>
            <th>Name / Purpose</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Details</th>
            <th>Attachment</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <strong>{receiptNumber(record)}</strong>
              </td>

              <td>{record.date}</td>

              <td>
                <strong
                  style={{
                    color:
                      record.type === "income"
                        ? "#15803d"
                        : "#dc2626",
                  }}
                >
                  {record.type === "income"
                    ? "Donation"
                    : "Expense"}
                </strong>
              </td>

              <td>
                <div className="record-person-with-photo">
                  {record.type === "income" && record.donorPhoto ? (
                    <a href={record.donorPhoto} target="_blank" rel="noreferrer" title="Open donor photo">
                      <img className="donor-avatar" src={record.donorPhoto} alt={`${record.person} donor`} />
                    </a>
                  ) : (
                    <span className="donor-avatar donor-avatar--placeholder" aria-hidden="true">
                      {record.type === "income" ? String(record.person || "?").slice(0, 1).toUpperCase() : "—"}
                    </span>
                  )}
                  <span>{record.person}</span>
                </div>
              </td>

              <td>
                Rs. {Number(record.amount).toLocaleString()}
              </td>

              <td>{record.method}</td>
              <td>{record.details || "—"}</td>

              <td>
                {record.slipData ? (
                  <a
                    href={record.slipData}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "7px 10px",
                      color: "white",
                      background: "#2563eb",
                      borderRadius: "6px",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    View File
                  </a>
                ) : (
                  "—"
                )}
              </td>

              <td>
                <div
                  style={{
                    display: "flex",
                    gap: "7px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onEdit(record)}
                    style={{
                      padding: "7px 11px",
                      color: "white",
                      background: "#d97706",
                      border: 0,
                      borderRadius: "7px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onPrint(record)}
                    style={{
                      padding: "7px 11px",
                      color: "white",
                      background: "#2563eb",
                      border: 0,
                      borderRadius: "7px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Print / PDF
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => onDelete(record.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App({ siteSettings, onSaveSiteSettings, savingSiteSettings, onAuthenticatedChange }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [systems, setSystems] = useState(loadSystems);
  const [transactions, setTransactions] =
    useState(loadTransactions);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [databaseMessage, setDatabaseMessage] = useState("Connecting to secure database...");

  const [selectedSystemId, setSelectedSystemId] =
    useState(null);

  const [activeSection, setActiveSection] =
    useState("income");

  const [entryForm, setEntryForm] = useState(emptyForm);
  const [editingRecordId, setEditingRecordId] =
    useState(null);

  const [fileInputKey, setFileInputKey] = useState(0);
  const [donorPhotoInputKey, setDonorPhotoInputKey] = useState(0);
  const [uploadingDonorPhoto, setUploadingDonorPhoto] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");
  const [dailyDate, setDailyDate] = useState(getToday());
  const [monthlyDate, setMonthlyDate] =
    useState(getCurrentMonth());
  const [combinedReportPeriod, setCombinedReportPeriod] = useState("all");
  const [combinedReportDate, setCombinedReportDate] = useState(getToday());
  const [combinedReportMonth, setCombinedReportMonth] = useState(getCurrentMonth());
  const [combinedReportYear, setCombinedReportYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    if (!selectedSystemId) return undefined;

    const moveProjectPageToTop = () => {
      if (typeof window.scrollTo === "function") {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    moveProjectPageToTop();
    const animationFrame = typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame(moveProjectPageToTop)
      : null;
    const timer = window.setTimeout(moveProjectPageToTop, 80);

    return () => {
      if (animationFrame !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(animationFrame);
      }
      window.clearTimeout(timer);
    };
  }, [selectedSystemId]);

  useEffect(() => {
    onAuthenticatedChange?.(loggedIn);
  }, [loggedIn, onAuthenticatedChange]);

  useEffect(() => {
    localStorage.setItem(
      "sangrahnSystems",
      JSON.stringify(systems)
    );
  }, [systems]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "sangrahnTransactions",
        JSON.stringify(transactions)
      );
    } catch {
      alert(
        "Browser storage is full. Please use a smaller receipt file."
      );
    }
  }, [transactions]);

  async function loadFromDatabase() {
    try {
      const databaseData = await fetchDatabaseData();
      const localSystems = loadSystems();
      const localTransactions = loadTransactions();
      const databaseTransactions = withoutLegacyTransactions(databaseData.transactions);
      const databaseSlugs = new Set(databaseData.systems.map((system) => String(system.id)));
      const mergedSystems = normalizeSystems([
        ...databaseData.systems,
        ...localSystems.filter((system) => !databaseSlugs.has(String(system.id))),
      ]);
      if (databaseTransactions.length === 0 && localTransactions.length > 0) {
        setSystems(mergedSystems.length ? mergedSystems : localSystems);
        setTransactions(localTransactions);
        setDatabaseMessage("Local records are being migrated to Supabase...");
      } else {
        setSystems(databaseData.systems.length ? mergedSystems : normalizeSystems(localSystems));
        setTransactions(databaseTransactions);
        setDatabaseMessage("Database connected");
      }
      setDatabaseReady(true);
    } catch (error) {
      console.error(error);
      setDatabaseMessage("Database connection failed. Check Supabase settings.");
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session && await isCurrentUserAdmin(data.session.user)) {
        setLoggedIn(true);
        setUsername(data.session.user.email || "");
        loadFromDatabase();
      } else if (data.session) {
        await supabase.auth.signOut();
      }
    });
  }, []);

  useEffect(() => {
    if (!loggedIn || !databaseReady) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        await syncDatabaseData(systems, transactions);
        setDatabaseMessage("All changes saved to Supabase");
      } catch (error) {
        console.error(error);
        setDatabaseMessage(`Database save failed: ${error.message}`);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [systems, transactions, loggedIn, databaseReady]);

  const safeSystems = Array.isArray(systems) ? systems : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const selectedSystem = safeSystems.find(
    (system) => String(system.id ?? "") === String(selectedSystemId ?? "")
  );
  const projectProfiles = siteSettings?.projectProfilesByProject
    && typeof siteSettings.projectProfilesByProject === "object"
    && !Array.isArray(siteSettings.projectProfilesByProject)
      ? siteSettings.projectProfilesByProject
      : {};
  const selectedWorkParentId = typeof workParentId === "function"
    ? workParentId(selectedSystem, projectProfiles)
    : null;
  // Never allow an optional project-type helper to take down the finance
  // entry screen. Some older deployed chunks/browser caches exposed one of
  // these imports as a non-function (the minified "l is not a function"
  // crash). Resolve every flag defensively once and render from booleans.
  const safeProjectCheck = (check, project) => {
    try {
      return typeof check === "function" ? Boolean(check(project)) : false;
    } catch (error) {
      console.warn("Optional project check was skipped", error);
      return false;
    }
  };
  const selectedIsDemography = safeProjectCheck(isDemographyProject, selectedSystem);
  const selectedIsBloodBank = safeProjectCheck(isBloodBankProject, selectedSystem);
  const selectedIsMosqueParent = safeProjectCheck(isMosqueParent, selectedSystem);
  const selectedIsMosqueChild = safeProjectCheck(isMosqueChild, selectedSystem);
  const selectedIsWelfareParent = safeProjectCheck(isWelfareParent, selectedSystem);
  const selectedIsWelfareChild = safeProjectCheck(isWelfareChild, selectedSystem);
  const selectedIsWorkItem = safeProjectCheck(
    (project) => isWorkItem(project, projectProfiles),
    selectedSystem
  );
  const relatedChildIdsFor = (systemOrId) => (
    typeof isMosqueParent === "function" && isMosqueParent(systemOrId)
      ? mosqueChildSystems(safeSystems).map((system) => system.id)
      : typeof isWelfareParent === "function" && isWelfareParent(systemOrId)
        ? welfareChildSystems(safeSystems).map((system) => system.id)
        : []
  );

  // The finance page must remain usable even when an old project/profile row
  // has an unexpected shape.  Previously one bad helper call crashed the whole
  // admin application as soon as a project card was opened.
  const selectedTransactions = (() => {
    try {
      const projectRecords = typeof recordsForProject === "function"
        ? recordsForProject(
            safeTransactions,
            safeSystems,
            selectedSystemId,
            projectProfiles,
            relatedChildIdsFor(selectedSystemId)
          )
        : safeTransactions.filter(
            (record) => String(record?.systemId || "") === String(selectedSystemId || "")
          );

      return (Array.isArray(projectRecords) ? projectRecords : [])
        .map((record, index) => normalizeTransactionRecord(record, index))
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    } catch (error) {
      console.error("Project records were repaired for the admin finance page", error);
      return safeTransactions
        .filter((record) => String(record?.systemId || "") === String(selectedSystemId || ""))
        .map((record, index) => normalizeTransactionRecord(record, index));
    }
  })();

  const selectedTotals = totalsFor(
    selectedTransactions
  );
  const selectedWorkBudget = selectedWorkParentId
    ? Math.max(0, Number(projectProfiles[selectedSystemId]?.budget) || 0)
    : 0;

  const financeSections = selectedWorkParentId
    ? [
        ["income", "Add Donation"],
        ["expense", "Add Expense"],
        ["ledger", "Ledger / Report"],
      ]
    : [
        ["income", "Donations"],
        ["expense", "Expenses"],
        ["daily", "Daily Report"],
        ["monthly", "Monthly Report"],
      ];

  const allTotals = totalsFor(safeTransactions);

  const combinedDonationRecords = safeTransactions.filter((record) => {
    if (record?.type !== "income") return false;
    const recordDate = String(record?.date || "");
    if (combinedReportPeriod === "daily") return recordDate === combinedReportDate;
    if (combinedReportPeriod === "monthly") return recordDate.startsWith(combinedReportMonth);
    if (combinedReportPeriod === "yearly") return recordDate.startsWith(`${combinedReportYear}-`);
    return true;
  });

  const combinedDonationTotal = combinedDonationRecords.reduce(
    (total, record) => total + (Number(record?.amount) || 0),
    0
  );
  const combinedDonorSummary = donorSummaryFor(combinedDonationRecords);

  const combinedDonationReportTitle = combinedReportPeriod === "daily"
    ? `Combined Daily Donation Report (${combinedReportDate})`
    : combinedReportPeriod === "monthly"
      ? `Combined Monthly Donation Report (${combinedReportMonth})`
      : combinedReportPeriod === "yearly"
        ? `Combined Yearly Donation Report (${combinedReportYear})`
        : "Combined Complete Donation Report - All Projects";

  const sectionRecords = selectedTransactions.filter(
    (record) => record.type === activeSection
  );

  const donorRecords = selectedTransactions.filter(
    (record) => {
      const search = donorSearch.trim().toLowerCase();

      return (
        record.type === "income" &&
        search &&
        String(record.person)
          .toLowerCase()
          .includes(search)
      );
    }
  );

  const donorTotal = donorRecords.reduce(
    (total, record) =>
      total + Number(record.amount),
    0
  );

  const reportRecords = selectedTransactions.filter(
    (record) => {
      if (activeSection === "daily") {
        return record.date === dailyDate;
      }

      if (activeSection === "monthly") {
        return record.date.startsWith(monthlyDate);
      }

      return true;
    }
  );

  const reportTotals = totalsFor(reportRecords);

  async function handleLogin(event) {
    event.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({ email: username.trim(), password });
    if (!error && await isCurrentUserAdmin(data.user)) {
      setLoggedIn(true);
      await loadFromDatabase();
    } else {
      if (!error) await supabase.auth.signOut();
      alert(error ? "Incorrect email or password" : "This is a donor account, not an administrator account.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setDatabaseReady(false);
    setSelectedSystemId(null);
    setUsername("");
    setPassword("");
  }

  function resetForm() {
    setEditingRecordId(null);
    setEntryForm(emptyForm());

    setFileInputKey(
      (currentKey) => currentKey + 1
    );
    setDonorPhotoInputKey(
      (currentKey) => currentKey + 1
    );
  }

  function openSystem(systemId) {
    const normalizedId = String(systemId ?? "").trim();
    if (!normalizedId) return;

    setSelectedSystemId(normalizedId);
    setActiveSection("income");
    setDonorSearch("");
    resetForm();
    if (typeof window.scrollTo === "function") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }

  async function createWork(parentProjectId, work) {
    const name = work.name.trim();
    if (!name) throw new Error("Work name is required.");
    const description = work.description.trim();
    const budget = Math.max(0, Number(work.budget) || 0);
    const id = createWorkItemId(parentProjectId);
    const nextWork = {
      id,
      parentProjectId,
      name,
      nameUr: name,
      description,
      descriptionUr: description,
      icon: "🛠️",
      isActive: true,
    };
    const nextSettings = {
      ...siteSettings,
      projectProfilesByProject: {
        ...projectProfiles,
        [id]: {
          parentProjectId,
          nameEn: name,
          nameUr: name,
          descriptionEn: description,
          descriptionUr: description,
          coverImage: "",
          galleryUrls: [],
          status: "in-progress",
          budget,
          completionPercent: 0,
          startDate: "",
          expectedCompletionDate: "",
          planEn: "",
          planUr: "",
        },
      },
    };

    await onSaveSiteSettings(nextSettings);
    setSystems((current) => normalizeSystems([...current, nextWork]));
    openSystem(id);
  }

  async function deleteSystemPermanently(system) {
    const systemId = String(system?.id || "");
    if (!systemId) throw new Error("Project ID is missing.");

    const childIds = systems
      .filter((candidate) => workParentId(candidate, projectProfiles) === systemId)
      .map((candidate) => String(candidate.id));
    const deletedIds = new Set([...childIds, systemId]);
    const relatedRecordCount = transactions.filter(
      (record) => deletedIds.has(String(record.systemId))
    ).length;
    if (relatedRecordCount) {
      throw new Error(`This project contains ${relatedRecordCount} financial record(s). Delete or move those records first so the accounts remain safe.`);
    }

    for (const deletedId of [...childIds, systemId]) {
      await deleteDatabaseProject(deletedId);
    }

    setTransactions((current) => current.filter(
      (record) => !deletedIds.has(String(record.systemId))
    ));
    setSystems((current) => normalizeSystems(current.filter(
      (candidate) => !deletedIds.has(String(candidate.id))
    )));

    if (deletedIds.has(String(selectedSystemId || ""))) {
      const parentId = workParentId(system, projectProfiles);
      setSelectedSystemId(parentId && !deletedIds.has(parentId) ? parentId : null);
    }

    const nextProfiles = { ...projectProfiles };
    deletedIds.forEach((deletedId) => delete nextProfiles[deletedId]);
    try {
      await onSaveSiteSettings({
        ...siteSettings,
        projectProfilesByProject: nextProfiles,
      });
    } catch (error) {
      console.warn("Project was deleted, but its unused profile could not be cleaned up.", error);
    }
  }

  function openAdminNotification(item) {
    const notificationType = `${item?.event_type || ""} ${item?.source_table || ""}`.toLowerCase();
    if (notificationType.includes("complaint")) {
      setSelectedSystemId(null);
      window.setTimeout(() => document.getElementById("complaint-admin")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      return;
    }
    if (notificationType.includes("blood")) {
      const bloodSystem = systems.find((system) => isBloodBankProject(system));
      if (bloodSystem) openSystem(bloodSystem.id);
      return;
    }
    if (item?.source_id && systems.some((system) => system.id === item.source_id)) {
      openSystem(item.source_id);
    }
  }

  function changeSection(sectionId) {
    setActiveSection(sectionId);
    resetForm();
  }

  function addNewSystem() {
    const name = window.prompt(
      "Enter the name of the new management system:"
    );

    if (!name?.trim()) {
      return;
    }

    setSystems((currentSystems) => normalizeSystems([
      ...currentSystems,
      {
        id: Date.now().toString(),
        name: name.trim(),
        description: "Community management system",
        icon: "📁",
      },
    ]));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      alert(
        "The receipt file must be smaller than 1.5 MB"
      );

      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setEntryForm((currentForm) => ({
        ...currentForm,
        slipName: file.name,
        slipData: reader.result,
      }));
    };

    reader.onerror = () => {
      alert("The receipt could not be read");
    };

    reader.readAsDataURL(file);
  }

  function removeFile() {
    setEntryForm((currentForm) => ({
      ...currentForm,
      slipName: "",
      slipData: "",
    }));

    setFileInputKey(
      (currentKey) => currentKey + 1
    );
  }

  async function handleDonorPhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDonorPhoto(true);
    setDatabaseMessage("Uploading donor photo...");

    try {
      const uploaded = await uploadWebsiteImage(file, "donors");
      setEntryForm((currentForm) => ({
        ...currentForm,
        donorPhoto: uploaded.url,
        donorPhotoName: uploaded.name,
      }));
      setDatabaseMessage("Donor photo uploaded");
    } catch (error) {
      console.error(error);
      alert(error.message || "Donor photo could not be uploaded");
      setDatabaseMessage(`Donor photo upload failed: ${error.message}`);
      event.target.value = "";
    } finally {
      setUploadingDonorPhoto(false);
    }
  }

  function removeDonorPhoto() {
    setEntryForm((currentForm) => ({
      ...currentForm,
      donorPhoto: "",
      donorPhotoName: "",
    }));
    setDonorPhotoInputKey((currentKey) => currentKey + 1);
  }

  function startEditing(record) {
    setSelectedSystemId(record.systemId);
    setActiveSection(record.type);
    setEditingRecordId(record.id);

    setEntryForm({
      person: record.person,
      amount: record.amount,
      date: record.date,
      method: record.method,
      details: record.details || "",
      slipName: record.slipName || "",
      slipData: record.slipData || "",
      donorPhoto: record.donorPhoto || "",
      donorPhotoName: record.donorPhotoName || "",
    });

    setFileInputKey(
      (currentKey) => currentKey + 1
    );
    setDonorPhotoInputKey(
      (currentKey) => currentKey + 1
    );

    setTimeout(() => {
      document
        .getElementById("entry-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  async function saveRecord(event) {
    event.preventDefault();

    const amount = Number(entryForm.amount);

    if (!entryForm.person.trim() || amount <= 0) {
      alert(
        "Please enter a name or purpose and a valid amount"
      );

      return;
    }

    const recordData = {
      systemId: selectedSystemId,
      type: activeSection,
      person: entryForm.person.trim(),
      amount,
      date: entryForm.date,
      method: entryForm.method,
      details: entryForm.details.trim(),
      slipName: entryForm.slipName,
      slipData: entryForm.slipData,
      donorPhoto: activeSection === "income" ? entryForm.donorPhoto : "",
      donorPhotoName: activeSection === "income" ? entryForm.donorPhotoName : "",
    };

    let nextTransactions;

    if (editingRecordId) {
      nextTransactions = transactions.map((record) =>
          record.id === editingRecordId
            ? {
                ...record,
                ...recordData,
              }
            : record
      );
    } else {
      nextTransactions = [
        {
          ...recordData,
          id: Date.now().toString(),
        },
        ...transactions,
      ];
    }

    setTransactions(nextTransactions);
    setDatabaseMessage("Saving record to Supabase...");

    try {
      await syncDatabaseData(systems, nextTransactions);
      setDatabaseReady(true);
      setDatabaseMessage("All changes saved to Supabase");

      alert(
        editingRecordId
          ? "Record updated and saved to database"
          : activeSection === "income"
            ? "Donation saved to database successfully"
            : "Expense saved to database successfully"
      );
    } catch (error) {
      console.error(error);
      setDatabaseMessage(`Database save failed: ${error.message}`);
      alert(`Database save failed: ${error.message}`);
    }

    resetForm();
  }

  async function deleteRecord(recordId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDatabaseTransaction(recordId);
    } catch (error) {
      console.error(error);
      alert(`Record could not be deleted: ${error.message}`);
      return;
    }

    setTransactions((currentRecords) =>
      currentRecords.filter(
        (record) => record.id !== recordId
      )
    );

    if (editingRecordId === recordId) {
      resetForm();
    }
  }

  function printRecord(record) {
    const project = systems.find(
      (system) => system.id === record.systemId
    );

    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=750"
    );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print the receipt"
      );

      return;
    }

    const title =
      record.type === "income"
        ? "DONATION RECEIPT"
        : "EXPENSE VOUCHER";

    const partyLabel =
      record.type === "income"
        ? "Received From"
        : "Paid To / Purpose";

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />

          <title>
            ${title} -
            ${escapeHtml(receiptNumber(record))}
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 35px;
              color: #17211b;
              font-family: Arial, sans-serif;
              background: #f3f6f4;
            }

            .receipt {
              max-width: 780px;
              margin: auto;
              padding: 38px;
              background: white;
              border: 2px solid #166534;
              border-radius: 15px;
            }

            .header {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding-bottom: 22px;
              border-bottom: 2px solid #dcfce7;
            }

            h1 {
              margin: 0;
              color: #14532d;
              font-size: 28px;
            }

            .subtitle {
              margin: 6px 0 0;
              color: #6b7280;
            }

            .receipt-info {
              text-align: right;
            }

            .receipt-info h2 {
              margin: 0 0 8px;
              color: #166534;
              font-size: 20px;
            }

            .amount {
              padding: 22px;
              margin: 28px 0;
              text-align: center;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 12px;
            }

            .amount p {
              margin: 0 0 7px;
              color: #6b7280;
            }

            .amount h2 {
              margin: 0;
              color: #14532d;
              font-size: 32px;
            }

            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px 25px;
            }

            .detail {
              padding: 13px 0;
              border-bottom: 1px solid #e5e7eb;
            }

            .detail span {
              display: block;
              margin-bottom: 5px;
              color: #6b7280;
              font-size: 12px;
              text-transform: uppercase;
            }

            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 80px;
              margin-top: 65px;
            }

            .signature {
              padding-top: 8px;
              text-align: center;
              border-top: 1px solid #374151;
            }

            .footer {
              margin-top: 35px;
              color: #6b7280;
              font-size: 12px;
              text-align: center;
            }

            @media print {
              body {
                padding: 0;
                background: white;
              }

              .receipt {
                max-width: none;
                border-radius: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="receipt">
            <div class="header">
              <div>
                <h1>Clean & Green Sangran</h1>

                <p class="subtitle">
                  ${escapeHtml(
                    project?.name ||
                      "Management System"
                  )}
                </p>
              </div>

              <div class="receipt-info">
                <h2>${title}</h2>

                <strong>
                  ${escapeHtml(receiptNumber(record))}
                </strong>
              </div>
            </div>

            <div class="amount">
              <p>Amount</p>

              <h2>
                Rs.
                ${Number(
                  record.amount
                ).toLocaleString()}
              </h2>
            </div>

            <div class="details">
              <div class="detail">
                <span>${partyLabel}</span>
                <strong>
                  ${escapeHtml(record.person)}
                </strong>
              </div>

              <div class="detail">
                <span>Date</span>
                <strong>
                  ${escapeHtml(record.date)}
                </strong>
              </div>

              <div class="detail">
                <span>Payment Method</span>
                <strong>
                  ${escapeHtml(record.method)}
                </strong>
              </div>

              <div class="detail">
                <span>Transaction Type</span>
                <strong>
                  ${
                    record.type === "income"
                      ? "Donation"
                      : "Expense"
                  }
                </strong>
              </div>

              <div class="detail">
                <span>Details</span>
                <strong>
                  ${escapeHtml(
                    record.details || "—"
                  )}
                </strong>
              </div>

              <div class="detail">
                <span>Attachment</span>
                <strong>
                  ${escapeHtml(
                    record.slipName ||
                      "Not attached"
                  )}
                </strong>
              </div>
            </div>

            <div class="signatures">
              <div class="signature">
                Received / Paid By
              </div>

              <div class="signature">
                Authorized Signature
              </div>
            </div>

            <div class="footer">
              This is a computer-generated receipt
              from Clean & Green Sangran.
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  }

  function printCombinedReport(records, reportTitle) {
    if (!records.length) {
      alert("No records are available to print");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      alert("Please allow pop-ups to print the report");
      return;
    }

    const totals = totalsFor(records);
    const donorSummary = donorSummaryFor(records);
    const donationsOnly = records.every((record) => record.type === "income");
    const donorSummaryRows = donorSummary.people
      .map((person, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(person.name)}</td>
          <td>${person.entries}</td>
          <td>${person.entries === 1 ? "Single entry" : "Repeat entries"}</td>
          <td class="amount-cell">Rs. ${person.amount.toLocaleString()}</td>
        </tr>`)
      .join("");
    const rows = records
      .map((record, index) => {
        const project = systems.find((system) => system.id === record.systemId);
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(receiptNumber(record))}</td>
            <td>${escapeHtml(record.date)}</td>
            <td>${record.type === "income" ? "Donation" : "Expense"}</td>
            <td>${escapeHtml(record.person)}</td>
            <td>${escapeHtml(project?.name || "—")}</td>
            <td>${escapeHtml(record.method)}</td>
            <td>${escapeHtml(record.details || "—")}</td>
            <td class="amount-cell">Rs. ${Number(record.amount).toLocaleString()}</td>
          </tr>`;
      })
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(reportTitle)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 28px; color: #17211b; font-family: Arial, sans-serif; }
            .header { padding-bottom: 18px; border-bottom: 3px solid #166534; }
            h1 { margin: 0; color: #14532d; font-size: 27px; }
            h2 { margin: 7px 0 0; font-size: 18px; }
            .meta { margin-top: 7px; color: #6b7280; font-size: 12px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 22px 0; }
            .summary div { padding: 13px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
            .summary span { display: block; margin-bottom: 5px; color: #64748b; font-size: 11px; }
            .summary strong { color: #14532d; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { color: white; background: #166534; }
            th, td { padding: 8px 6px; text-align: left; border: 1px solid #d1d5db; vertical-align: top; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            .amount-cell { white-space: nowrap; font-weight: bold; }
            .footer { margin-top: 18px; color: #6b7280; font-size: 11px; text-align: center; }
            @page { size: landscape; margin: 12mm; }
            @media print { body { padding: 0; } thead { display: table-header-group; } tr { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Clean & Green Sangran</h1>
            <h2>${escapeHtml(reportTitle)}</h2>
            <div class="meta">Generated: ${escapeHtml(new Date().toLocaleString())} | Total records: ${records.length}</div>
          </div>
          <div class="summary">
            <div><span>TOTAL DONATIONS</span><strong>Rs. ${totals.income.toLocaleString()}</strong></div>
            <div><span>TOTAL EXPENSES</span><strong>Rs. ${totals.expenses.toLocaleString()}</strong></div>
            <div><span>BALANCE</span><strong>Rs. ${totals.balance.toLocaleString()}</strong></div>
          </div>
          ${donationsOnly ? `
            <h2 style="margin: 18px 0 10px; color: #14532d;">Donor Summary</h2>
            <div class="summary">
              <div><span>TOTAL DONATION ENTRIES</span><strong>${records.length}</strong></div>
              <div><span>UNIQUE DONORS</span><strong>${donorSummary.uniquePeople}</strong></div>
              <div><span>SINGLE / REPEAT DONORS</span><strong>${donorSummary.singleEntryPeople} / ${donorSummary.repeatEntryPeople}</strong></div>
            </div>
            <table style="margin-bottom: 22px;">
              <thead><tr><th>#</th><th>Donor Name</th><th>Entries</th><th>Status</th><th>Total Donation</th></tr></thead>
              <tbody>${donorSummaryRows}</tbody>
            </table>
            <h2 style="margin: 18px 0 10px; color: #14532d;">Donation Entry Details</h2>
          ` : ""}
          <table>
            <thead><tr><th>#</th><th>Receipt No.</th><th>Date</th><th>Type</th><th>Name / Purpose</th><th>Project</th><th>Method</th><th>Details</th><th>Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">Computer-generated combined report from Clean & Green Sangran.</div>
        </body>
      </html>`);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  if (!loggedIn) {
    return (
      <div className="login-page">
        <form
          className="login-card"
          onSubmit={handleLogin}
        >
          <h1>Clean & Green</h1>
          <h2>Sangran</h2>
          <p>Central Admin Login</p>

          <input
            type="email"
            placeholder="Admin Email"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button
            className="primary-button"
            type="submit"
          >
            Login
          </button>

          <p
            style={{
              marginTop: "18px",
              color: "#777",
              fontSize: "13px",
            }}
          >
            Sign in with your approved Supabase Admin account.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h2>Clean & Green Sangran</h2>
          <p>Central Management System • {databaseMessage}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AdminNotificationCenter onOpenNotification={openAdminNotification} />
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container">
        {selectedSystem ? (
          <AdminProjectBoundary
            key={String(selectedSystem.id || "")}
            projectId={String(selectedSystem.id || "")}
            onBack={() => setSelectedSystemId(null)}
          >
            <div
              className="admin-project-screen"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                overflowX: "hidden",
                overflowY: "auto",
                overscrollBehavior: "contain",
                width: "100%",
                padding: "clamp(12px, 2vw, 24px) clamp(12px, 3vw, 36px) 64px",
                background: "linear-gradient(180deg, #f8fbf9 0%, #edf5ef 100%)",
              }}
            >
            <button
              className="logout-button"
              onClick={() =>
                setSelectedSystemId(
                  selectedWorkParentId
                    ? selectedWorkParentId
                    : selectedIsMosqueChild
                      ? "mosque"
                      : selectedIsWelfareChild
                        ? "welfare"
                        : null
                )
              }
              style={{
                marginBottom: "20px",
                color: "white",
                background: "#166534",
              }}
            >
              {selectedWorkParentId
                ? "← Project Works"
                : selectedIsMosqueChild
                  ? "← Mosque Management"
                  : selectedIsWelfareChild
                    ? "← Welfare Management"
                    : "← Central Dashboard"}
            </button>

            <h1 className="page-heading">
              <ProjectIcon project={selectedSystem} size={42} />{" "}
              {selectedSystem.name}
            </h1>

            <p>
              {selectedSystem.description ||
                selectedSystem.englishName}
            </p>

            {selectedIsDemography ? (
              <DemographyAdmin />
            ) : selectedIsBloodBank ? (
              <BloodBankAdmin settings={siteSettings} onSaveSettings={onSaveSiteSettings} savingSettings={savingSiteSettings} />
            ) : selectedIsMosqueParent ? (
              <MosqueManagementHub
                systems={systems}
                transactions={transactions}
                profiles={projectProfiles}
                onOpenSystem={openSystem}
                adminMode
              />
            ) : <>
            {selectedWorkParentId ? (
              <div className="summary-grid">
                <div className="summary-card"><p>Work Budget</p><h2>Rs. {selectedWorkBudget.toLocaleString()}</h2></div>
                <div className="summary-card"><p>Work Donations</p><h2>Rs. {selectedTotals.income.toLocaleString()}</h2></div>
                <div className="summary-card"><p>Work Expenses</p><h2>Rs. {selectedTotals.expenses.toLocaleString()}</h2></div>
                <div className="summary-card"><p>Work Balance</p><h2>Rs. {selectedTotals.balance.toLocaleString()}</h2></div>
              </div>
            ) : (
              <SummaryCards
                totals={selectedTotals}
                labels={[
                  "Total Donations",
                  "Total Expenses",
                  "Current Balance",
                ]}
              />
            )}

            <section
              id="project-finance-admin"
              className="panel"
              style={{ marginTop: "22px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "12px",
                }}
              >
                {financeSections.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      changeSection(id)
                    }
                    style={{
                      marginTop: 0,
                      color:
                        activeSection === id
                          ? "white"
                          : "#166534",
                      background:
                        activeSection === id
                          ? "#166534"
                          : "#dcfce7",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {activeSection === "income" && (
              <section
                className="panel"
                style={{ marginTop: "22px" }}
              >
                <h3>Search Donor History</h3>

                <div
                  className="form-field"
                  style={{ maxWidth: "500px" }}
                >
                  <label>Enter donor name</label>

                  <input
                    type="search"
                    value={donorSearch}
                    onChange={(event) =>
                      setDonorSearch(
                        event.target.value
                      )
                    }
                    placeholder="For example: Donor Name"
                  />
                </div>

                {donorSearch.trim() && (
                  <>
                    <div className="summary-grid">
                      <div className="summary-card">
                        <p>Donor Name</p>
                        <h2>{donorSearch}</h2>
                      </div>

                      <div className="summary-card">
                        <p>Total Donated</p>
                        <h2>
                          Rs.{" "}
                          {donorTotal.toLocaleString()}
                        </h2>
                      </div>

                      <div className="summary-card">
                        <p>Number of Donations</p>
                        <h2>{donorRecords.length}</h2>
                      </div>
                    </div>

                    <div
                      style={{ marginTop: "20px" }}
                    >
                      <RecordsTable
                        records={donorRecords}
                        onEdit={startEditing}
                        onDelete={deleteRecord}
                        onPrint={printRecord}
                        emptyText="No donor found with this name"
                      />
                    </div>
                  </>
                )}
              </section>
            )}

            {activeSection === "income" ||
            activeSection === "expense" ? (
              <div className="content-grid">
                <form
                  id="entry-form"
                  className="panel"
                  onSubmit={saveRecord}
                >
                  <h3>
                    {editingRecordId
                      ? "Edit Record"
                      : activeSection === "income"
                        ? "Add New Donation"
                        : "Add New Expense"}
                  </h3>

                  {editingRecordId && (
                    <p
                      style={{
                        padding: "10px",
                        color: "#92400e",
                        background: "#fef3c7",
                        borderRadius: "8px",
                      }}
                    >
                      You are editing an existing
                      record.
                    </p>
                  )}

                  <div className="form-field">
                    <label>
                      {activeSection === "income"
                        ? "Donor Name"
                        : "Expense Purpose / Recipient"}
                    </label>

                    <input
                      type="text"
                      value={entryForm.person}
                      onChange={(event) =>
                        setEntryForm({
                          ...entryForm,
                          person:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {activeSection === "income" && (
                    <div className="form-field donor-photo-upload">
                      <label>Donor Photo (optional)</label>
                      <small>Add a clear donor picture from your phone or computer gallery.</small>

                      <input
                        key={donorPhotoInputKey}
                        type="file"
                        accept="image/*"
                        onChange={handleDonorPhotoChange}
                        disabled={uploadingDonorPhoto}
                      />

                      {uploadingDonorPhoto && (
                        <p className="donor-photo-status">Uploading photo...</p>
                      )}

                      {entryForm.donorPhoto && (
                        <div className="donor-photo-preview">
                          <img src={entryForm.donorPhoto} alt="Selected donor" />
                          <div>
                            <b>{entryForm.donorPhotoName || "Donor photo"}</b>
                            <button type="button" onClick={removeDonorPhoto}>
                              Remove Photo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-field">
                    <label>Amount</label>

                    <input
                      type="number"
                      min="1"
                      value={entryForm.amount}
                      onChange={(event) =>
                        setEntryForm({
                          ...entryForm,
                          amount:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Date</label>

                    <input
                      type="date"
                      value={entryForm.date}
                      onChange={(event) =>
                        setEntryForm({
                          ...entryForm,
                          date: event.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Payment Method</label>

                    <select
                      value={entryForm.method}
                      onChange={(event) =>
                        setEntryForm({
                          ...entryForm,
                          method:
                            event.target.value,
                        })
                      }
                    >
                      <option>Cash</option>
                      <option>Bank</option>
                      <option>JazzCash</option>
                      <option>EasyPaisa</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Details</label>

                    <input
                      type="text"
                      value={entryForm.details}
                      onChange={(event) =>
                        setEntryForm({
                          ...entryForm,
                          details:
                            event.target.value,
                        })
                      }
                      placeholder="Optional details"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Receipt image or PDF
                    </label>

                    <input
                      key={fileInputKey}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />

                    {entryForm.slipName && (
                      <div
                        style={{ marginTop: "8px" }}
                      >
                        <small
                          style={{ color: "#15803d" }}
                        >
                          Attached:{" "}
                          {entryForm.slipName}
                        </small>

                        <button
                          type="button"
                          onClick={removeFile}
                          style={{
                            display: "block",
                            padding: "5px 9px",
                            marginTop: "7px",
                            color: "#dc2626",
                            background: "#fee2e2",
                            border: 0,
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          Remove Attachment
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={uploadingDonorPhoto}
                  >
                    {uploadingDonorPhoto
                      ? "Uploading Donor Photo..."
                      : editingRecordId
                      ? "Update Record"
                      : activeSection === "income"
                        ? "Save Donation"
                        : "Save Expense"}
                  </button>

                  {editingRecordId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        width: "100%",
                        padding: "11px",
                        marginTop: "9px",
                        color: "#374151",
                        background: "#e5e7eb",
                        border: 0,
                        borderRadius: "9px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel Editing
                    </button>
                  )}
                </form>

                <section className="panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <h3>
                      {activeSection === "income"
                        ? "Complete Donation Record"
                        : "Complete Expense Record"}
                    </h3>
                    <button
                      className="primary-button"
                      type="button"
                      style={{ width: "auto", padding: "10px 18px" }}
                      onClick={() => printCombinedReport(
                        sectionRecords,
                        `${selectedSystem?.name || "Project"} - ${activeSection === "income" ? "All Donations" : "All Expenses"}`
                      )}
                    >
                      Print All / Save PDF
                    </button>
                  </div>

                  <RecordsTable
                    records={sectionRecords}
                    onEdit={startEditing}
                    onDelete={deleteRecord}
                    onPrint={printRecord}
                    emptyText={
                      activeSection === "income"
                        ? "No donation record available"
                        : "No expense record available"
                    }
                  />
                </section>
              </div>
            ) : (
              <>
                <section
                  className="panel"
                  style={{ marginTop: "22px" }}
                >
                  <h3>
                    {activeSection === "daily"
                      ? "Daily Report"
                      : activeSection === "monthly"
                        ? "Monthly Report"
                        : "Complete Ledger / Report"}
                  </h3>

                  {(activeSection === "daily" || activeSection === "monthly") && (
                    <div
                      className="form-field"
                      style={{ maxWidth: "350px" }}
                    >
                      <label>
                        {activeSection === "daily"
                          ? "Select report date"
                          : "Select report month"}
                      </label>

                      {activeSection === "daily" ? (
                        <input
                          type="date"
                          value={dailyDate}
                          onChange={(event) =>
                            setDailyDate(
                              event.target.value
                            )
                          }
                        />
                      ) : (
                        <input
                          type="month"
                          value={monthlyDate}
                          onChange={(event) =>
                            setMonthlyDate(
                              event.target.value
                            )
                          }
                        />
                      )}
                    </div>
                  )}

                  <SummaryCards
                    totals={reportTotals}
                    labels={activeSection === "ledger" ? [
                      "Total Work Donations",
                      "Total Work Expenses",
                      "Work Balance",
                    ] : [
                      "Income During This Period",
                      "Expenses During This Period",
                      "Balance During This Period",
                    ]}
                  />
                </section>

                <section
                  className="panel"
                  style={{ marginTop: "22px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <h3>{activeSection === "ledger" ? "Complete Work Ledger" : "Report Details"}</h3>
                    <button
                      className="primary-button"
                      type="button"
                      style={{ width: "auto", padding: "10px 18px" }}
                      onClick={() => printCombinedReport(
                        reportRecords,
                        `${selectedSystem?.name || "Project"} - ${activeSection === "daily" ? `Daily Report (${dailyDate})` : activeSection === "monthly" ? `Monthly Report (${monthlyDate})` : "Complete Ledger / Report"}`
                      )}
                    >
                      Print Report / Save PDF
                    </button>
                  </div>

                  <RecordsTable
                    records={reportRecords}
                    onEdit={startEditing}
                    onDelete={deleteRecord}
                    onPrint={printRecord}
                    emptyText="No record found for the selected period"
                  />
                </section>
              </>
            )}

            <OptionalProjectPanelBoundary key={selectedSystem.id}>
              {selectedSystem.id === "plantation" && <PlantationSurveyAdmin />}
              {(selectedSystem.id === "welfare-filtration" || selectedSystem.id === "welfare-sports") && (
                <WelfareOperationsPanel
                  projectId={selectedSystem.id}
                  settings={siteSettings}
                  onSave={onSaveSiteSettings}
                  saving={savingSiteSettings}
                />
              )}
              {selectedSystem.id === "welfare-infrastructure" && (
                <InfrastructureAdmin
                  settings={siteSettings}
                  onSave={onSaveSiteSettings}
                  saving={savingSiteSettings}
                />
              )}
              {selectedIsWelfareParent && (
                <WelfareManagementHub
                  systems={systems}
                  onOpenSystem={openSystem}
                  getImage={(project) => (
                    siteSettings.projectProfilesByProject?.[project.id]?.coverImage
                    || project.coverImage
                    || ""
                  )}
                  getPhotoCount={(project) => {
                    const savedGallery = siteSettings.projectProfilesByProject?.[project.id]?.galleryUrls;
                    const gallery = Array.isArray(savedGallery) && savedGallery.length
                      ? savedGallery
                      : project.galleryUrls;
                    return Array.isArray(gallery) ? gallery.length : 0;
                  }}
                  adminMode
                />
              )}
              {!selectedIsWorkItem && (
                <WorkItemsHub
                  project={selectedSystem}
                  systems={systems}
                  transactions={transactions}
                  profiles={projectProfiles}
                  onOpenSystem={openSystem}
                  onCreateWork={createWork}
                  onDeleteWork={deleteSystemPermanently}
                  adminMode
                />
              )}
            </OptionalProjectPanelBoundary>
            </>}
            </div>
          </AdminProjectBoundary>
        ) : (
          <>
            <h1 className="page-heading">
              Central Dashboard
            </h1>

            <p>
              Combined summary of all management
              systems
            </p>

            <SummaryCards
              totals={allTotals}
              labels={[
                "Total Donations for All Projects",
                "Total Expenses for All Projects",
                "Combined Current Balance",
              ]}
            />

            <section className="panel" style={{ marginTop: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ marginBottom: "6px" }}>Combined Donation Report</h3>
                  <p style={{ margin: 0, color: "#6b7280" }}>
                    Daily, monthly, yearly or complete donation report for all projects.
                  </p>
                </div>
              </div>

              <div className="section-tabs" style={{ marginTop: "18px" }}>
                {[
                  ["daily", "Daily"],
                  ["monthly", "Monthly"],
                  ["yearly", "Yearly"],
                  ["all", "Complete"],
                ].map(([period, label]) => (
                  <button
                    key={period}
                    type="button"
                    className={combinedReportPeriod === period ? "active" : ""}
                    onClick={() => setCombinedReportPeriod(period)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {combinedReportPeriod !== "all" && (
                <div className="form-field" style={{ maxWidth: "350px", marginTop: "16px" }}>
                  <label>
                    {combinedReportPeriod === "daily"
                      ? "Select report date"
                      : combinedReportPeriod === "monthly"
                        ? "Select report month"
                        : "Select report year"}
                  </label>
                  {combinedReportPeriod === "daily" ? (
                    <input
                      type="date"
                      value={combinedReportDate}
                      onChange={(event) => setCombinedReportDate(event.target.value)}
                    />
                  ) : combinedReportPeriod === "monthly" ? (
                    <input
                      type="month"
                      value={combinedReportMonth}
                      onChange={(event) => setCombinedReportMonth(event.target.value)}
                    />
                  ) : (
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={combinedReportYear}
                      onChange={(event) => setCombinedReportYear(event.target.value)}
                    />
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "18px" }}>
                <div>
                  <div style={{ color: "#6b7280", marginBottom: "4px" }}>Donations in selected report</div>
                  <strong style={{ fontSize: "1.45rem", color: "#14532d" }}>
                    Rs. {combinedDonationTotal.toLocaleString("en-PK")}
                  </strong>
                  <div style={{ color: "#6b7280", marginTop: "4px" }}>
                    {combinedDonationRecords.length} donation record{combinedDonationRecords.length === 1 ? "" : "s"}
                  </div>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  style={{ width: "auto", marginTop: 0, padding: "11px 18px" }}
                  onClick={() => printCombinedReport(
                    combinedDonationRecords,
                    combinedDonationReportTitle
                  )}
                >
                  Print Report / Save PDF
                </button>
              </div>

              <div className="summary-grid" style={{ marginTop: "18px" }}>
                {[
                  ["Total Donation Entries", combinedDonationRecords.length],
                  ["Unique Donors", combinedDonorSummary.uniquePeople],
                  ["Single Entry Donors", combinedDonorSummary.singleEntryPeople],
                  ["Repeat Entry Donors", combinedDonorSummary.repeatEntryPeople],
                ].map(([label, value]) => (
                  <div className="summary-card" key={label}>
                    <p>{label}</p>
                    <h2>{value}</h2>
                  </div>
                ))}
              </div>

              <div className="table-wrapper" style={{ marginTop: "18px", maxHeight: "420px", overflowY: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Donor Name</th>
                      <th>Entries</th>
                      <th>Status</th>
                      <th>Total Donation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedDonorSummary.people.map((person, index) => (
                      <tr key={`${person.name}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{person.name}</td>
                        <td>{person.entries}</td>
                        <td>{person.entries === 1 ? "Single entry" : "Repeat entries"}</td>
                        <td><strong>Rs. {person.amount.toLocaleString("en-PK")}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <ComplaintAdmin />
            <MembershipAdmin />

            <ProjectManager
              systems={systems}
              setSystems={(updater) => setSystems((currentSystems) =>
                normalizeSystems(
                  typeof updater === "function" ? updater(currentSystems) : updater
                )
              )}
              settings={siteSettings}
              onSaveSettings={onSaveSiteSettings}
              saving={savingSiteSettings}
            />

            <WebsiteSettings settings={siteSettings} onSave={onSaveSiteSettings} saving={savingSiteSettings} />

            <CentralTools
              systems={systems}
              transactions={transactions}
              setSystems={setSystems}
              setTransactions={setTransactions}
              onOpenSystem={openSystem}
              onDeleteSystem={deleteSystemPermanently}
            />

            <h2
              style={{
                marginTop: "32px",
                color: "#166534",
              }}
            >
              Select a Management System
            </h2>

            <div className="summary-grid">
              {topLevelSystems(systems).map((system) => {
                const systemTotals = totalsFor(recordsForProject(
                  transactions,
                  systems,
                  system.id,
                  projectProfiles,
                  relatedChildIdsFor(system)
                ));

                return (
                  <button
                    key={system.id}
                    type="button"
                    className="summary-card"
                    onClick={() =>
                      openSystem(system.id)
                    }
                    style={{
                      border:
                        "1px solid #dcfce7",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{ fontSize: "35px" }}
                    >
                      <ProjectIcon project={system} size={35} />
                    </div>

                    <h2
                      style={{ marginTop: "10px" }}
                    >
                      {system.name}
                    </h2>

                    <p>
                      {system.description ||
                        system.englishName}
                    </p>

                    {isDemographyProject(system) ? (
                      <strong>Population Census</strong>
                    ) : !isBloodBankProject(system) && (
                      <strong>
                        Balance: Rs.{" "}
                        {systemTotals.balance.toLocaleString()}
                      </strong>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                className="summary-card"
                onClick={addNewSystem}
                style={{
                  border:
                    "2px dashed #16a34a",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "35px" }}>
                  ＋
                </div>

                <h2>Add New System</h2>
                <p>
                  Create another community project
                </p>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
