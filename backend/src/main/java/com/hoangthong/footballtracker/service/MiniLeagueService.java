package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.MiniLeagueDto;
import com.hoangthong.footballtracker.entity.LeagueMember;
import com.hoangthong.footballtracker.entity.MiniLeague;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.LeagueMemberRepository;
import com.hoangthong.footballtracker.repository.MiniLeagueRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.List;

@Service
public class MiniLeagueService {

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final MiniLeagueRepository leagueRepo;
    private final LeagueMemberRepository memberRepo;
    private final UserRepository userRepo;
    private final com.hoangthong.footballtracker.repository.PredictionRepository predictionRepo;
    private final com.hoangthong.footballtracker.repository.RoomMessageRepository messageRepo;

    /** So tin gan nhat tra ve moi lan - du cho mot khung chat, khong keo ca lich su. */
    private static final int MESSAGE_LIMIT = 50;

    /** Chi hien du doan cua cac tran trong 14 ngay gan day - du de theo doi vong dau vua qua. */
    private static final java.time.Duration PICKS_WINDOW = java.time.Duration.ofDays(14);

    public MiniLeagueService(MiniLeagueRepository leagueRepo,
                              LeagueMemberRepository memberRepo,
                              UserRepository userRepo,
                              com.hoangthong.footballtracker.repository.PredictionRepository predictionRepo,
                              com.hoangthong.footballtracker.repository.RoomMessageRepository messageRepo) {
        this.messageRepo = messageRepo;
        this.leagueRepo = leagueRepo;
        this.memberRepo = memberRepo;
        this.userRepo = userRepo;
        this.predictionRepo = predictionRepo;
    }

    /**
     * Du doan cua CA PHONG cho tung tran, chi gom tran DA LAN BANH.
     *
     * Day la phan thu vi nhat khi choi voi ban be: bang diem cho biet ai hon, con cai nay
     * cho thay ho choi kieu gi. Nhung phai giau den khi bong lan - xem ghi chu o
     * PredictionRepository.findRevealedForUsers.
     */
    public List<MiniLeagueDto.RoomMatchPicks> roomPicks(String email, Long leagueId) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "league_not_found"));
        if (!memberRepo.existsByLeagueAndUser(league, user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_a_member");
        }

        List<Long> memberIds = memberRepo.findByLeague(league).stream()
                .map(m -> m.getUser().getId())
                .toList();
        if (memberIds.isEmpty()) {
            return List.of();
        }

        java.time.Instant now = java.time.Instant.now();
        var predictions = predictionRepo.findRevealedForUsers(memberIds, now, now.minus(PICKS_WINDOW));

        // Giu nguyen thu tu tran moi nhat truoc ma truy van da sap xep
        var byMatch = new java.util.LinkedHashMap<Long, MiniLeagueDto.RoomMatchPicks>();
        for (var p : predictions) {
            var m = p.getMatch();
            var row = byMatch.computeIfAbsent(m.getId(), id -> new MiniLeagueDto.RoomMatchPicks(
                    m.getId(), m.getCompetition(), m.getUtcDate(),
                    m.getHomeTeam(), m.getHomeCrest(),
                    m.getAwayTeam(), m.getAwayCrest(),
                    m.getHomeScore(), m.getAwayScore(), m.getStatus(),
                    new java.util.ArrayList<>()));
            row.picks().add(new MiniLeagueDto.MemberPick(
                    p.getUser().getId(),
                    p.getUser().displayNameOrFallback(),
                    p.getPredictedHomeScore(), p.getPredictedAwayScore(), p.getPoints()));
        }

        // Trong moi tran: diem cao len truoc, chua cham diem xuong duoi
        for (var row : byMatch.values()) {
            row.picks().sort(java.util.Comparator.comparing(
                    (MiniLeagueDto.MemberPick pk) -> pk.points() == null ? -1 : pk.points()).reversed());
        }
        return List.copyOf(byMatch.values());
    }

    @Transactional
    public MiniLeagueDto.LeagueResponse createLeague(String email, String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "room_name_blank");
        }
        User owner = getUser(email);
        String code = generateUniqueCode();
        MiniLeague league = leagueRepo.save(new MiniLeague(name.trim(), code, owner));
        memberRepo.save(new LeagueMember(league, owner));
        return toResponse(league, owner, 1);
    }

    @Transactional
    public MiniLeagueDto.LeagueResponse joinLeague(String email, String inviteCode) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findByInviteCode(inviteCode.toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "invite_code_invalid"));
        if (memberRepo.existsByLeagueAndUser(league, user)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "already_joined");
        }
        memberRepo.save(new LeagueMember(league, user));
        int count = memberRepo.findByLeague(league).size();
        return toResponse(league, user, count);
    }

    @Transactional(readOnly = true)
    public List<MiniLeagueDto.LeagueResponse> myLeagues(String email) {
        User user = getUser(email);
        return memberRepo.findByUser(user).stream()
                .map(m -> {
                    MiniLeague l = m.getLeague();
                    int count = memberRepo.findByLeague(l).size();
                    return toResponse(l, user, count);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public MiniLeagueDto.LeagueLeaderboardResponse leaderboard(String email, Long leagueId) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "league_not_found"));
        if (!memberRepo.existsByLeagueAndUser(league, user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_a_member");
        }
        List<Object[]> rows = memberRepo.findLeaderboard(leagueId);
        List<MiniLeagueDto.LeagueLeaderboardEntry> entries = new java.util.ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Object[] row = rows.get(i);
            String memberName = row[2] != null && !((String) row[2]).isBlank()
                    ? (String) row[2]
                    : User.fallbackName((String) row[1]);
            entries.add(new MiniLeagueDto.LeagueLeaderboardEntry(
                    i + 1,
                    ((Number) row[0]).longValue(),
                    memberName,
                    ((Number) row[3]).longValue(),
                    ((Number) row[4]).longValue(),
                    ((Number) row[5]).longValue()
            ));
        }
        return new MiniLeagueDto.LeagueLeaderboardResponse(
                league.getId(), league.getName(), league.getInviteCode(), entries);
    }

    /** Tin nhan gan nhat trong phong, cu -> moi de hien thang tu tren xuong. */
    public List<MiniLeagueDto.RoomMessageDto> messages(String email, Long leagueId) {
        MiniLeague league = requireMember(email, leagueId);
        var page = org.springframework.data.domain.PageRequest.of(0, MESSAGE_LIMIT);
        var latest = new java.util.ArrayList<>(messageRepo.findLatest(league.getId(), page));
        java.util.Collections.reverse(latest);
        return latest.stream()
                .map(m -> new MiniLeagueDto.RoomMessageDto(
                        m.getId(),
                        m.getAuthor().getId(),
                        m.getAuthor().displayNameOrFallback(),
                        m.getAuthor().getAvatarUrl(),
                        m.getAuthor().getFeaturedBadge(),
                        m.getContent(),
                        m.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void postMessage(String email, Long leagueId, String rawContent) {
        MiniLeague league = requireMember(email, leagueId);
        String content = rawContent == null ? "" : rawContent.trim();
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message_empty");
        }
        if (content.length() > com.hoangthong.footballtracker.entity.RoomMessage.MAX_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message_too_long");
        }
        messageRepo.save(new com.hoangthong.footballtracker.entity.RoomMessage(
                league, getUser(email), content));
    }

    /**
     * Chi thanh vien trong phong moi doc/gui duoc.
     *
     * Phong la khong gian rieng - de lot nguoi ngoai vao doc thi no khong con rieng nua,
     * ma nguoi trong phong lai tuong la rieng nen noi chuyen thoai mai.
     */
    private MiniLeague requireMember(String email, Long leagueId) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "league_not_found"));
        if (!memberRepo.existsByLeagueAndUser(league, user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_a_member");
        }
        return league;
    }

    @Transactional
    public void leaveLeague(String email, Long leagueId) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "league_not_found"));
        if (league.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "owner_cannot_leave");
        }
        LeagueMember member = memberRepo.findByLeagueAndUser(league, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not_a_member"));
        memberRepo.delete(member);
    }

    @Transactional
    public void deleteLeague(String email, Long leagueId) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "league_not_found"));
        if (!league.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_owner");
        }
        memberRepo.deleteAll(memberRepo.findByLeague(league));
        leagueRepo.delete(league);
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "user_not_found"));
    }

    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
            code = sb.toString();
        } while (leagueRepo.existsByInviteCode(code));
        return code;
    }

    private MiniLeagueDto.LeagueResponse toResponse(MiniLeague l, User currentUser, int memberCount) {
        return new MiniLeagueDto.LeagueResponse(
                l.getId(),
                l.getName(),
                l.getInviteCode(),
                l.getOwner().getEmail(),
                memberCount,
                l.getCreatedAt(),
                l.getOwner().getId().equals(currentUser.getId())
        );
    }
}