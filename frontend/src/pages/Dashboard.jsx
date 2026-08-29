import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import ContactForm from "../components/ContactForm";

function Dashboard() {
    const [contacts, setContacts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fileInputRef = useRef(null);

    const pageSize = 10;

    const fetchContacts = async (
        searchValue = "",
        pageNumber = 0
    ) => {
        setLoading(true);
        setError("");

        try {
            const params = {
                page: pageNumber,
                size: pageSize,
            };

            if (searchValue.trim()) {
                params.search = searchValue.trim();
            }

            const response = await api.get(
                "/api/v1/contacts",
                { params }
            );

            setContacts(response.data.content || []);

            setPage(
                response.data.number ?? pageNumber
            );

            setTotalPages(
                response.data.totalPages ?? 0
            );
        } catch (err) {
            if (err.response?.status === 401) {
                setError(
                    "Your session has expired. Please log in again."
                );
            } else {
                setError("Unable to load contacts.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts("", 0);
    }, []);

    const handleSearch = async (event) => {
        event.preventDefault();
        await fetchContacts(search, 0);
    };

    const handleCreateContact = async (contactData) => {
        setSaving(true);
        setError("");

        try {
            await api.post(
                "/api/v1/contacts",
                contactData
            );

            setShowForm(false);

            await fetchContacts(search, page);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create contact."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePrevious = () => {
        if (page > 0) {
            fetchContacts(search, page - 1);
        }
    };

    const handleNext = () => {
        if (page < totalPages - 1) {
            fetchContacts(search, page + 1);
        }
    };

    const escapeCsvValue = (value) => {
        const stringValue = String(value ?? "");

        if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n") ||
            stringValue.includes("\r")
        ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
    };

    const handleExport = async () => {
        setError("");

        try {
            let allContacts = [];
            let currentPage = 0;
            let totalPagesToFetch = 1;

            while (currentPage < totalPagesToFetch) {
                const response = await api.get(
                    "/api/v1/contacts",
                    {
                        params: {
                            page: currentPage,
                            size: pageSize,
                        },
                    }
                );

                const pageContacts =
                    response.data.content || [];

                allContacts = [
                    ...allContacts,
                    ...pageContacts,
                ];

                totalPagesToFetch =
                    response.data.totalPages ?? 1;

                currentPage++;
            }

            if (allContacts.length === 0) {
                setError(
                    "There are no contacts to export."
                );
                return;
            }

            const headers = [
                "First Name",
                "Last Name",
                "Title",
                "Emails",
                "Phone Numbers",
            ];

            const rows = allContacts.map((contact) => {
                const emails =
                    contact.emails
                        ?.map((email) => {
                            const label = email.label
                                ? ` (${email.label})`
                                : "";

                            return `${email.email}${label}`;
                        })
                        .join("; ") || "";

                const phoneNumbers =
                    contact.phoneNumbers
                        ?.map((phone) => {
                            const label = phone.label
                                ? ` (${phone.label})`
                                : "";

                            return `${phone.phoneNumber}${label}`;
                        })
                        .join("; ") || "";

                return [
                    contact.firstName,
                    contact.lastName,
                    contact.title,
                    emails,
                    phoneNumbers,
                ];
            });

            const csvContent = [
                headers,
                ...rows,
            ]
                .map((row) =>
                    row
                        .map(escapeCsvValue)
                        .join(",")
                )
                .join("\r\n");

            const blob = new Blob(
                [csvContent],
                {
                    type: "text/csv;charset=utf-8;",
                }
            );

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download = "contacts.csv";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(
                "Export failed:",
                err
            );

            if (err.response?.status === 401) {
                setError(
                    "Your session has expired. Please log in again."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to export contacts."
                );
            }
        }
    };

    const parseCsvLine = (line) => {
        const values = [];
        let current = "";
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const character = line[i];

            if (character === '"') {
                if (
                    insideQuotes &&
                    line[i + 1] === '"'
                ) {
                    current += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (
                character === "," &&
                !insideQuotes
            ) {
                values.push(current.trim());
                current = "";
            } else {
                current += character;
            }
        }

        values.push(current.trim());

        return values;
    };

    const handleImport = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");

        try {
            const text = await file.text();

            const lines = text
                .split(/\r?\n/)
                .filter(
                    (line) => line.trim() !== ""
                );

            if (lines.length < 2) {
                setError(
                    "The CSV file does not contain any contacts."
                );
                return;
            }

            const headers =
                parseCsvLine(lines[0]);

            const requiredHeaders = [
                "First Name",
                "Last Name",
                "Title",
                "Emails",
                "Phone Numbers",
            ];

            const validHeaders =
                requiredHeaders.every(
                    (header, index) =>
                        headers[index] === header
                );

            if (!validHeaders) {
                setError(
                    "Invalid CSV format. Please use a contacts.csv file exported from ContactHub."
                );
                return;
            }

            let importedCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const values =
                    parseCsvLine(lines[i]);

                const [
                    firstName,
                    lastName,
                    title,
                    emailsValue,
                    phonesValue,
                ] = values;

                if (
                    !firstName ||
                    !lastName
                ) {
                    continue;
                }

                const emails =
                    emailsValue
                        ? emailsValue
                              .split(";")
                              .map((item) =>
                                  item.trim()
                              )
                              .filter(Boolean)
                              .map((item) => {
                                  const match =
                                      item.match(
                                          /^(.+?)\s*\((.+)\)$/
                                      );

                                  return {
                                      email: match
                                          ? match[1].trim()
                                          : item,
                                      label: match
                                          ? match[2].trim()
                                          : "",
                                  };
                              })
                        : [];

                const phoneNumbers =
                    phonesValue
                        ? phonesValue
                              .split(";")
                              .map((item) =>
                                  item.trim()
                              )
                              .filter(Boolean)
                              .map((item) => {
                                  const match =
                                      item.match(
                                          /^(.+?)\s*\((.+)\)$/
                                      );

                                  return {
                                      phoneNumber:
                                          match
                                              ? match[1].trim()
                                              : item,
                                      label: match
                                          ? match[2].trim()
                                          : "",
                                  };
                              })
                        : [];

                await api.post(
                    "/api/v1/contacts",
                    {
                        firstName:
                            firstName.trim(),
                        lastName:
                            lastName.trim(),
                        title:
                            title?.trim() || "",
                        emails,
                        phoneNumbers,
                    }
                );

                importedCount++;
            }

            if (importedCount === 0) {
                setError(
                    "No valid contacts were found in the CSV file."
                );
                return;
            }

            await fetchContacts(
                search,
                page
            );

            alert(
                `${importedCount} contact${
                    importedCount === 1
                        ? ""
                        : "s"
                } imported successfully.`
            );
        } catch (err) {
            console.error(
                "Import failed:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to import contacts."
            );
        } finally {
            event.target.value = "";
        }
    };

    return (
        <main className="page-container">
            <div className="dashboard-page">
                <div className="page-header">
                    <div>
                        <span className="eyebrow">
                            CONTACT MANAGEMENT
                        </span>

                        <h1>Contacts</h1>

                        <p>
                            Manage, search and organize your contacts.
                        </p>
                    </div>

                    <div className="button-row">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={handleExport}
                        >
                            Export CSV
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                        >
                            Import CSV
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            style={{
                                display: "none",
                            }}
                            onChange={handleImport}
                        />

                        <button
                            type="button"
                            className="primary-button add-contact-button"
                            onClick={() => {
                                setShowForm(true);
                                setError("");
                            }}
                        >
                            + Add Contact
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="form-card">
                        <div className="form-card-header">
                            <div>
                                <h2>Add Contact</h2>
                                <p>
                                    Enter the contact's information below.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="close-button"
                                onClick={() =>
                                    setShowForm(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <ContactForm
                            onSubmit={handleCreateContact}
                            onCancel={() =>
                                setShowForm(false)
                            }
                            loading={saving}
                        />
                    </div>
                )}

                <form
                    className="search-bar"
                    onSubmit={handleSearch}
                >
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />

                    <button
                        type="submit"
                        className="primary-button"
                    >
                        Search
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                            setSearch("");
                            fetchContacts("", 0);
                        }}
                    >
                        Clear
                    </button>
                </form>

                {loading && (
                    <div className="loading-state">
                        Loading contacts...
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    contacts.length === 0 && (
                        <div className="empty-state">
                            <h2>No contacts found</h2>

                            <p>
                                Add your first contact to get started.
                            </p>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                    setShowForm(true)
                                }
                            >
                                + Add Contact
                            </button>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    contacts.length > 0 && (
                        <>
                            <div className="contacts-grid">
                                {contacts.map((contact) => (
                                    <div
                                        className="contact-card"
                                        key={contact.id}
                                    >
                                        <div className="contact-card-content">
                                            <div className="contact-avatar">
                                                {contact.firstName
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div>
                                                <h2>
                                                    {contact.firstName}{" "}
                                                    {contact.lastName}
                                                </h2>

                                                {contact.title && (
                                                    <p>
                                                        {contact.title}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Link
                                            to={`/contacts/${contact.id}`}
                                            className="view-contact-button"
                                        >
                                            View Contact →
                                        </Link>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 0 && (
                                <div className="pagination">
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={handlePrevious}
                                        disabled={page === 0}
                                    >
                                        Previous
                                    </button>

                                    <span>
                                        Page {page + 1} of{" "}
                                        {totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={handleNext}
                                        disabled={
                                            page >=
                                            totalPages - 1
                                        }
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
            </div>
        </main>
    );
}

export default Dashboard;