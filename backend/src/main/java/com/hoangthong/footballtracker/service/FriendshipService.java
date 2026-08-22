package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.FriendDto;
import com.hoangthong.footballtracker.entity.Friendship;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.FriendshipRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FriendshipService {

    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;

    public FriendshipService(UserRepository userRepository, FriendshipRepository friendshipRepository) {
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
    }

    /** Trang thai quan he giua nguoi dang xem va nguoi duoc xem - de nut hien dung chu. */
    public enum Relation { NONE, PENDING_SENT, PENDING_RECEIVED, FRIENDS, SELF }

    public Relation relationWith(String email, long otherId) {
        if (email == null) {
            return Relation.NONE;
        }
        User me = getUser(email);
        if (me.getId() == otherId) {
            return Relation.SELF;
        }
        return friendshipRepository.findBetween(me.getId(), otherId)
                .map(f -> {
                    if (f.getStatus() == Friendship.Status.ACCEPTED) {
                        return Relation.FRIENDS;
                    }
                    return f.getRequester().getId().equals(me.getId())
                            ? Relation.PENDING_SENT
                            : Relation.PENDING_RECEIVED;
                })
                .orElse(Relation.NONE);
    }

    @Transactional
    public void request(String email, long targetId) {
        User me = getUser(email);
        if (me.getId() == targetId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cannot_friend_self");
        }
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));

        var existing = friendshipRepository.findBetween(me.getId(), targetId);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            /*
             * Doi phuong da gui loi moi cho minh tu truoc -> bam "Ket ban" chinh la dong y.
             * Khong xu ly the thi hai nguoi cung bam se ket o trang thai cho lan nhau mai.
             */
            if (f.getStatus() == Friendship.Status.PENDING && f.getAddressee().getId().equals(me.getId())) {
                f.setStatus(Friendship.Status.ACCEPTED);
                friendshipRepository.save(f);
                return;
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "friend_request_exists");
        }
        friendshipRepository.save(new Friendship(me, target));
    }

    @Transactional
    public void accept(String email, long requesterId) {
        User me = getUser(email);
        Friendship f = friendshipRepository.findBetween(me.getId(), requesterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "request_not_found"));

        // Chi NGUOI NHAN moi duoc dong y; nguoi gui bam thi hoa ra tu ket ban voi minh
        if (f.getStatus() != Friendship.Status.PENDING || !f.getAddressee().getId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request_not_found");
        }
        f.setStatus(Friendship.Status.ACCEPTED);
        friendshipRepository.save(f);
    }

    /** Dung cho ca tu choi loi moi, huy loi moi da gui, va huy ket ban. */
    @Transactional
    public void remove(String email, long otherId) {
        User me = getUser(email);
        Friendship f = friendshipRepository.findBetween(me.getId(), otherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "request_not_found"));
        friendshipRepository.delete(f);
    }

    public List<FriendDto> friends(String email) {
        User me = getUser(email);
        return friendshipRepository.findAcceptedOf(me.getId()).stream()
                .map(f -> toDto(f.other(me.getId()), f))
                .toList();
    }

    public List<FriendDto> incomingRequests(String email) {
        User me = getUser(email);
        return friendshipRepository.findIncomingRequests(me.getId()).stream()
                .map(f -> toDto(f.getRequester(), f))
                .toList();
    }

    private static FriendDto toDto(User u, Friendship f) {
        return new FriendDto(u.getId(), u.displayNameOrFallback(), f.getCreatedAt().toString());
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
    }
}
