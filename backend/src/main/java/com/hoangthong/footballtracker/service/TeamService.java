package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.TeamApiResponse;
import com.hoangthong.footballtracker.config.CacheConfig;
import com.hoangthong.footballtracker.dto.TeamDetailDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class TeamService {

    private static final Logger log = LoggerFactory.getLogger(TeamService.class);

    private final FootballDataClient client;
    private final TeamSquadService squadService;

    public TeamService(FootballDataClient client, TeamSquadService squadService) {
        this.client = client;
        this.squadService = squadService;
    }

    @Cacheable(value = CacheConfig.TEAMS_CACHE, key = "#teamId")
    public TeamDetailDto getTeam(long teamId) {
        log.info("CACHE MISS -> goi football-data.org cho doi bong id: {}", teamId);

        TeamApiResponse response = client.getTeam(teamId);
        String coachName = response.coach() != null ? response.coach().name() : null;

        /*
         * football-data.org TRA VE san doi hinh ngay trong chinh request nay (da kiem chung:
         * Arsenal 29 cau thu). Truoc day code bo qua no va di goi API-Football - vua ton them
         * request cua mot dich vu khac, vua la nguyen nhan khien tai khoan do bi khoa.
         *
         * Nguon nay khong co anh va so ao, nhung bu lai co quoc tich; va quan trong nhat la
         * KHONG ton them request nao. Chi khi no rong moi lui ve API-Football.
         */
        List<TeamDetailDto.PlayerDto> squad = mapSquad(response.squad());
        if (squad.isEmpty()) {
            log.info("football-data.org khong co doi hinh cho doi {} -> thu API-Football", teamId);
            squad = squadService.getSquad(teamId, response.name(), response.shortName());
        } else {
            // football-data khong co anh -> ghep anh tu API-Football theo ten (best-effort)
            squad = withPhotos(squad, teamId, response.name(), response.shortName());
        }

        return new TeamDetailDto(
                response.id(),
                response.name(),
                response.crest(),
                response.founded(),
                response.venue(),
                response.clubColors(),
                response.website(),
                coachName,
                squad
        );
    }

    /**
     * Doi cau thu tu football-data.org sang DTO cua ta.
     * Nguon nay khong co anh/so ao (de null), bu lai co quoc tich va ngay sinh.
     */
    private static List<TeamDetailDto.PlayerDto> mapSquad(List<TeamApiResponse.Player> players) {
        if (players == null) return List.of();

        return players.stream()
                .map(p -> new TeamDetailDto.PlayerDto(
                        p.id(),
                        p.name(),
                        p.position(),
                        p.nationality(),
                        null, // khong co anh cau thu
                        null, // khong co so ao
                        ageFrom(p.dateOfBirth())
                ))
                .toList();
    }

    /**
     * Ghep anh cau thu tu API-Football vao doi hinh football-data, doi chieu theo TEN.
     *
     * API-Football (qua TeamSquad, cache 7 ngay) co anh; hai nguon dung id khac nhau nen
     * phai khop ten (bo dau, thuong hoa). Khop nguyen ten truoc, khong duoc thi thu theo HO.
     * Loi/thieu thi giu nguyen (avatar chu cai) - khong bao gio lam vo trang doi.
     */
    private List<TeamDetailDto.PlayerDto> withPhotos(List<TeamDetailDto.PlayerDto> fdSquad,
                                                     long teamId, String name, String shortName) {
        java.util.Map<String, String> byName = new java.util.HashMap<>();
        java.util.Map<String, String> bySurname = new java.util.HashMap<>();
        try {
            for (TeamDetailDto.PlayerDto af : squadService.getSquad(teamId, name, shortName)) {
                if (af.photoUrl() == null || af.name() == null) continue;
                byName.putIfAbsent(norm(af.name()), af.photoUrl());
                String sn = surname(af.name());
                if (sn != null) bySurname.putIfAbsent(sn, af.photoUrl());
            }
        } catch (RuntimeException e) {
            log.warn("Khong ghep duoc anh cau thu cho doi {}: {}", teamId, e.getMessage());
            return fdSquad;
        }
        if (byName.isEmpty()) return fdSquad;

        return fdSquad.stream().map(p -> {
            String photo = byName.get(norm(p.name()));
            if (photo == null) photo = bySurname.get(surname(p.name()));
            if (photo == null) return p;
            return new TeamDetailDto.PlayerDto(
                    p.id(), p.name(), p.position(), p.nationality(), photo, p.jerseyNumber(), p.age());
        }).toList();
    }

    /** Bo dau, thuong hoa, chi giu chu-so-khoang trang - de khop ten giua hai nguon. */
    private static String norm(String s) {
        if (s == null) return "";
        String d = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return d.toLowerCase().replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }

    private static String surname(String s) {
        String n = norm(s);
        if (n.isEmpty()) return null;
        String[] parts = n.split(" ");
        return parts[parts.length - 1];
    }

    /** Ngay sinh dang "1998-03-21" -> tuoi. Tra null neu thieu/sai dinh dang. */
    private static Integer ageFrom(String dateOfBirth) {
        if (dateOfBirth == null || dateOfBirth.isBlank()) return null;
        try {
            return Period.between(LocalDate.parse(dateOfBirth), LocalDate.now()).getYears();
        } catch (DateTimeParseException ex) {
            return null;
        }
    }
}