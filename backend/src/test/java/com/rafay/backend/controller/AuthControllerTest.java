package com.rafay.backend.controller;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rafay.backend.config.SecurityConfig;
import com.rafay.backend.dto.request.ChangePasswordRequest;
import com.rafay.backend.dto.request.LoginRequest;
import com.rafay.backend.dto.request.RegisterRequest;
import com.rafay.backend.dto.response.ApiResponse;
import com.rafay.backend.dto.response.LoginResponse;
import com.rafay.backend.dto.response.RegisterResponse;
import com.rafay.backend.repository.UserRepository;
import com.rafay.backend.security.JwtService;
import com.rafay.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Focused controller-layer tests for {@link AuthController}. The real {@link SecurityConfig}
 * is imported so the tests exercise the actual production authorization rules rather than a
 * relaxed test-only configuration. {@link JwtService} and {@link UserRepository} are mocked
 * only because {@code JwtAuthenticationFilter} requires them as constructor dependencies.
 */
@WebMvcTest(controllers = AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void register_validRequest_returnsOkWithRegisteredUser() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstname("John");
        request.setLastname("Doe");
        request.setEmail("john@example.com");
        request.setPhoneNumber("1234567890");
        request.setPassword("secret123");

        RegisterResponse response = new RegisterResponse();
        response.setId(1L);
        response.setFirstName("John");
        response.setLastName("Doe");
        response.setEmail("john@example.com");
        response.setPhoneNumber("1234567890");
        response.setMessage("User registered successfully");

        when(authService.registerUser(any(RegisterRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("john@example.com"))
                .andExpect(
                        jsonPath("$.message")
                                .value("User registered successfully")
                );
    }

    @Test
    void register_missingRequiredField_returnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setLastname("Doe");
        request.setEmail("john@example.com");
        request.setPassword("secret123");
        // firstname intentionally omitted to trigger @NotBlank validation failure

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).registerUser(any());
    }

    @Test
    void login_validRequest_returnsOkWithToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("john@example.com");
        request.setPassword("secret123");

        LoginResponse response = new LoginResponse();
        response.setMessage("Login successful");
        response.setToken("mocked-jwt-token");

        when(authService.loginUser(any(LoginRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked-jwt-token"))
                .andExpect(
                        jsonPath("$.message")
                                .value("Login successful")
                );
    }

    @Test
    void login_databaseFailure_returnsInternalServerError() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("john@example.com");
        request.setPassword("secret123");

        when(authService.loginUser(any(LoginRequest.class)))
                .thenThrow(
                        new DataAccessResourceFailureException(
                                "Database unavailable"
                        )
                );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(
                        jsonPath("$")
                                .value("An internal server error occurred.")
                );
    }

    @Test
    @WithMockUser(username = "john@example.com")
    void changePassword_authenticated_returnsOkWithResult() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPass123");
        request.setNewPassword("newPass456");

        ApiResponse response = new ApiResponse();
        response.setSuccess(true);
        response.setMessage("Password changed successfully");

        when(authService.changePassword(any(ChangePasswordRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/change")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(
                        jsonPath("$.message")
                                .value("Password changed successfully")
                );
    }

    @Test
    void changePassword_unauthenticated_returnsUnauthorized() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPass123");
        request.setNewPassword("newPass456");

        mockMvc.perform(post("/api/v1/auth/change")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        verify(authService, never()).changePassword(any());
    }
}