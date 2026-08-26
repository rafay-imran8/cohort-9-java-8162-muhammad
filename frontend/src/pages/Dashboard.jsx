import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

function Dashboard() {
    const [contacts, setContacts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

            const response = await api.get("/api/v1/contacts", {
                params,
            });

            setContacts(response.data.content || []);
        } catch (err) {
            if (err.response?.status === 401) {
                setError("Your session has expired. Please log in again.");
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

    return (
        <div>
            <h1>Contacts</h1>

            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                />

                <button type="submit">
                    Search
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setSearch("");
                        fetchContacts();
                    }}
                >
                    Clear
                </button>
            </form>

            {loading && <p>Loading contacts...</p>}

            {error && <p>{error}</p>}

            {!loading && !error && contacts.length === 0 && (
                <p>No contacts found.</p>
            )}

            {!loading && !error && contacts.length > 0 && (
                <div>
                    {contacts.map((contact) => (
                        <div key={contact.id}>
                            <h2>
                                {contact.firstName}{" "}
                                {contact.lastName}
                            </h2>

                            {contact.title && (
                                <p>{contact.title}</p>
                            )}

                            <Link to={`/contacts/${contact.id}`}>
                                View Contact
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;