package com.rafay.backend.service;

import com.rafay.backend.dto.request.ContactEmailRequest;
import com.rafay.backend.dto.request.ContactPhoneRequest;
import com.rafay.backend.dto.request.ContactRequest;
import com.rafay.backend.dto.response.ContactResponse;
import com.rafay.backend.entity.Contact;
import com.rafay.backend.entity.ContactEmail;
import com.rafay.backend.entity.ContactPhone;
import com.rafay.backend.entity.User;
import com.rafay.backend.exception.ResourceNotFoundException;
import com.rafay.backend.repository.ContactEmailRepository;
import com.rafay.backend.repository.ContactPhoneRepository;
import com.rafay.backend.repository.ContactRepository;
import com.rafay.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ContactService}. No database is used; all repositories are mocked.
 */
@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    private static final String USER_EMAIL = "john@example.com";

    @Mock
    private ContactRepository contactRepository;

    @Mock
    private ContactEmailRepository contactEmailRepository;

    @Mock
    private ContactPhoneRepository contactPhoneRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ContactService contactService;

    // ---------------------------------------------------------------
    // Create
    // ---------------------------------------------------------------

    @Test
    void createContact_success_createsContactWithEmailsAndPhones() {
        User user = new User();
        user.setId(1L);
        user.setEmail(USER_EMAIL);

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));

        when(contactRepository.save(any(Contact.class))).thenAnswer(invocation -> {
            Contact contact = invocation.getArgument(0);
            contact.setId(10L);
            return contact;
        });
        when(contactEmailRepository.save(any(ContactEmail.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(contactPhoneRepository.save(any(ContactPhone.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ContactEmail savedEmail = new ContactEmail();
        savedEmail.setId(100L);
        savedEmail.setEmail("jane@example.com");
        savedEmail.setLabel("home");

        ContactPhone savedPhone = new ContactPhone();
        savedPhone.setId(200L);
        savedPhone.setPhoneNumber("5551234");
        savedPhone.setLabel("mobile");

        when(contactEmailRepository.findByContactId(10L)).thenReturn(List.of(savedEmail));
        when(contactPhoneRepository.findByContactId(10L)).thenReturn(List.of(savedPhone));

        ContactEmailRequest emailRequest = new ContactEmailRequest();
        emailRequest.setEmail("jane@example.com");
        emailRequest.setLabel("home");

        ContactPhoneRequest phoneRequest = new ContactPhoneRequest();
        phoneRequest.setPhoneNumber("5551234");
        phoneRequest.setLabel("mobile");

        ContactRequest request = new ContactRequest();
        request.setFirstName("Jane");
        request.setLastName("Roe");
        request.setTitle("Manager");
        request.setEmails(List.of(emailRequest));
        request.setPhoneNumbers(List.of(phoneRequest));

        ContactResponse response = contactService.createContact(request, USER_EMAIL);

        assertEquals(10L, response.getId());
        assertEquals("Jane", response.getFirstName());
        assertEquals("Roe", response.getLastName());
        assertEquals("Manager", response.getTitle());
        assertEquals(1, response.getEmails().size());
        assertEquals("jane@example.com", response.getEmails().get(0).getEmail());
        assertEquals(1, response.getPhoneNumbers().size());
        assertEquals("5551234", response.getPhoneNumbers().get(0).getPhoneNumber());

        ArgumentCaptor<Contact> contactCaptor = ArgumentCaptor.forClass(Contact.class);
        verify(contactRepository, times(1)).save(contactCaptor.capture());
        assertEquals(user, contactCaptor.getValue().getUser());

        verify(contactEmailRepository, times(1)).save(any(ContactEmail.class));
        verify(contactPhoneRepository, times(1)).save(any(ContactPhone.class));
    }

    @Test
    void createContact_userDoesNotExist_throwsResourceNotFoundException() {
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());

        ContactRequest request = new ContactRequest();
        request.setFirstName("Jane");
        request.setLastName("Roe");

        assertThrows(
                ResourceNotFoundException.class,
                () -> contactService.createContact(request, USER_EMAIL)
        );

        verify(contactRepository, never()).save(any(Contact.class));
    }

    // ---------------------------------------------------------------
    // Get single contact
    // ---------------------------------------------------------------

    @Test
    void getContact_existingContact_returnsMappedResponse() {
        Contact contact = new Contact();
        contact.setId(5L);
        contact.setFirstName("Jane");
        contact.setLastName("Roe");
        contact.setTitle("Developer");

        when(contactRepository.findByIdAndUserEmail(5L, USER_EMAIL))
                .thenReturn(Optional.of(contact));

        ContactEmail email = new ContactEmail();
        email.setId(1L);
        email.setEmail("jane@example.com");
        email.setLabel("home");

        ContactPhone phone = new ContactPhone();
        phone.setId(2L);
        phone.setPhoneNumber("5559999");
        phone.setLabel("work");

        when(contactEmailRepository.findByContactId(5L)).thenReturn(List.of(email));
        when(contactPhoneRepository.findByContactId(5L)).thenReturn(List.of(phone));

        ContactResponse response = contactService.getContact(5L, USER_EMAIL);

        assertEquals(5L, response.getId());
        assertEquals("Jane", response.getFirstName());
        assertEquals(1, response.getEmails().size());
        assertEquals("jane@example.com", response.getEmails().get(0).getEmail());
        assertEquals(1, response.getPhoneNumbers().size());
        assertEquals("5559999", response.getPhoneNumbers().get(0).getPhoneNumber());
    }

    @Test
    void getContact_contactDoesNotExist_throwsResourceNotFoundException() {
        when(contactRepository.findByIdAndUserEmail(99L, USER_EMAIL))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> contactService.getContact(99L, USER_EMAIL)
        );
    }

    // ---------------------------------------------------------------
    // Get contacts (paginated)
    // ---------------------------------------------------------------

    @Test
    void getContacts_returnsPagedMappedContacts() {
        Contact contact1 = new Contact();
        contact1.setId(1L);
        contact1.setFirstName("Jane");
        contact1.setLastName("Roe");

        Contact contact2 = new Contact();
        contact2.setId(2L);
        contact2.setFirstName("Bob");
        contact2.setLastName("Smith");

        Pageable pageable = PageRequest.of(0, 10);
        Page<Contact> page = new PageImpl<>(List.of(contact1, contact2), pageable, 2);

        when(contactRepository.findByUserEmail(USER_EMAIL, pageable)).thenReturn(page);
        when(contactEmailRepository.findByContactId(anyLong())).thenReturn(List.of());
        when(contactPhoneRepository.findByContactId(anyLong())).thenReturn(List.of());

        Page<ContactResponse> result = contactService.getContacts(USER_EMAIL, pageable);

        assertEquals(2, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getId());
        assertEquals(2L, result.getContent().get(1).getId());

        verify(contactRepository, times(1)).findByUserEmail(USER_EMAIL, pageable);
    }

    // ---------------------------------------------------------------
    // Search contacts
    // ---------------------------------------------------------------

    @Test
    void searchContacts_delegatesToRepositoryWithCorrectParametersAndMapsResults() {
        Contact contact = new Contact();
        contact.setId(1L);
        contact.setFirstName("Jane");
        contact.setLastName("Roe");

        Pageable pageable = PageRequest.of(0, 10);
        Page<Contact> page = new PageImpl<>(List.of(contact), pageable, 1);
        String search = "Jane";

        when(contactRepository
                .findByUserEmailAndFirstNameContainingIgnoreCaseOrUserEmailAndLastNameContainingIgnoreCase(
                        USER_EMAIL, search, USER_EMAIL, search, pageable))
                .thenReturn(page);
        when(contactEmailRepository.findByContactId(anyLong())).thenReturn(List.of());
        when(contactPhoneRepository.findByContactId(anyLong())).thenReturn(List.of());

        Page<ContactResponse> result = contactService.searchContacts(USER_EMAIL, search, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Jane", result.getContent().get(0).getFirstName());

        verify(contactRepository, times(1))
                .findByUserEmailAndFirstNameContainingIgnoreCaseOrUserEmailAndLastNameContainingIgnoreCase(
                        USER_EMAIL, search, USER_EMAIL, search, pageable);
    }

    // ---------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------

    @Test
    void updateContact_success_replacesEmailsAndPhonesAndReturnsUpdatedResponse() {
        Contact existingContact = new Contact();
        existingContact.setId(7L);
        existingContact.setFirstName("Old");
        existingContact.setLastName("Name");
        existingContact.setTitle("Old Title");

        when(contactRepository.findByIdAndUserEmail(7L, USER_EMAIL))
                .thenReturn(Optional.of(existingContact));
        when(contactRepository.save(any(Contact.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(contactEmailRepository.save(any(ContactEmail.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(contactPhoneRepository.save(any(ContactPhone.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ContactEmail oldEmail = new ContactEmail();
        oldEmail.setId(1L);
        oldEmail.setEmail("old@example.com");
        oldEmail.setLabel("old");

        ContactEmail newEmail = new ContactEmail();
        newEmail.setId(2L);
        newEmail.setEmail("new@example.com");
        newEmail.setLabel("new");

        ContactPhone oldPhone = new ContactPhone();
        oldPhone.setId(1L);
        oldPhone.setPhoneNumber("111");
        oldPhone.setLabel("old");

        ContactPhone newPhone = new ContactPhone();
        newPhone.setId(2L);
        newPhone.setPhoneNumber("999");
        newPhone.setLabel("new");

        // First call returns the pre-update records (fetched for deletion),
        // second call (inside the final response mapping) returns the post-update records.
        when(contactEmailRepository.findByContactId(7L))
                .thenReturn(List.of(oldEmail), List.of(newEmail));
        when(contactPhoneRepository.findByContactId(7L))
                .thenReturn(List.of(oldPhone), List.of(newPhone));

        ContactEmailRequest newEmailRequest = new ContactEmailRequest();
        newEmailRequest.setEmail("new@example.com");
        newEmailRequest.setLabel("new");

        ContactPhoneRequest newPhoneRequest = new ContactPhoneRequest();
        newPhoneRequest.setPhoneNumber("999");
        newPhoneRequest.setLabel("new");

        ContactRequest request = new ContactRequest();
        request.setFirstName("New");
        request.setLastName("Name");
        request.setTitle("New Title");
        request.setEmails(List.of(newEmailRequest));
        request.setPhoneNumbers(List.of(newPhoneRequest));

        ContactResponse response = contactService.updateContact(7L, request, USER_EMAIL);

        assertEquals("New", response.getFirstName());
        assertEquals("New Title", response.getTitle());
        assertEquals(1, response.getEmails().size());
        assertEquals("new@example.com", response.getEmails().get(0).getEmail());
        assertEquals(1, response.getPhoneNumbers().size());
        assertEquals("999", response.getPhoneNumbers().get(0).getPhoneNumber());

        verify(contactRepository, times(1)).save(existingContact);
        verify(contactEmailRepository, times(1)).deleteAll(List.of(oldEmail));
        verify(contactPhoneRepository, times(1)).deleteAll(List.of(oldPhone));
        verify(contactEmailRepository, times(1)).save(any(ContactEmail.class));
        verify(contactPhoneRepository, times(1)).save(any(ContactPhone.class));
    }

    @Test
    void updateContact_contactDoesNotExist_throwsResourceNotFoundException() {
        when(contactRepository.findByIdAndUserEmail(123L, USER_EMAIL))
                .thenReturn(Optional.empty());

        ContactRequest request = new ContactRequest();
        request.setFirstName("New");
        request.setLastName("Name");

        assertThrows(
                ResourceNotFoundException.class,
                () -> contactService.updateContact(123L, request, USER_EMAIL)
        );

        verify(contactRepository, never()).save(any(Contact.class));
    }

    // ---------------------------------------------------------------
    // Delete
    // ---------------------------------------------------------------

    @Test
    void deleteContact_success_deletesContactWithEmailsAndPhones() {
        Contact contact = new Contact();
        contact.setId(3L);

        when(contactRepository.findByIdAndUserEmail(3L, USER_EMAIL))
                .thenReturn(Optional.of(contact));

        List<ContactEmail> emails = List.of(new ContactEmail());
        List<ContactPhone> phones = List.of(new ContactPhone());

        when(contactEmailRepository.findByContactId(3L)).thenReturn(emails);
        when(contactPhoneRepository.findByContactId(3L)).thenReturn(phones);

        contactService.deleteContact(3L, USER_EMAIL);

        verify(contactEmailRepository, times(1)).deleteAll(emails);
        verify(contactPhoneRepository, times(1)).deleteAll(phones);
        verify(contactRepository, times(1)).delete(contact);
    }

    @Test
    void deleteContact_contactDoesNotExist_throwsResourceNotFoundException() {
        when(contactRepository.findByIdAndUserEmail(404L, USER_EMAIL))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> contactService.deleteContact(404L, USER_EMAIL)
        );

        verify(contactRepository, never()).delete(any(Contact.class));
    }
}
