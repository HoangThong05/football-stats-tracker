package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.TheSportsDbClient;
import com.hoangthong.footballtracker.client.dto.TheSportsDbResponses.AllPlayers;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Anh cau thu lay tu TheSportsDB, ghep theo TEN. Cache trong bo nho theo doi (id
 * football-data) de khong goi TheSportsDB moi lan xem - lam moi sau 7 ngay.
 */
@Service
public class PlayerPhotoService {

    private static final Duration TTL = Duration.ofDays(7);

    private final TheSportsDbClient client;
    private final Map<Long, Entry> cache = new ConcurrentHashMap<>();

    public PlayerPhotoService(TheSportsDbClient client) {
        this.client = client;
    }

    /** Ket qua tra cuu anh cho mot doi: tra theo nguyen ten, va theo ho. */
    public record Photos(Map<String, String> byName, Map<String, String> bySurname) {
        public String find(String playerName) {
            String photo = byName.get(norm(playerName));
            if (photo == null) {
                String sn = surname(playerName);
                if (sn != null) photo = bySurname.get(sn);
            }
            return photo;
        }
        public boolean isEmpty() {
            return byName.isEmpty();
        }
    }

    private record Entry(Photos photos, Instant at) {}

    /** Lay map anh cho mot doi (co cache). teamName la ten tu football-data. */
    public Photos forTeam(long fdTeamId, String teamName) {
        Entry cached = cache.get(fdTeamId);
        if (cached != null && cached.at().isAfter(Instant.now().minus(TTL))) {
            return cached.photos();
        }
        Photos photos = fetch(teamName);
        cache.put(fdTeamId, new Entry(photos, Instant.now()));
        return photos;
    }

    public void clear() {
        cache.clear();
    }

    private Photos fetch(String teamName) {
        Map<String, String> byName = new HashMap<>();
        Map<String, String> bySurname = new HashMap<>();
        Optional<String> idTeam = client.findTeamId(teamName);
        if (idTeam.isEmpty()) {
            return new Photos(byName, bySurname);
        }
        for (AllPlayers.Player p : client.players(idTeam.get())) {
            String photo = p.strThumb() != null && !p.strThumb().isBlank() ? p.strThumb() : p.strCutout();
            if (photo == null || photo.isBlank() || p.strPlayer() == null) continue;
            byName.putIfAbsent(norm(p.strPlayer()), photo);
            String sn = surname(p.strPlayer());
            if (sn != null) bySurname.putIfAbsent(sn, photo);
        }
        return new Photos(byName, bySurname);
    }

    /** Bo dau, thuong hoa, chi giu chu-so-khoang trang - de khop ten giua hai nguon. */
    static String norm(String s) {
        if (s == null) return "";
        String d = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return d.toLowerCase().replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }

    static String surname(String s) {
        String n = norm(s);
        if (n.isEmpty()) return null;
        String[] parts = n.split(" ");
        return parts[parts.length - 1];
    }
}
