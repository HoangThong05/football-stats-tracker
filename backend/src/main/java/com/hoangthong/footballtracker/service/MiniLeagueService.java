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
            entries.add(new MiniLeagueDto.LeagueLeaderboardEntry(
                    i + 1,
                    (String) row[1],
                    ((Number) row[2]).longValue()
            ));
        }
        return new MiniLeagueDto.LeagueLeaderboardResponse(
                league.getId(), league.getName(), league.getInviteCode(), entries);
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