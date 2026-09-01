import { useState } from "react";

function ContactForm({ initialData, onSubmit, onCancel, loading = false }) {
    const [firstName, setFirstName] = useState(
        initialData?.firstName || ""
    );
    const [lastName, setLastName] = useState(
        initialData?.lastName || ""
    );
    const [title, setTitle] = useState(
        initialData?.title || ""
    );

    const [emails, setEmails] = useState(
        initialData?.emails?.length
            ? initialData.emails.map((email) => ({
                  email: email.email || "",
                  label: email.label || "",
              }))
            : [{ email: "", label: "" }]
    );

    const [phoneNumbers, setPhoneNumbers] = useState(
        initialData?.phoneNumbers?.length
            ? initialData.phoneNumbers.map((phone) => ({
                  phoneNumber: phone.phoneNumber || "",
                  label: phone.label || "",
              }))
            : [{ phoneNumber: "", label: "" }]
    );

    const handleEmailChange = (index, field, value) => {
        setEmails((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: value }
                    : item
            )
        );
    };

    const handlePhoneChange = (index, field, value) => {
        setPhoneNumbers((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: value }
                    : item
            )
        );
    };

    const addEmail = () => {
        setEmails((current) => [
            ...current,
            { email: "", label: "" },
        ]);
    };

    const removeEmail = (index) => {
        setEmails((current) =>
            current.filter(
                (_, itemIndex) => itemIndex !== index
            )
        );
    };

    const addPhone = () => {
        setPhoneNumbers((current) => [
            ...current,
            { phoneNumber: "", label: "" },
        ]);
    };

    const removePhone = (index) => {
        setPhoneNumbers((current) =>
            current.filter(
                (_, itemIndex) => itemIndex !== index
            )
        );
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const cleanedEmails = emails.filter(
            (item) => item.email.trim() !== ""
        );

        const cleanedPhoneNumbers = phoneNumbers.filter(
            (item) => item.phoneNumber.trim() !== ""
        );

        onSubmit({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            title: title.trim(),
            emails: cleanedEmails.map((item) => ({
                email: item.email.trim(),
                label: item.label.trim(),
            })),
            phoneNumbers: cleanedPhoneNumbers.map((item) => ({
                phoneNumber: item.phoneNumber.trim(),
                label: item.label.trim(),
            })),
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>
                {initialData
                    ? "Edit Contact"
                    : "Add Contact"}
            </h2>

            <div>
                <label>
                    First Name
                    <input
                        type="text"
                        value={firstName}
                        onChange={(event) =>
                            setFirstName(event.target.value)
                        }
                        required
                    />
                </label>
            </div>

            <div>
                <label>
                    Last Name
                    <input
                        type="text"
                        value={lastName}
                        onChange={(event) =>
                            setLastName(event.target.value)
                        }
                        required
                    />
                </label>
            </div>

            <div>
                <label>
                    Title
                    <input
                        type="text"
                        value={title}
                        onChange={(event) =>
                            setTitle(event.target.value)
                        }
                    />
                </label>
            </div>

            <section>
                <h3>Email Addresses</h3>

                {emails.map((item, index) => (
                    <div key={index}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={item.email}
                            onChange={(event) =>
                                handleEmailChange(
                                    index,
                                    "email",
                                    event.target.value
                                )
                            }
                        />

                        <input
                            type="text"
                            placeholder="Label"
                            value={item.label}
                            onChange={(event) =>
                                handleEmailChange(
                                    index,
                                    "label",
                                    event.target.value
                                )
                            }
                        />

                        {emails.length > 1 && (
                            <button
                                type="button"
                                onClick={() =>
                                    removeEmail(index)
                                }
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addEmail}
                >
                    Add Email
                </button>
            </section>

            <section>
                <h3>Phone Numbers</h3>

                {phoneNumbers.map((item, index) => (
                    <div key={index}>
                        <input
                            type="text"
                            placeholder="Phone Number"
                            value={item.phoneNumber}
                            onChange={(event) =>
                                handlePhoneChange(
                                    index,
                                    "phoneNumber",
                                    event.target.value
                                )
                            }
                        />

                        <input
                            type="text"
                            placeholder="Label"
                            value={item.label}
                            onChange={(event) =>
                                handlePhoneChange(
                                    index,
                                    "label",
                                    event.target.value
                                )
                            }
                        />

                        {phoneNumbers.length > 1 && (
                            <button
                                type="button"
                                onClick={() =>
                                    removePhone(index)
                                }
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addPhone}
                >
                    Add Phone
                </button>
            </section>

            <div>
                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? "Saving..."
                        : initialData
                        ? "Update Contact"
                        : "Create Contact"}
                </button>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

export default ContactForm;