import {
    useEffect,
    useState,
} from "react";
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";
import api from "../api/api";
import ContactForm from "../components/ContactForm";

function ContactDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        let isCurrentRequest = true;

        const fetchContact = async () => {
            setLoading(true);
            setError("");
            setContact(null);

            try {
                const response = await api.get(
                    `/api/v1/contacts/${id}`
                );

                if (!isCurrentRequest) {
                    return;
                }

                setContact(response.data);
            } catch (err) {
                if (!isCurrentRequest) {
                    return;
                }

                if (err.response?.status === 404) {
                    setError("Contact not found.");
                } else if (
                    err.response?.status === 401
                ) {
                    setError(
                        "Your session has expired. Please log in again."
                    );
                } else {
                    setError(
                        "Unable to load contact details."
                    );
                }
            } finally {
                if (isCurrentRequest) {
                    setLoading(false);
                }
            }
        };

        fetchContact();

        return () => {
            isCurrentRequest = false;
        };
    }, [id]);

    const handleUpdate = async (contactData) => {
        setSaving(true);
        setError("");

        try {
            const response = await api.put(
                `/api/v1/contacts/${id}`,
                contactData
            );

            setContact(response.data);
            setEditing(false);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to update contact."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this contact?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(
                `/api/v1/contacts/${id}`
            );

            navigate("/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to delete contact."
            );
        }
    };

    if (loading) {
        return <p>Loading contact...</p>;
    }

    if (error && !contact) {
        return (
            <div>
                <p>{error}</p>

                <Link to="/dashboard">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    if (!contact) {
        return (
            <div>
                <p>Contact not found.</p>

                <Link to="/dashboard">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    if (editing) {
        return (
            <div>
                <Link to={`/contacts/${id}`}>
                    ← Back to Contact
                </Link>

                {error && <p>{error}</p>}

                <ContactForm
                    initialData={contact}
                    onSubmit={handleUpdate}
                    onCancel={() => {
                        setEditing(false);
                        setError("");
                    }}
                    loading={saving}
                />
            </div>
        );
    }

    return (
        <div>
            <Link to="/dashboard">
                ← Back to Dashboard
            </Link>

            <h1>
                {contact.firstName}{" "}
                {contact.lastName}
            </h1>

            {contact.title && (
                <p>
                    <strong>Title:</strong>{" "}
                    {contact.title}
                </p>
            )}

            <section>
                <h2>Email Addresses</h2>

                {contact.emails?.length > 0 ? (
                    <ul>
                        {contact.emails.map(
                            (email) => (
                                <li key={email.id}>
                                    <strong>
                                        {email.label ||
                                            "Email"}:
                                    </strong>{" "}
                                    {email.email}
                                </li>
                            )
                        )}
                    </ul>
                ) : (
                    <p>No email addresses.</p>
                )}
            </section>

            <section>
                <h2>Phone Numbers</h2>

                {contact.phoneNumbers?.length > 0 ? (
                    <ul>
                        {contact.phoneNumbers.map(
                            (phone) => (
                                <li key={phone.id}>
                                    <strong>
                                        {phone.label ||
                                            "Phone"}:
                                    </strong>{" "}
                                    {
                                        phone.phoneNumber
                                    }
                                </li>
                            )
                        )}
                    </ul>
                ) : (
                    <p>No phone numbers.</p>
                )}
            </section>

            {error && <p>{error}</p>}

            <div>
                <button
                    type="button"
                    onClick={() => {
                        setError("");
                        setEditing(true);
                    }}
                >
                    Edit Contact
                </button>

                <button
                    type="button"
                    onClick={handleDelete}
                >
                    Delete Contact
                </button>
            </div>
        </div>
    );
}

export default ContactDetails;