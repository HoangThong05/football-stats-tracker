package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.regex.Matcher;

/**
 * Doc cac luot nhac (@) trong noi dung va day thong bao cho nguoi duoc nhac.
 *
 * Chi bao cho nguoi la BAN BE cua tac gia (o tim goi y cung chi hien ban be), va gioi han
 * so nguoi/tin de khong ai bien mot bai thanh cong cu spam thong bao.
 */
@Service
public class MentionService {

    private static final int MAX_NOTIFY = 10;
    private static final int PREVIEW_LEN = 80;

    private final UserRepository userRepo;
    private final FriendshipService friendshipService;
    private final WebPushService webPush;

    public MentionService(UserRepository userRepo, FriendshipService friendshipService, WebPushService webPush) {
        this.userRepo = userRepo;
        this.friendshipService = friendshipService;
        this.webPush = webPush;
    }

    /**
     * @param author      nguoi viet (khong tu bao cho chinh minh)
     * @param authorEmail email tac gia - de kiem quan he ban be
     * @param content     noi dung THO (con token @[Ten](uid:ID))
     * @param where       ngu canh de ghi vao thong bao, vd "bai viet" / "binh luan" (co the null)
     * @param url         duong dan mo khi bam thong bao
     */
    public void notifyFriends(User author, String authorEmail, String content, String where, String url) {
        if (content == null || content.isBlank()) {
            return;
        }
        Matcher m = Mentions.TOKEN.matcher(content);
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        while (m.find() && ids.size() < MAX_NOTIFY) {
            try {
                long id = Long.parseLong(m.group(2));
                if (id != author.getId()) {
                    ids.add(id);
                }
            } catch (NumberFormatException ignore) {
                // token hong -> bo qua
            }
        }
        if (ids.isEmpty()) {
            return;
        }
        String actor = author.displayNameOrFallback();
        String title = actor + " đã nhắc bạn" + (where == null || where.isBlank() ? "" : " trong " + where);
        String body = excerpt(Mentions.toDisplay(content));
        String link = url == null || url.isBlank() ? "/" : url;
        for (Long id : ids) {
            // Chi bao neu nguoi duoc nhac dung la BAN cua tac gia (o goi y cung chi cho chon ban)
            if (friendshipService.relationWith(authorEmail, id) != FriendshipService.Relation.FRIENDS) {
                continue;
            }
            userRepo.findById(id).ifPresent(target -> webPush.sendToUser(target, title, body, link));
        }
    }

    private static String excerpt(String text) {
        String flat = text.strip().replaceAll("\\s+", " ");
        return flat.length() <= PREVIEW_LEN ? flat : flat.substring(0, PREVIEW_LEN) + "…";
    }
}
