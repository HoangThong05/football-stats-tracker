package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Anh xa TEN DOI (da chuan hoa) -> id doi ben API-Football.
 *
 * Truoc day bang nay chi nam trong RAM, ma Render goi free cho app NGU sau ~15 phut
 * khong ai truy cap. Moi lan thuc day la mat sach, phai goi lai 6 request chi de dung
 * lai bang map -> ngay ngu/thuc vai chuc lan la dot het quota, va nhin tu phia
 * API-Football rat giong hanh vi lam dung.
 *
 * Luu xuong DB nen app ngu day van con du lieu; chi goi lai API khi bang trong
 * hoac da qua cu (xem ApiFootballTeamMappingService).
 */
@Entity
@Table(name = "api_football_team_map")
public class ApiFootballTeamMap {

    /** Ten doi da chuan hoa (thuong, bo "fc"/"cf" va ky tu dac biet). */
    @Id
    @Column(name = "normalized_name", length = 120)
    private String normalizedName;

    @Column(name = "api_football_id", nullable = false)
    private Long apiFootballId;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected ApiFootballTeamMap() {
        // JPA can
    }

    public ApiFootballTeamMap(String normalizedName, Long apiFootballId) {
        this.normalizedName = normalizedName;
        this.apiFootballId = apiFootballId;
    }

    public String getNormalizedName() {
        return normalizedName;
    }

    public Long getApiFootballId() {
        return apiFootballId;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setApiFootballId(Long apiFootballId) {
        this.apiFootballId = apiFootballId;
        this.updatedAt = Instant.now();
    }
}
