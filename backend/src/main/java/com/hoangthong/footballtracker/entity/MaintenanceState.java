package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Trang thai BAO TRI he thong - mot dong duy nhat (id = 1).
 *
 * Admin bat len thi nguoi dung thuong bi chan bang banner phu kin man hinh; admin van vao
 * duoc de sua. Luu DB de song qua moi lan restart/deploy.
 */
@Entity
@Table(name = "maintenance_state")
public class MaintenanceState {

    public static final long SINGLETON_ID = 1L;
    public static final int MAX_MESSAGE = 500;

    @Id
    private Long id = SINGLETON_ID;

    @Column
    private Boolean enabled;

    @Column(length = MAX_MESSAGE)
    private String message;

    @Column
    private Instant updatedAt;

    protected MaintenanceState() {
        // JPA can
    }

    public MaintenanceState(boolean enabled, String message) {
        this.id = SINGLETON_ID;
        this.enabled = enabled;
        this.message = message;
        this.updatedAt = Instant.now();
    }

    public boolean isEnabled() {
        return Boolean.TRUE.equals(enabled);
    }

    public String getMessage() {
        return message;
    }

    public void update(boolean enabled, String message) {
        this.enabled = enabled;
        this.message = message;
        this.updatedAt = Instant.now();
    }
}
