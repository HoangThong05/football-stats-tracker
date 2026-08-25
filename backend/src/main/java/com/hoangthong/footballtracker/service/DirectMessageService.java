package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.DirectMessageDto;
import com.hoangthong.footballtracker.entity.DirectMessage;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.DirectMessageRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Nhan tin rieng 1-1 giua BAN BE.
 *
 * Chi ban be moi gui/xem duoc (kiem qua FriendshipService). Mot hoi thoai suy ra tu cac
 * tin giua hai nguoi, khong co bang rieng.
 */
@Service
public class DirectMessageService {

    private static final int PREVIEW_LEN = 80;

    private final DirectMessageRepository repo;
    private final UserRepository userRepo;
    private final FriendshipService friendshipService;
    private final WebPushService webPush;

    public DirectMessageService(DirectMessageRepository repo, UserRepository userRepo,
                                FriendshipService friendshipService, WebPushService webPush) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.friendshipService = friendshipService;
        this.webPush = webPush;
    }

    /** Gui tin toi mot nguoi BAN. content/image: it nhat mot cai. */
    @Transactional
    public void send(String email, long toId, String rawContent, String rawImageUrl) {
        User me = getUser(email);
        if (me.getId() == toId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cannot_message_self");
        }
        requireFriend(email, toId);
        User to = userRepo.findById(toId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));

        String content = rawContent == null ? "" : rawContent.trim();
        String image = ImageUrl.clean(rawImageUrl);
        if (content.isEmpty() && image == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message_empty");
        }
        if (content.length() > DirectMessage.MAX_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message_too_long");
        }
        repo.save(new DirectMessage(me, to, content, image));

        // Day thong bao cho nguoi nhan, mo dung hoi thoai voi minh
        String preview = content.isEmpty() ? "📷 Đã gửi một ảnh" : excerpt(content);
        webPush.sendToUser(to, me.displayNameOrFallback(), preview, "/?dm=" + me.getId());
    }

    /**
     * Toan bo tin voi mot nguoi, cu -> moi, VA danh dau da doc cac tin ho gui cho minh.
     */
    @Transactional
    public List<DirectMessageDto.Message> conversation(String email, long otherId) {
        User me = getUser(email);
        requireFriend(email, otherId);
        repo.markConversationRead(me.getId(), otherId, Instant.now());
        return repo.findConversation(me.getId(), otherId).stream()
                .map(m -> new DirectMessageDto.Message(
                        m.getId(),
                        m.getSender().getId().equals(me.getId()),
                        m.getContent(),
                        m.getImageUrl(),
                        m.getCreatedAt(),
                        m.getReadAt()))
                .toList();
    }

    /** Danh sach hoi thoai (hop thu), moi nhat truoc. */
    @Transactional(readOnly = true)
    public List<DirectMessageDto.Conversation> conversations(String email) {
        User me = getUser(email);
        List<DirectMessageDto.Conversation> out = new ArrayList<>();
        for (Long partnerId : repo.findPartnerIds(me.getId())) {
            var latestList = repo.findLatestBetween(me.getId(), partnerId, PageRequest.of(0, 1));
            if (latestList.isEmpty()) {
                continue;
            }
            DirectMessage last = latestList.get(0);
            User partner = userRepo.findById(partnerId).orElse(null);
            if (partner == null) {
                continue;
            }
            boolean fromMe = last.getSender().getId().equals(me.getId());
            long unread = repo.countByRecipientIdAndSenderIdAndReadAtIsNull(me.getId(), partnerId);
            out.add(new DirectMessageDto.Conversation(
                    partner.getId(),
                    partner.displayNameOrFallback(),
                    partner.getAvatarUrl(),
                    partner.getFeaturedBadge(),
                    last.getContent() == null ? "" : excerpt(last.getContent()),
                    last.getImageUrl() != null,
                    fromMe,
                    last.getCreatedAt(),
                    unread));
        }
        out.sort(Comparator.comparing(DirectMessageDto.Conversation::lastAt).reversed());
        return out;
    }

    /** Tong so tin chua doc - cho chấm do tren nav. */
    public long unreadTotal(String email) {
        return repo.countByRecipientIdAndReadAtIsNull(getUser(email).getId());
    }

    private void requireFriend(String email, long otherId) {
        if (friendshipService.relationWith(email, otherId) != FriendshipService.Relation.FRIENDS) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_friends");
        }
    }

    private static String excerpt(String text) {
        String flat = text.strip().replaceAll("\\s+", " ");
        return flat.length() <= PREVIEW_LEN ? flat : flat.substring(0, PREVIEW_LEN) + "…";
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
    }
}
