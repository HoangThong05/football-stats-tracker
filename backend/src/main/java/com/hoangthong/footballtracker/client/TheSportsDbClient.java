package com.hoangthong.footballtracker.client;

import com.hoangthong.footballtracker.client.dto.TheSportsDbResponses.AllPlayers;
import com.hoangthong.footballtracker.client.dto.TheSportsDbResponses.SearchTeams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

/**
 * Client goi TheSportsDB (v1) de lay ANH cau thu.
 *
 * Khac API-Football: khong can tai khoan, key "3" cong khai dung duoc; khong gioi han mua.
 * Anh nam o strThumb / strCutout. Do phu khong day du (thien ve cau thu/ doi noi tieng).
 */
@Component
public class TheSportsDbClient {

    private static final Logger log = LoggerFactory.getLogger(TheSportsDbClient.class);

    private final RestClient restClient;

    public TheSportsDbClient(
            @Value("${thesportsdb.base-url:https://www.thesportsdb.com/api/v1/json}") String baseUrl,
            @Value("${thesportsdb.key:3}") String key) {
        this.restClient = RestClient.builder().baseUrl(baseUrl + "/" + key).build();
    }

    /**
     * Tim id doi NAM cua TheSportsDB theo ten. Thu nguyen ten truoc, khong duoc thi bo hau
     * to (FC/CF/AFC/SC/&...) roi thu lai. Loai doi NU / TRE / DU BI de khong ghep anh sai doi.
     */
    public Optional<String> findTeamId(String teamName) {
        Optional<String> hit = search(teamName);
        if (hit.isPresent()) return hit;
        String cleaned = stripSuffix(teamName);
        return cleaned.equalsIgnoreCase(teamName) ? Optional.empty() : search(cleaned);
    }

    private Optional<String> search(String q) {
        try {
            SearchTeams res = restClient.get()
                    .uri("/searchteams.php?t={name}", q)
                    .retrieve()
                    .body(SearchTeams.class);
            if (res == null || res.teams() == null) return Optional.empty();

            String want = norm(q);
            String fallback = null;
            for (SearchTeams.Team t : res.teams()) {
                if (t.idTeam() == null || isNotMensSoccer(t)) continue;
                if (norm(t.strTeam()).equals(want)) return Optional.of(t.idTeam()); // khop chuan
                if (fallback == null) fallback = t.idTeam();
            }
            return Optional.ofNullable(fallback);
        } catch (Exception e) {
            log.warn("TheSportsDB: loi tim doi '{}': {}", q, e.getMessage());
            return Optional.empty();
        }
    }

    /** Bo doi khong phai bong da NAM (nu/tre/du bi) de tranh ghep nham anh. */
    private static boolean isNotMensSoccer(SearchTeams.Team t) {
        if (t.strSport() != null && !"Soccer".equalsIgnoreCase(t.strSport())) return true;
        if (t.strGender() != null && !"Male".equalsIgnoreCase(t.strGender())) return true;
        String n = t.strTeam() == null ? "" : t.strTeam().toLowerCase();
        return n.contains("women") || n.contains("ladies") || n.contains("wfc")
                || n.contains("u23") || n.contains("u21") || n.contains("u20")
                || n.contains("u19") || n.contains("u18");
    }

    private static String stripSuffix(String name) {
        return name.replaceAll("(?i)\\b(fc|cf|afc|sc)\\b", " ")
                .replace("&", " ").replaceAll("\\s+", " ").trim();
    }

    private static String norm(String s) {
        if (s == null) return "";
        String d = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return d.toLowerCase().replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }

    /** Danh sach cau thu (kem anh) cua mot doi TheSportsDB. */
    public List<AllPlayers.Player> players(String idTeam) {
        try {
            AllPlayers res = restClient.get()
                    .uri("/lookup_all_players.php?id={id}", idTeam)
                    .retrieve()
                    .body(AllPlayers.class);
            return res == null || res.player() == null ? List.of() : res.player();
        } catch (Exception e) {
            log.warn("TheSportsDB: loi lay cau thu doi id={}: {}", idTeam, e.getMessage());
            return List.of();
        }
    }
}
