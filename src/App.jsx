import { useEffect, useState } from "react";
import "./App.css";
import CentralTools from "./CentralTools";
import ProjectManager from "./ProjectManager";
import WebsiteSettings from "./WebsiteSettings";
import ProjectIcon, { isBloodBankProject } from "./ProjectIcon";
import BloodBankAdmin from "./BloodBankAdmin";
import { isCurrentUserAdmin } from "./bloodBankService";
import { supabase } from "./supabase";
import { fetchDatabaseData, syncDatabaseData } from "./dataService";

const defaultSystems = [
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
    name: "Other Welfare Projects",
    description: "Other community projects",
    icon: "🤝",
  },
];

const defaultTransactions = [
  {
    id: "cemetery-first-record",
    systemId: "cemetery",
    type: "income",
    person: "Ghulam Mustafa",
    amount: 15000,
    date: "2026-07-08",
    method: "Bank",
    details: "Cemetery Fund",
    slipName: "",
    slipData: "",
  },
];

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
  };
}

function loadSystems() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("sangrahnSystems")
    );

    if (!Array.isArray(saved)) {
      return defaultSystems;
    }

    return saved.map((savedSystem) => {
      const fixedSystem = defaultSystems.find(
        (system) => system.id === savedSystem.id
      );

      return fixedSystem || savedSystem;
    });
  } catch {
    return defaultSystems;
  }
}

function loadTransactions() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("sangrahnTransactions")
    );

    if (!Array.isArray(saved)) {
      return defaultTransactions;
    }

    return saved.map((record) => {
      if (record.id === "cemetery-first-record") {
        return {
          ...record,
          person: "Ghulam Mustafa",
          method: "Bank",
          details: "Cemetery Fund",
        };
      }

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
  const income = records
    .filter((record) => record.type === "income")
    .reduce(
      (total, record) => total + Number(record.amount),
      0
    );

  const expenses = records
    .filter((record) => record.type === "expense")
    .reduce(
      (total, record) => total + Number(record.amount),
      0
    );

  return {
    income,
    expenses,
    balance: income - expenses,
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

              <td>{record.person}</td>

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

function App({ siteSettings, onSaveSiteSettings, savingSiteSettings }) {
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
  const [donorSearch, setDonorSearch] = useState("");
  const [dailyDate, setDailyDate] = useState(getToday());
  const [monthlyDate, setMonthlyDate] =
    useState(getCurrentMonth());

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
      const databaseSlugs = new Set(databaseData.systems.map((system) => String(system.id)));
      const mergedSystems = [...databaseData.systems, ...localSystems.filter((system) => !databaseSlugs.has(String(system.id)))];
      if (databaseData.transactions.length === 0 && localTransactions.length > 0) {
        setSystems(mergedSystems.length ? mergedSystems : localSystems);
        setTransactions(localTransactions);
        setDatabaseMessage("Local records are being migrated to Supabase...");
      } else {
        setSystems(databaseData.systems.length ? databaseData.systems : localSystems);
        setTransactions(databaseData.transactions);
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

  const selectedSystem = systems.find(
    (system) => system.id === selectedSystemId
  );

  const selectedTransactions = transactions
    .filter(
      (record) => record.systemId === selectedSystemId
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const selectedTotals = totalsFor(
    selectedTransactions
  );

  const allTotals = totalsFor(transactions);

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
  }

  function openSystem(systemId) {
    setSelectedSystemId(systemId);
    setActiveSection("income");
    setDonorSearch("");
    resetForm();
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

    setSystems((currentSystems) => [
      ...currentSystems,
      {
        id: Date.now().toString(),
        name: name.trim(),
        description: "Community management system",
        icon: "📁",
      },
    ]);
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
    });

    setFileInputKey(
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

  function deleteRecord(recordId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmed) {
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

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <main className="container">
        {selectedSystem ? (
          <>
            <button
              className="logout-button"
              onClick={() =>
                setSelectedSystemId(null)
              }
              style={{
                marginBottom: "20px",
                color: "white",
                background: "#166534",
              }}
            >
              ← Central Dashboard
            </button>

            <h1 className="page-heading">
              <ProjectIcon project={selectedSystem} size={42} />{" "}
              {selectedSystem.name}
            </h1>

            <p>
              {selectedSystem.description ||
                selectedSystem.englishName}
            </p>

            {isBloodBankProject(selectedSystem) ? <BloodBankAdmin settings={siteSettings} onSaveSettings={onSaveSiteSettings} savingSettings={savingSiteSettings} /> : <><SummaryCards
              totals={selectedTotals}
              labels={[
                "Total Donations",
                "Total Expenses",
                "Current Balance",
              ]}
            />

            <section
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
                {[
                  ["income", "Donations"],
                  ["expense", "Expenses"],
                  ["daily", "Daily Report"],
                  ["monthly", "Monthly Report"],
                ].map(([id, label]) => (
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
                    placeholder="For example: Ghulam Mustafa"
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
                  >
                    {editingRecordId
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
                      : "Monthly Report"}
                  </h3>

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

                  <SummaryCards
                    totals={reportTotals}
                    labels={[
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
                    <h3>Report Details</h3>
                    <button
                      className="primary-button"
                      type="button"
                      style={{ width: "auto", padding: "10px 18px" }}
                      onClick={() => printCombinedReport(
                        reportRecords,
                        `${selectedSystem?.name || "Project"} - ${activeSection === "daily" ? `Daily Report (${dailyDate})` : `Monthly Report (${monthlyDate})`}`
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
            </>}
          </>
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

            <ProjectManager
              systems={systems}
              setSystems={setSystems}
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
              {systems.map((system) => {
                const systemTotals = totalsFor(
                  transactions.filter(
                    (record) =>
                      record.systemId === system.id
                  )
                );

                return (
                  <button
                    key={system.id}
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

                    {!isBloodBankProject(system) && (
                      <strong>
                        Balance: Rs.{" "}
                        {systemTotals.balance.toLocaleString()}
                      </strong>
                    )}
                  </button>
                );
              })}

              <button
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
