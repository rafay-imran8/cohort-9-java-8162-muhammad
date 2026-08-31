import {
    useEffect,
    useRef,
    useState,
} from "react";
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

            setContacts(
                response.data.content || []
            );

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
                setError(
                    "Unable to load contacts."
                );
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

    const handleCreateContact = async (
        contactData
    ) => {
        setSaving(true);
        setError("");

        try {
            await api.post(
                "/api/v1/contacts",
                contactData
            );

            setShowForm(false);

            await fetchContacts(
                search,
                page
            );
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
            fetchContacts(
                search,
                page - 1
            );
        }
    };

    const handleNext = () => {
        if (page < totalPages - 1) {
            fetchContacts(
                search,
                page + 1
            );
        }
    };

    const escapeCsvValue = (value) => {
        const stringValue = String(
            value ?? ""
        );

        /*
         * Prevent spreadsheet applications from
         * interpreting exported values as formulas.
         */
        const safeValue =
            /^[=+\-@]/.test(stringValue)
                ? `'${stringValue}`
                : stringValue;

        if (
            safeValue.includes(",") ||
            safeValue.includes('"') ||
            safeValue.includes("\n") ||
            safeValue.includes("\r")
        ) {
            return `"${safeValue.replace(
                /"/g,
                '""'
            )}"`;
        }

        return safeValue;
    };

    const handleExport = async () => {
        setError("");

        try {
            let allContacts = [];
            let currentPage = 0;
            let totalPagesToFetch = 1;

            while (
                currentPage < totalPagesToFetch
            ) {
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

            const rows = allContacts.map(
                (contact) => {
                    /*
                     * JSON preserves arbitrary labels and
                     * values, including semicolons.
                     */
                    const emails = JSON.stringify(
                        (contact.emails || []).map(
                            (email) => ({
                                email:
                                    email.email || "",
                                label:
                                    email.label || "",
                            })
                        )
                    );

                    const phoneNumbers =
                        JSON.stringify(
                            (
                                contact.phoneNumbers ||
                                []
                            ).map((phone) => ({
                                phoneNumber:
                                    phone.phoneNumber ||
                                    "",
                                label:
                                    phone.label || "",
                            }))
                        );

                    return [
                        contact.firstName,
                        contact.lastName,
                        contact.title,
                        emails,
                        phoneNumbers,
                    ];
                }
            );

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
                    type:
                        "text/csv;charset=utf-8;",
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

            if (
                err.response?.status === 401
            ) {
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

        for (
            let i = 0;
            i < line.length;
            i++
        ) {
            const character = line[i];

            if (character === '"') {
                if (
                    insideQuotes &&
                    line[i + 1] === '"'
                ) {
                    current += '"';
                    i++;
                } else {
                    insideQuotes =
                        !insideQuotes;
                }
            } else if (
                character === "," &&
                !insideQuotes
            ) {
                values.push(
                    current.trim()
                );

                current = "";
            } else {
                current += character;
            }
        }

        values.push(current.trim());

        return values;
    };

    const parseContactMethods = (
        value,
        type
    ) => {
        if (!value?.trim()) {
            return [];
        }

        /*
         * New export format:
         * JSON array containing the complete contact
         * method objects.
         */
        try {
            const parsed = JSON.parse(
                value
            );

            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => {
                        if (type === "email") {
                            return {
                                email:
                                    item.email ||
                                    "",
                                label:
                                    item.label ||
                                    "",
                            };
                        }

                        return {
                            phoneNumber:
                                item.phoneNumber ||
                                "",
                            label:
                                item.label ||
                                "",
                        };
                    })
                    .filter((item) =>
                        type === "email"
                            ? item.email
                            : item.phoneNumber
                    );
            }
        } catch {
            /*
             * Fall back to the previous CSV format so
             * existing exported files can still be imported.
             */
        }

        return value
            .split(";")
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => {
                const match =
                    item.match(
                        /^(.+?)\s*\((.+)\)$/
                    );

                if (type === "email") {
                    return {
                        email: match
                            ? match[1].trim()
                            : item,
                        label: match
                            ? match[2].trim()
                            : "",
                    };
                }

                return {
                    phoneNumber: match
                        ? match[1].trim()
                        : item,
                    label: match
                        ? match[2].trim()
                        : "",
                };
            });
    };

    const handleImport = async (event) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");

        let importedCount = 0;
        let failedCount = 0;

        try {
            const text = await file.text();

            const lines = text
                .split(/\r?\n/)
                .filter(
                    (line) =>
                        line.trim() !== ""
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
                        headers[index] ===
                        header
                );

            if (!validHeaders) {
                setError(
                    "Invalid CSV format. Please use a contacts.csv file exported from ContactHub."
                );
                return;
            }

            for (
                let i = 1;
                i < lines.length;
                i++
            ) {
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
                    failedCount++;
                    continue;
                }

                const emails =
                    parseContactMethods(
                        emailsValue,
                        "email"
                    );

                const phoneNumbers =
                    parseContactMethods(
                        phonesValue,
                        "phone"
                    );

                try {
                    await api.post(
                        "/api/v1/contacts",
                        {
                            firstName:
                                firstName.trim(),
                            lastName:
                                lastName.trim(),
                            title:
                                title?.trim() ||
                                "",
                            emails,
                            phoneNumbers,
                        }
                    );

                    importedCount++;
                } catch (rowError) {
                    console.error(
                        `Failed to import row ${i}:`,
                        rowError
                    );

                    failedCount++;
                }
            }

            if (importedCount === 0) {
                setError(
                    "No contacts could be imported from the CSV file."
                );
                return;
            }

            await fetchContacts(
                search,
                page
            );

            if (failedCount > 0) {
                setError(
                    `${importedCount} contact${
                        importedCount === 1
                            ? ""
                            : "s"
                    } imported successfully, but ${failedCount} row${
                        failedCount === 1
                            ? ""
                            : "s"
                    } could not be imported.`
                );
            } else {
                alert(
                    `${importedCount} contact${
                        importedCount === 1
                            ? ""
                            : "s"
                    } imported successfully.`
                );
            }
        } catch (err) {
            console.error(
                "Import failed:",
                err
            );

            if (
                err.response?.status === 401
            ) {
                setError(
                    "Your session has expired. Please log in again."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                        "Unable to read the CSV file."
                );
            }
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
                            Manage, search and
                            organize your contacts.
                        </p>
                    </div>

                    <div className="button-row">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={
                                handleExport
                            }
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
                            onChange={
                                handleImport
                            }
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
                                <h2>
                                    Add Contact
                                </h2>

                                <p>
                                    Enter the
                                    contact's
                                    information
                                    below.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="close-button"
                                onClick={() =>
                                    setShowForm(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>
                        </div>

                        <ContactForm
                            onSubmit={
                                handleCreateContact
                            }
                            onCancel={() =>
                                setShowForm(
                                    false
                                )
                            }
                            loading={saving}
                        />
                    </div>
                )}

                <form
                    className="search-bar"
                    onSubmit={
                        handleSearch
                    }
                >
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
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
                            fetchContacts(
                                "",
                                0
                            );
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
                            <h2>
                                No contacts found
                            </h2>

                            <p>
                                Add your first
                                contact to get
                                started.
                            </p>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                    setShowForm(
                                        true
                                    )
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
                                {contacts.map(
                                    (contact) => (
                                        <div
                                            className="contact-card"
                                            key={
                                                contact.id
                                            }
                                        >
                                            <div className="contact-card-content">
                                                <div className="contact-avatar">
                                                    {contact.firstName
                                                        ?.charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <h2>
                                                        {
                                                            contact.firstName
                                                        }{" "}
                                                        {
                                                            contact.lastName
                                                        }
                                                    </h2>

                                                    {contact.title && (
                                                        <p>
                                                            {
                                                                contact.title
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <Link
                                                to={`/contacts/${contact.id}`}
                                                className="view-contact-button"
                                            >
                                                View
                                                Contact
                                                →
                                            </Link>
                                        </div>
                                    )
                                )}
                            </div>

                            {totalPages > 0 && (
                                <div className="pagination">
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={
                                            handlePrevious
                                        }
                                        disabled={
                                            page ===
                                            0
                                        }
                                    >
                                        Previous
                                    </button>

                                    <span>
                                        Page{" "}
                                        {page +
                                            1}{" "}
                                        of{" "}
                                        {
                                            totalPages
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={
                                            handleNext
                                        }
                                        disabled={
                                            page >=
                                            totalPages -
                                                1
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