import { useEffect, useState } from "react";
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

    const fetchContacts = async (searchValue = "") => {
        setLoading(true);
        setError("");

        try {
            const params = {
                page: 0,
                size: 10,
            };

            if (searchValue.trim()) {
                params.search = searchValue.trim();
            }

            const response = await api.get(
                "/api/v1/contacts",
                { params }
            );

            setContacts(response.data.content || []);
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
        fetchContacts();
    }, []);

    const handleSearch = async (event) => {
        event.preventDefault();
        await fetchContacts(search);
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
            await fetchContacts(search);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to create contact."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="page-container">
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <h1>Contacts</h1>
                    <p>
                        Manage and search through your contacts.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                        setShowForm(true);
                        setError("");
                    }}
                >
                    + Add Contact
                </button>
            </div>

            {showForm && (
                <ContactForm
                    onSubmit={handleCreateContact}
                    onCancel={() => setShowForm(false)}
                    loading={saving}
                />
            )}

            <form
                className="search-panel"
                onSubmit={handleSearch}
            >
                <input
                    className="form-input search-input"
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                />

                <button
                    type="submit"
                    className="btn btn-primary"
                >
                    Search
                </button>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                        setSearch("");
                        fetchContacts();
                    }}
                >
                    Clear
                </button>
            </form>

            {error && (
                <div className="message message-error">
                    {error}
                </div>
            )}

            {loading && (
                <div className="loading-state">
                    Loading contacts...
                </div>
            )}

            {!loading &&
                !error &&
                contacts.length === 0 && (
                    <div className="empty-state">
                        <h2>No contacts found</h2>
                        <p>
                            Add your first contact or try a
                            different search.
                        </p>
                    </div>
                )}

            {!loading && contacts.length > 0 && (
                <div className="contacts-grid">
                    {contacts.map((contact) => {
                        const initials =
                            `${contact.firstName?.[0] || ""}${
                                contact.lastName?.[0] || ""
                            }`.toUpperCase();

                        return (
                            <div
                                className="contact-card"
                                key={contact.id}
                            >
                                <div className="contact-avatar">
                                    {initials}
                                </div>

                                <h2>
                                    {contact.firstName}{" "}
                                    {contact.lastName}
                                </h2>

                                {contact.title && (
                                    <p className="contact-card-title">
                                        {contact.title}
                                    </p>
                                )}

                                <Link
                                    className="contact-card-link"
                                    to={`/contacts/${contact.id}`}
                                >
                                    View Contact →
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

export default Dashboard;