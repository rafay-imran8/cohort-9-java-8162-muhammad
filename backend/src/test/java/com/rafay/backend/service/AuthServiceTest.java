package com.rafay.backend.service;

import com.rafay.backend.dto.request.ChangePasswordRequest;
import com.rafay.backend.dto.request.LoginRequest;
import com.rafay.backend.dto.request.RegisterRequest;
import com.rafay.backend.dto.response.ApiResponse;
import com.rafay.backend.dto.response.LoginResponse;
import com.rafay.backend.dto.response.RegisterResponse;
import com.rafay.backend.entity.User;
import com.rafay.backend.exception.ConflictException;
import com.rafay.backend.repository.UserRepository;
import com.rafay.backend.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AuthService}.
 *
 * The real {@link BCryptPasswordEncoder} is used (AuthService constructs its own internally),
 * so a second, independent encoder instance is used here purely to prepare/verify hashed
 * passwords without depending on a database.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder();

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ---------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------

    @Test
    void registerUser_success_savesEncodedPasswordAndReturnsUserInfo() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstname("John");
        request.setLastname("Doe");
        request.setEmail("john@example.com");
        request.setPhoneNumber("1234567890");
        request.setPassword("plainPassword123");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

        when(userRepository.save(userCaptor.capture())).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            savedUser.setId(1L);
            return savedUser;
        });

        RegisterResponse response = authService.registerUser(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("John", response.getFirstName());
        assertEquals("Doe", response.getLastName());
        assertEquals("john@example.com", response.getEmail());
        assertEquals("1234567890", response.getPhoneNumber());
        assertEquals("User registered successfully", response.getMessage());

        User savedArgument = userCaptor.getValue();
        assertNotEquals("plainPassword123", savedArgument.getPassword());
        assertTrue(ENCODER.matches("plainPassword123", savedArgument.getPassword()));

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_duplicateEmailOrPhone_throwsConflictException() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstname("John");
        request.setLastname("Doe");
        request.setEmail("john@example.com");
        request.setPhoneNumber("1234567890");
        request.setPassword("plainPassword123");

        when(userRepository.save(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key"));

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> authService.registerUser(request)
        );

        assertEquals("Email or phone number already exists", exception.getMessage());
        verify(userRepository, times(1)).save(any(User.class));
    }

    // ---------------------------------------------------------------
    // Login
    // ---------------------------------------------------------------

    @Test
    void loginUser_successWithEmail_returnsTokenAndSuccessMessage() {
        User user = new User();
        user.setId(1L);
        user.setEmail("john@example.com");
        user.setPhoneNumber("1234567890");
        user.setPassword(ENCODER.encode("secret123"));

        when(userRepository.findAll()).thenReturn(List.of(user));
        when(jwtService.generateToken("john@example.com")).thenReturn("mocked-jwt-token");

        LoginRequest request = new LoginRequest();
        request.setIdentifier("john@example.com");
        request.setPassword("secret123");

        LoginResponse response = authService.loginUser(request);

        assertEquals("mocked-jwt-token", response.getToken());
        assertEquals("Login successful", response.getMessage());
        verify(jwtService, times(1)).generateToken("john@example.com");
    }

    @Test
    void loginUser_successWithPhoneNumber_returnsTokenAndSuccessMessage() {
        User user = new User();
        user.setId(1L);
        user.setEmail("john@example.com");
        user.setPhoneNumber("1234567890");
        user.setPassword(ENCODER.encode("secret123"));

        when(userRepository.findAll()).thenReturn(List.of(user));
        when(jwtService.generateToken("john@example.com")).thenReturn("mocked-jwt-token");

        LoginRequest request = new LoginRequest();
        request.setIdentifier("1234567890");
        request.setPassword("secret123");

        LoginResponse response = authService.loginUser(request);

        assertEquals("mocked-jwt-token", response.getToken());
        assertEquals("Login successful", response.getMessage());
        verify(jwtService, times(1)).generateToken("john@example.com");
    }

    @Test
    void loginUser_userDoesNotExist_throwsBadCredentialsAndNeverGeneratesToken() {
        when(userRepository.findAll()).thenReturn(List.of());

        LoginRequest request = new LoginRequest();
        request.setIdentifier("nobody@example.com");
        request.setPassword("whatever");

        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.loginUser(request)
        );

        assertEquals("Invalid credentials", exception.getMessage());
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void loginUser_incorrectPassword_throwsBadCredentialsAndNeverGeneratesToken() {
        User user = new User();
        user.setEmail("john@example.com");
        user.setPassword(ENCODER.encode("secret123"));

        when(userRepository.findAll()).thenReturn(List.of(user));

        LoginRequest request = new LoginRequest();
        request.setIdentifier("john@example.com");
        request.setPassword("wrongPassword");

        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.loginUser(request)
        );

        assertEquals("Invalid credentials", exception.getMessage());
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void loginUser_nullPassword_throwsBadCredentialsAndNeverGeneratesToken() {
        User user = new User();
        user.setEmail("john@example.com");
        user.setPassword(ENCODER.encode("secret123"));

        when(userRepository.findAll()).thenReturn(List.of(user));

        LoginRequest request = new LoginRequest();
        request.setIdentifier("john@example.com");
        request.setPassword(null);

        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.loginUser(request)
        );

        assertEquals("Invalid credentials", exception.getMessage());
        verify(jwtService, never()).generateToken(anyString());
    }

    // ---------------------------------------------------------------
    // Change password
    // ---------------------------------------------------------------

    @Test
    void changePassword_success_encodesAndSavesNewPassword() {
        String email = "john@example.com";
        setAuthenticatedUser(email);

        User user = new User();
        user.setEmail(email);
        user.setPassword(ENCODER.encode("oldPass123"));

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPass123");
        request.setNewPassword("newPass456");

        ApiResponse response = authService.changePassword(request);

        assertTrue(response.isSuccess());
        assertEquals("Password changed successfully", response.getMessage());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());
        assertTrue(ENCODER.matches("newPass456", userCaptor.getValue().getPassword()));
    }

    @Test
    void changePassword_newPasswordEqualsCurrentPassword_returnsFailureWithoutSaving() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("samePassword");
        request.setNewPassword("samePassword");

        ApiResponse response = authService.changePassword(request);

        assertFalse(response.isSuccess());
        assertEquals(
                "New password cannot be the same as the current password",
                response.getMessage()
        );
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changePassword_incorrectCurrentPassword_returnsFailureWithoutSaving() {
        String email = "john@example.com";
        setAuthenticatedUser(email);

        User user = new User();
        user.setEmail(email);
        user.setPassword(ENCODER.encode("correctPassword"));

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongPassword");
        request.setNewPassword("newPassword456");

        ApiResponse response = authService.changePassword(request);

        assertFalse(response.isSuccess());
        assertEquals("Current password is incorrect", response.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changePassword_unauthenticatedUser_returnsUnauthorizedWithoutSaving() {
        SecurityContextHolder.clearContext();

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPassword");
        request.setNewPassword("newPassword456");

        ApiResponse response = authService.changePassword(request);

        assertFalse(response.isSuccess());
        assertEquals("Unauthorized", response.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changePassword_authenticatedUserNotFound_returnsFailureWithoutSaving() {
        String email = "ghost@example.com";
        setAuthenticatedUser(email);

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPassword");
        request.setNewPassword("newPassword456");

        ApiResponse response = authService.changePassword(request);

        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    private void setAuthenticatedUser(String email) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(email, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
