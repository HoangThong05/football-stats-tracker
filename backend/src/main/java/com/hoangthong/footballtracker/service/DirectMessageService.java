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
    private final com.hoangthong.footballtracker.repository.DmReactionRepository reactionRepo;
    private final UserRepository userRepo;
    private final FriendshipService friendshipService;
    private final WebPushService webPush;

    public DirectMessageService(DirectMessageRepository repo,
                                com.hoangthong.footballtracker.repository.DmReactionRepository reactionRepo,
                                UserRepository userRepo,
                                FriendshipService friendshipService, WebPushService webPush) {
        this.repo = repo;
        this.reactionRepo = reactionRepo;
        this.userRepo = userRepo;
        this.friendshipService = friendshipService;
        this.webPush = webPush;
    }

    /** Gui tin toi mot nguoi BAN. content/image: it nhat mot cai. replyToId: tin dang tra loi. */
    @Transactional
    public void send(String email, long toId, String rawContent, String rawImageUrl, Long replyToId) {
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
        DirectMessage msg = new DirectMessage(me, to, content, image);
        // Reply: chi nhan neu tin duoc tra loi thuoc DUNG hoi thoai giua hai nguoi
        if (replyToId != null) {
            repo.findById(replyToId).ifPresent(rt -> {
                boolean inThread = (rt.getSender().getId().equals(me.getId()) && rt.getRecipient().getId() == toId)
                        || (rt.getSender().getId() == toId && rt.getRecipient().getId().equals(me.getId()));
                if (inThread) {
                    msg.setReplyTo(rt);
                }
            });
        }
        repo.save(msg);

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

        List<DirectMessage> msgs = repo.findConversation(me.getId(), otherId);
        // Cam xuc cua tat ca tin trong hoi thoai, gom theo tin
        List<Long> ids = msgs.stream().map(DirectMessage::getId).toList();
        java.util.Map<Long, java.util.List<String>> reactionsByMsg = new java.util.HashMap<>();
        java.util.Map<Long, String> myReactionByMsg = new java.util.HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] row : reactionRepo.findForMessages(ids)) {
                long msgId = ((Number) row[0]).longValue();
                String type = ((com.hoangthong.footballtracker.entity.ReactionType) row[1]).name();
                long userId = ((Number) row[2]).longValue();
                reactionsByMsg.computeIfAbsent(msgId, k -> new java.util.ArrayList<>());
                if (!reactionsByMsg.get(msgId).contains(type)) {
                    reactionsByMsg.get(msgId).add(type);
                }
                if (userId == me.getId()) {
                    myReactionByMsg.put(msgId, type);
                }
            }
        }

        long meId = me.getId();
        return msgs.stream()
                // Bo tin da "thu hoi voi ban" cua chinh minh
                .filter(m -> {
                    boolean mine = m.getSender().getId().equals(meId);
                    return mine ? !m.isHiddenForSender() : !m.isHiddenForRecipient();
                })
                .map(m -> {
                    boolean mine = m.getSender().getId().equals(meId);
                    // Da thu hoi voi moi nguoi -> chi hien mot dong bao, khong con noi dung/cam xuc
                    if (m.isRecalled()) {
                        return new DirectMessageDto.Message(m.getId(), mine, null, null,
                                m.getCreatedAt(), m.getReadAt(), java.util.List.of(), null,
                                null, null, false, true, false);
                    }
                    DirectMessage rt = m.getReplyTo();
                    return new DirectMessageDto.Message(
                            m.getId(),
                            mine,
                            m.getContent(),
                            m.getImageUrl(),
                            m.getCreatedAt(),
                            m.getReadAt(),
                            reactionsByMsg.getOrDefault(m.getId(), java.util.List.of()),
                            myReactionByMsg.get(m.getId()),
                            rt == null ? null : rt.getId(),
                            rt == null ? null : (rt.getContent() == null || rt.getContent().isBlank()
                                    ? "📷 Ảnh" : excerpt(rt.getContent())),
                            rt != null && rt.getSender().getId().equals(meId),
                            false,
                            m.isPinned());
                })
                .toList();
    }

    /** Thu hoi tin. forEveryone=true: chi NGUOI GUI, ca hai ben mat. false: chi an o phia minh. */
    @Transactional
    public void recall(String email, long messageId, boolean forEveryone) {
        User me = getUser(email);
        DirectMessage msg = participantMessage(messageId, me.getId());
        boolean mine = msg.getSender().getId().equals(me.getId());
        if (forEveryone) {
            if (!mine) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_your_message");
            }
            msg.recall();
        } else if (mine) {
            msg.hideForSender();
        } else {
            msg.hideForRecipient();
        }
        repo.save(msg);
    }

    /** Ghim / bo ghim tin. Ca hai nguoi trong hoi thoai deu lam duoc. */
    @Transactional
    public void pin(String email, long messageId, boolean pinned) {
        User me = getUser(email);
        DirectMessage msg = participantMessage(messageId, me.getId());
        msg.setPinned(pinned);
        repo.save(msg);
    }

    private DirectMessage participantMessage(long messageId, long meId) {
        DirectMessage msg = repo.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "message_not_found"));
        boolean participant = msg.getSender().getId() == meId || msg.getRecipient().getId() == meId;
        if (!participant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_in_conversation");
        }
        return msg;
    }

    /** Tha / doi / go cam xuc mot tin. Bam lai dung loai dang co = go. Chi nguoi trong hoi thoai. */
    @Transactional
    public void react(String email, long messageId, com.hoangthong.footballtracker.entity.ReactionType type) {
        User me = getUser(email);
        DirectMessage msg = repo.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "message_not_found"));
        boolean participant = msg.getSender().getId().equals(me.getId())
                || msg.getRecipient().getId().equals(me.getId());
        if (!participant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_in_conversation");
        }
        reactionRepo.findByMessageIdAndUserId(messageId, me.getId()).ifPresentOrElse(
                existing -> {
                    if (existing.getType() == type) {
                        reactionRepo.delete(existing);
                    } else {
                        existing.setType(type);
                        reactionRepo.save(existing);
                    }
                },
                () -> reactionRepo.save(new com.hoangthong.footballtracker.entity.DmReaction(msg, me, type)));
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
