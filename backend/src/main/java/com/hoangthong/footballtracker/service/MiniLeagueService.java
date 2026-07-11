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

    public MiniLeagueService(MiniLeagueRepository leagueRepo,
                              LeagueMemberRepository memberRepo,
                              UserRepository userRepo) {
        this.leagueRepo = leagueRepo;
        this.memberRepo = memberRepo;
        this.userRepo = userRepo;
    }

    /** Tao phong moi, tu dong them nguoi tao lam thanh vien dau tien. */
    @Transactional
    public MiniLeagueDto.LeagueResponse createLeague(String email, String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten phong khong duoc de trong");
        }
        User owner = getUser(email);
        String code = generateUniqueCode();
        MiniLeague league = leagueRepo.save(new MiniLeague(name.trim(), code, owner));
        memberRepo.save(new LeagueMember(league, owner));
        return toResponse(league, owner, 1);
    }

    /** Tham gia phong bang ma moi. */
    @Transactional
    public MiniLeagueDto.LeagueResponse joinLeague(String email, String inviteCode) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findByInviteCode(inviteCode.toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ma moi khong hop le"));
        if (memberRepo.existsByLeagueAndUser(league, user)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ban da tham gia phong nay roi");
        }
        memberRepo.save(new LeagueMember(league, user));
        int count = memberRepo.findByLeague(league).size();
        return toResponse(league, user, count);
    }

    /** Danh sach phong ma user dang tham gia. */
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

    /** BXH cua 1 phong. */
    public MiniLeagueDto.LeagueLeaderboardResponse leaderboard(String email, Long leagueId) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Phong khong ton tai"));
        if (!memberRepo.existsByLeagueAndUser(league, user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ban chua tham gia phong nay");
        }
        List<Object[]> rows = memberRepo.findLeaderboard(leagueId);
        List<MiniLeagueDto.LeagueLeaderboardEntry> entries = new java.util.ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Object[] row = rows.get(i);
            entries.add(new MiniLeagueDto.LeagueLeaderboardEntry(
                    i + 1,
                    (String) row[1],
                    ((Number) row[2]).longValue()
            ));
        }
        return new MiniLeagueDto.LeagueLeaderboardResponse(
                league.getId(), league.getName(), league.getInviteCode(), entries);
    }

    /** Roi phong (chu phong khong the roi — phai xoa phong). */
    @Transactional
    public void leaveLeague(String email, Long leagueId) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Phong khong ton tai"));
        if (league.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chu phong khong the roi phong. Hay xoa phong neu muon.");
        }
        LeagueMember member = memberRepo.findByLeagueAndUser(league, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ban chua tham gia phong nay"));
        memberRepo.delete(member);
    }

    /** Xoa phong (chi chu phong). */
    @Transactional
    public void deleteLeague(String email, Long leagueId) {
        User user = getUser(email);
        MiniLeague league = leagueRepo.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Phong khong ton tai"));
        if (!league.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chi chu phong moi co the xoa phong");
        }
        memberRepo.deleteAll(memberRepo.findByLeague(league));
        leagueRepo.delete(league);
    }

    // ---- helpers ----

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Khong tim thay user"));
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
