package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.Role;
import com.hoangthong.footballtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    /** Dem theo vai tro - dung de chan viec ha quyen nguoi ADMIN cuoi cung. */
    long countByRole(Role role);
}