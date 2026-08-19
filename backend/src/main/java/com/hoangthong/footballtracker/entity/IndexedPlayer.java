package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Mot cau thu trong chi muc tim kiem.
 *
 * VI SAO PHAI CO BANG NAY: football-data.org tra doi hinh kem theo chi tiet TUNG DOI,
 * moi doi mot request, ma han muc chi 10 request/phut. Muon tim cau thu tren ca giai
 * ma di goi 20 doi mot luc thi cham tran ngay lap tuc va ca trang bao loi.
 *
 * Nen chi muc duoc lap dan: doi nao duoc tai ve (nguoi dung mo, hoac job lam am tu goi
 * moi lan mot doi) thi ghi vao day. Tim kiem doc tu bang nay, KHONG goi API lan nao.
 * Doi lai: cau thu chi tim thay sau khi doi cua ho da duoc lap chi muc it nhat mot lan.
 */
@Entity
@Table(name = "indexed_player", indexes = {
        @Index(name = "idx_indexed_player_name", columnList = "nameNormalized"),
        @Index(name = "idx_indexed_player_team", columnList = "teamId")
})
public class IndexedPlayer {

    /** Id cau thu tu football-data.org. */
    @Id
    private Long id;

    @Column(nullable = false)
    private String name;

    /**
     * Ten da bo dau va ha chu thuong, dung de so khop.
     * Khong co no thi go "martinez" se khong ra "Martinez", va "Ødegaard" thi
     * gan nhu khong ai go dung duoc.
     */
    @Column(nullable = false)
    private String nameNormalized;

    private String position;
    private String nationality;
    private Integer age;

    private Long teamId;
    private String teamName;
    private String teamCrest;

    /** Ma giai (PL, PD, BL1...). Null khi doi duoc lap chi muc ngoai job lam am. */
    private String leagueCode;

    private Instant updatedAt;

    protected IndexedPlayer() {
        // JPA can
    }

    public IndexedPlayer(Long id) {
        this.id = id;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameNormalized() { return nameNormalized; }
    public void setNameNormalized(String nameNormalized) { this.nameNormalized = nameNormalized; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getTeamCrest() { return teamCrest; }
    public void setTeamCrest(String teamCrest) { this.teamCrest = teamCrest; }

    public String getLeagueCode() { return leagueCode; }
    public void setLeagueCode(String leagueCode) { this.leagueCode = leagueCode; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
