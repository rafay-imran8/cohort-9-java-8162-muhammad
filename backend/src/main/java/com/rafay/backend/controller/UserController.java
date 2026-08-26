package com.rafay.backend.controller;

import com.rafay.backend.dto.response.UserResponse;
import com.rafay.backend.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser(
            Authentication authentication) {

        return userService.getCurrentUser(
                authentication.getName()
        );
    }
}