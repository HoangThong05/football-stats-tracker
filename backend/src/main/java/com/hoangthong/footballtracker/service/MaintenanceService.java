package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.MaintenanceState;
import com.hoangthong.footballtracker.repository.MaintenanceStateRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Che do bao tri: mot cong tac toan he thong.
 *
 * Trang thai giu trong bo nho (doc nhanh, khong dinh DB moi request) va dong bo xuong DB
 * khi admin doi - nho vay song qua restart/deploy.
 */
@Service
public class MaintenanceService {

    private final MaintenanceStateRepository repo;

    private volatile boolean enabled;
    private volatile String message = "";

    public MaintenanceService(MaintenanceStateRepository repo) {
        this.repo = repo;
    }

    /** Nap trang thai da luu khi khoi dong (vd deploy xong van con dang bao tri). */
    @PostConstruct
    void load() {
        repo.findById(MaintenanceState.SINGLETON_ID).ifPresent(s -> {
            this.enabled = s.isEnabled();
            this.message = s.getMessage() == null ? "" : s.getMessage();
        });
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getMessage() {
        return message;
    }

    /** Admin bat/tat bao tri + dat loi nhan. */
    @Transactional
    public void set(boolean on, String rawMessage) {
        String trimmed = rawMessage == null ? "" : rawMessage.trim();
        final String msg = trimmed.length() > MaintenanceState.MAX_MESSAGE
                ? trimmed.substring(0, MaintenanceState.MAX_MESSAGE) : trimmed;
        MaintenanceState state = repo.findById(MaintenanceState.SINGLETON_ID)
                .orElseGet(() -> new MaintenanceState(on, msg));
        state.update(on, msg);
        repo.save(state);
        this.enabled = on;
        this.message = msg;
    }
}
