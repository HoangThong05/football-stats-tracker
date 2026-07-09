package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.UserSummaryDto;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserSummaryDto> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummaryDto(
                        u.getId(),
                        u.getEmail(),
                        u.getRole().name(),
                        u.getCreatedAt().toString()))
                .toList();
    }
}
