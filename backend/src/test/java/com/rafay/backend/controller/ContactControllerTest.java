package com.rafay.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rafay.backend.config.SecurityConfig;
import com.rafay.backend.dto.request.ContactRequest;
import com.rafay.backend.dto.response.ContactResponse;
import com.rafay.backend.exception.ResourceNotFoundException;
import com.rafay.backend.repository.UserRepository;
import com.rafay.backend.security.JwtService;
import com.rafay.backend.service.ContactService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Focused controller-layer tests for {@link ContactController}. The real {@link SecurityConfig}
 * is imported so tests exercise the actual production authorization rules (every endpoint here
 * requires authentication). {@link JwtService} and {@link UserRepository} are mocked only
 * because {@code JwtAuthenticationFilter} requires them as constructor dependencies.
 */
@WebMvcTest(controllers = ContactController.class)
@Import(SecurityConfig.class)
@WithMockUser(username = "john@example.com")
class ContactControllerTest {

    private static final String USER_EMAIL = "john@example.com";

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private ContactService contactService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private ContactResponse sampleContactResponse(Long id) {
        ContactResponse response = new ContactResponse();
        response.setId(id);
        response.setFirstName("Jane");
        response.setLastName("Roe");
        response.setTitle("Manager");
        response.setEmails(List.of());
        response.setPhoneNumbers(List.of());
        return response;
    }

    private ContactRequest sampleContactRequest() {
        ContactRequest request = new ContactRequest();
        request.setFirstName("Jane");
        request.setLastName("Roe");
        request.setTitle("Manager");
        request.setEmails(List.of());
        request.setPhoneNumbers(List.of());
        return request;
    }

    @Test
    void createContact_validRequest_returnsCreated() throws Exception {
        ContactRequest request = sampleContactRequest();
        ContactResponse response = sampleContactResponse(1L);

        when(contactService.createContact(any(ContactRequest.class), eq(USER_EMAIL)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("Jane"));
    }

    @Test
    void createContact_missingRequiredField_returnsBadRequest() throws Exception {
        ContactRequest request = sampleContactRequest();
        request.setFirstName(null);

        mockMvc.perform(post("/api/v1/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(contactService, never()).createContact(any(), anyString());
    }

    @Test
    @WithAnonymousUser
    void createContact_unauthenticated_returnsUnauthorized() throws Exception {
        ContactRequest request = sampleContactRequest();

        mockMvc.perform(post("/api/v1/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        verify(contactService, never()).createContact(any(), anyString());
    }

    @Test
    void getContacts_noSearchParam_returnsPagedContacts() throws Exception {
        ContactResponse response = sampleContactResponse(1L);

        when(contactService.getContacts(eq(USER_EMAIL), any()))
                .thenReturn(new PageImpl<>(List.of(response), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/contacts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));

        verify(contactService, times(1)).getContacts(eq(USER_EMAIL), any());
        verify(contactService, never()).searchContacts(anyString(), anyString(), any());
    }

    @Test
    void getContacts_withSearchParam_delegatesToSearch() throws Exception {
        ContactResponse response = sampleContactResponse(2L);

        when(contactService.searchContacts(eq(USER_EMAIL), eq("Jane"), any()))
                .thenReturn(new PageImpl<>(List.of(response), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/contacts").param("search", "Jane"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(2));

        verify(contactService, times(1)).searchContacts(eq(USER_EMAIL), eq("Jane"), any());
        verify(contactService, never()).getContacts(anyString(), any());
    }

    @Test
    void getContact_existingContact_returnsOkWithContact() throws Exception {
        ContactResponse response = sampleContactResponse(5L);

        when(contactService.getContact(eq(5L), eq(USER_EMAIL))).thenReturn(response);

        mockMvc.perform(get("/api/v1/contacts/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5));
    }

    @Test
    void getContact_contactDoesNotExist_returnsNotFound() throws Exception {
        when(contactService.getContact(eq(99L), eq(USER_EMAIL)))
                .thenThrow(new ResourceNotFoundException("Contact not found"));

        mockMvc.perform(get("/api/v1/contacts/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateContact_validRequest_returnsOkWithUpdatedContact() throws Exception {
        ContactRequest request = sampleContactRequest();
        ContactResponse response = sampleContactResponse(1L);

        when(contactService.updateContact(eq(1L), any(ContactRequest.class), eq(USER_EMAIL)))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/contacts/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void updateContact_contactDoesNotExist_returnsNotFound() throws Exception {
        ContactRequest request = sampleContactRequest();

        when(contactService.updateContact(eq(123L), any(ContactRequest.class), eq(USER_EMAIL)))
                .thenThrow(new ResourceNotFoundException("Contact not found"));

        mockMvc.perform(put("/api/v1/contacts/123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteContact_existingContact_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/contacts/1"))
                .andExpect(status().isNoContent());

        verify(contactService, times(1)).deleteContact(1L, USER_EMAIL);
    }
}
