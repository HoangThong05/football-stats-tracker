package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.TeamDetailDto;
import com.hoangthong.footballtracker.entity.IndexedPlayer;
import com.hoangthong.footballtracker.repository.IndexedPlayerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

/**
 * Lap chi muc cau thu de tim kiem, va tim kiem tren do.
 *
 * Xem {@link IndexedPlayer} de biet vi sao khong tim truc tiep qua API.
 */
@Service
public class PlayerIndexService {

    private static final Logger log = LoggerFactory.getLogger(PlayerIndexService.class);
    private static final int MAX_RESULTS = 40;
    private static final int MIN_QUERY_LENGTH = 2;

    private final IndexedPlayerRepository repository;

    public PlayerIndexService(IndexedPlayerRepository repository) {
        this.repository = repository;
    }

    /**
     * Bo dau tieng Viet lan dau cac ngon ngu chau Au, roi ha chu thuong.
     *
     * "Ødegaard" -> "odegaard", "Martínez" -> "martinez". Khong co buoc nay thi
     * nguoi dung phai go dung ca dau moi ra ket qua, tuc la gan nhu khong bao gio ra.
     */
    static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        String noMarks = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        /*
         * NFD khong tach duoc chu co gach ngang giua than chu (D-gach, O-gach...) vi
         * chung la ky tu doc lap chu khong phai chu cai + dau. Phai thay tay.
         */
        return noMarks
                .replace('đ', 'd').replace('Đ', 'D')
                .replace('ø', 'o').replace('Ø', 'O')
                .replace('ð', 'd').replace('Ð', 'D')
                .replace('ł', 'l').replace('Ł', 'L')
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    /** Ghi (hoac cap nhat) toan bo doi hinh cua mot doi vao chi muc. */
    @Transactional
    public int indexTeam(TeamDetailDto team, String leagueCode) {
        if (team == null || team.squad() == null || team.squad().isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        List<IndexedPlayer> rows = team.squad().stream()
                .map(p -> {
                    IndexedPlayer row = repository.findById(p.id()).orElseGet(() -> new IndexedPlayer(p.id()));
                    row.setName(p.name());
                    row.setNameNormalized(normalize(p.name()));
                    row.setPosition(p.position());
                    row.setNationality(p.nationality());
                    row.setAge(p.age());
                    row.setTeamId(team.id());
                    row.setTeamName(team.name());
                    row.setTeamCrest(team.crest());
                    /*
                     * Chi ghi de ma giai khi biet chac. Nguoi dung mo trang doi bong thi
                     * khong kem theo ma giai - luc do giu nguyen gia tri cu, khong xoa mat
                     * thong tin ma job lam am da ghi truoc do.
                     */
                    if (leagueCode != null) {
                        row.setLeagueCode(leagueCode);
                    }
                    row.setUpdatedAt(now);
                    return row;
                })
                .toList();

        repository.saveAll(rows);
        return rows.size();
    }

    public List<IndexedPlayer> search(String query, String leagueCode) {
        String q = normalize(query);
        if (q.length() < MIN_QUERY_LENGTH) {
            return List.of();
        }
        var page = PageRequest.of(0, MAX_RESULTS);
        return leagueCode == null || leagueCode.isBlank()
                ? repository.searchAll(q, page)
                : repository.searchInLeague(q, leagueCode, page);
    }

    public List<IndexedPlayer> byTeam(long teamId) {
        return repository.findByTeamId(teamId);
    }

    /** So cau thu va so doi da co trong chi muc - de giao dien bao tien do. */
    public java.util.Map<String, Long> status() {
        return java.util.Map.of(
                "players", repository.count(),
                "teams", repository.countDistinctTeams());
    }

    public long countInLeague(String leagueCode) {
        return repository.countByLeagueCode(leagueCode);
    }

    public List<Long> indexedTeamIds(String leagueCode) {
        return repository.findIndexedTeamIds(leagueCode);
    }

    void logIndexed(String leagueCode, String teamName, int players) {
        log.info("Da lap chi muc {} cau thu cua doi '{}' ({})", players, teamName, leagueCode);
    }
}
