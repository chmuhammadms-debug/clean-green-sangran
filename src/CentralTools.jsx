import { useRef, useState } from "react";
import ProjectIcon from "./ProjectIcon";

const coreSystemIds = [
  "cemetery",
  "plantation",
  "mosque",
  "welfare",
];

function CentralTools({
  systems,
  transactions,
  setSystems,
  setTransactions,
  onOpenSystem,
}) {
  const [search, setSearch] = useState("");
  const restoreInputRef = useRef(null);

  const searchedName = search.trim().toLowerCase();

  const donorRecords = transactions
    .filter(
      (record) =>
        record.type === "income" &&
        searchedName &&
        String(record.person)
          .toLowerCase()
          .includes(searchedName)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalDonation = donorRecords.reduce(
    (total, record) =>
      total + Number(record.amount),
    0
  );

  const matchedDonors = new Set(
    donorRecords.map((record) =>
      record.person.trim().toLowerCase()
    )
  ).size;

  function getSystemName(systemId) {
    return (
      systems.find(
        (system) => system.id === systemId
      )?.name || "Unknown Project"
    );
  }

  function downloadBackup() {
    const backup = {
      version: 1,
      website: "Clean & Green Sangran",
      exportedAt: new Date().toISOString(),
      systems,
      transactions,
    };

    const backupFile = new Blob(
      [JSON.stringify(backup, null, 2)],
      {
        type: "application/json",
      }
    );

    const downloadUrl =
      URL.createObjectURL(backupFile);

    const downloadLink =
      document.createElement("a");

    downloadLink.href = downloadUrl;

    downloadLink.download = `clean-green-sangran-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);

    alert("Backup downloaded successfully");
  }

  async function restoreBackup(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const fileText = await file.text();
      const backup = JSON.parse(fileText);

      if (
        !Array.isArray(backup.systems) ||
        !Array.isArray(backup.transactions)
      ) {
        throw new Error("Invalid backup");
      }

      const confirmed = window.confirm(
        "Restoring this backup will replace all current website data. Continue?"
      );

      if (!confirmed) {
        event.target.value = "";
        return;
      }

      setSystems(backup.systems);
      setTransactions(backup.transactions);

      alert("Backup restored successfully");
    } catch {
      alert(
        "This is not a valid Clean & Green Sangran backup file"
      );
    }

    event.target.value = "";
  }

  function editCustomSystem(system) {
    const newName = window.prompt(
      "Enter the new system name:",
      system.name
    );

    if (newName === null || !newName.trim()) {
      return;
    }

    const newDescription = window.prompt(
      "Enter the system description:",
      system.description ||
        system.englishName ||
        "Community management system"
    );

    if (newDescription === null) {
      return;
    }

    setSystems((currentSystems) =>
      currentSystems.map((currentSystem) =>
        currentSystem.id === system.id
          ? {
              ...currentSystem,
              name: newName.trim(),
              description:
                newDescription.trim() ||
                "Community management system",
            }
          : currentSystem
      )
    );

    alert("System updated successfully");
  }

  function deleteCustomSystem(system) {
    const relatedRecords = transactions.filter(
      (record) => record.systemId === system.id
    );

    const confirmed = window.confirm(
      `Delete "${system.name}" and its ${relatedRecords.length} record(s)? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setSystems((currentSystems) =>
      currentSystems.filter(
        (currentSystem) =>
          currentSystem.id !== system.id
      )
    );

    setTransactions((currentRecords) =>
      currentRecords.filter(
        (record) => record.systemId !== system.id
      )
    );

    alert("System deleted successfully");
  }

  return (
    <>
      <section
        className="panel"
        style={{ marginTop: "22px" }}
      >
        <h3>
          Search Donors Across All Projects
        </h3>

        <div
          className="form-field"
          style={{ maxWidth: "520px" }}
        >
          <label>Search by donor name</label>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="For example: Ghulam Mustafa"
          />
        </div>

        {search.trim() && (
          <>
            <div className="summary-grid">
              <div className="summary-card">
                <p>Matched Donors</p>
                <h2>{matchedDonors}</h2>
              </div>

              <div className="summary-card">
                <p>Number of Donations</p>
                <h2>{donorRecords.length}</h2>
              </div>

              <div className="summary-card">
                <p>Total Donation</p>
                <h2>
                  Rs.{" "}
                  {totalDonation.toLocaleString()}
                </h2>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              {donorRecords.length === 0 ? (
                <div className="empty-message">
                  No donor found with this name
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Donor Name</th>
                        <th>Project</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Receipt</th>
                        <th>Open</th>
                      </tr>
                    </thead>

                    <tbody>
                      {donorRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.date}</td>

                          <td>
                            <strong>
                              {record.person}
                            </strong>
                          </td>

                          <td>
                            {getSystemName(
                              record.systemId
                            )}
                          </td>

                          <td>
                            Rs.{" "}
                            {Number(
                              record.amount
                            ).toLocaleString()}
                          </td>

                          <td>{record.method}</td>

                          <td>
                            {record.slipData ? (
                              <a
                                href={record.slipData}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display:
                                    "inline-block",
                                  padding:
                                    "7px 10px",
                                  color: "white",
                                  background:
                                    "#2563eb",
                                  borderRadius:
                                    "6px",
                                  textDecoration:
                                    "none",
                                }}
                              >
                                View
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() =>
                                onOpenSystem(
                                  record.systemId
                                )
                              }
                              style={{
                                padding:
                                  "7px 11px",
                                color: "white",
                                background:
                                  "#166534",
                                border: 0,
                                borderRadius:
                                  "7px",
                                cursor: "pointer",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              Open Project
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <section
        className="panel"
        style={{ marginTop: "22px" }}
      >
        <h3>Data Backup and Restore</h3>

        <p style={{ color: "#6b7280" }}>
          Download a complete backup containing
          all projects, donations, expenses and
          attached receipts.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            maxWidth: "600px",
          }}
        >
          <button
            type="button"
            className="primary-button"
            onClick={downloadBackup}
            style={{ marginTop: 0 }}
          >
            Download Complete Backup
          </button>

          <button
            type="button"
            onClick={() =>
              restoreInputRef.current?.click()
            }
            style={{
              width: "100%",
              padding: "12px 17px",
              color: "#166534",
              fontWeight: 650,
              background: "#dcfce7",
              border: "1px solid #86efac",
              borderRadius: "9px",
              cursor: "pointer",
            }}
          >
            Restore Previous Backup
          </button>

          <input
            ref={restoreInputRef}
            type="file"
            accept=".json,application/json"
            onChange={restoreBackup}
            style={{ display: "none" }}
          />
        </div>
      </section>

      <section
        className="panel"
        style={{ marginTop: "22px" }}
      >
        <h3>Quick System List</h3>

        <p style={{ color: "#6b7280" }}>
          Full editing is available in the Project Manager above. This list is kept for quick controls.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          {systems.map((system) => {
            const isCoreSystem =
              coreSystemIds.includes(system.id);

            const recordCount =
              transactions.filter(
                (record) =>
                  record.systemId === system.id
              ).length;

            return (
              <div
                key={system.id}
                style={{
                  padding: "18px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "28px" }}>
                    <ProjectIcon project={system} size={28} />
                  </span>

                  <div>
                    <strong>{system.name}</strong>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      {recordCount} record(s)
                    </div>
                  </div>
                </div>

                {isCoreSystem ? (
                  <div
                    style={{
                      display: "inline-block",
                      padding: "6px 10px",
                      marginTop: "14px",
                      color: "#166534",
                      fontSize: "13px",
                      fontWeight: 600,
                      background: "#dcfce7",
                      borderRadius: "20px",
                    }}
                  >
                    Protected Core System
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "14px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        editCustomSystem(system)
                      }
                      style={{
                        flex: 1,
                        padding: "8px",
                        color: "white",
                        background: "#d97706",
                        border: 0,
                        borderRadius: "7px",
                        cursor: "pointer",
                      }}
                    >
                      Rename
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteCustomSystem(system)
                      }
                      style={{
                        flex: 1,
                        padding: "8px",
                        color: "white",
                        background: "#dc2626",
                        border: 0,
                        borderRadius: "7px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default CentralTools;
