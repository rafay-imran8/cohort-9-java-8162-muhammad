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
                            fetchContacts();
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
                    contacts.length > 0 && (
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
                    )}
            </div>
        </main>
    );
}

export default Dashboard;