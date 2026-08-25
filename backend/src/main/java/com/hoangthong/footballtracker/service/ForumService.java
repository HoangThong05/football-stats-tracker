package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.ForumDto;
import com.hoangthong.footballtracker.entity.ForumComment;
import com.hoangthong.footballtracker.entity.ForumPost;
import com.hoangthong.footballtracker.entity.PostLike;
import com.hoangthong.footballtracker.entity.PostReport;
import com.hoangthong.footballtracker.entity.Role;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.ForumCommentRepository;
import com.hoangthong.footballtracker.repository.ForumPostRepository;
import com.hoangthong.footballtracker.repository.PostLikeRepository;
import com.hoangthong.footballtracker.repository.PostReportRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Dien dan cong khai: bai viet, binh luan, thich, bao cao.
 *
 * Doc thi ai cung duoc (ke ca khach chua dang nhap); moi thao tac ghi deu phai dang nhap.
 */
@Service
public class ForumService {

    /** So bai moi lan tai. Cuon xuong thi frontend xin trang tiep theo. */
    private static final int PAGE_SIZE = 20;

    /**
     * So binh luan hien san duoi moi bai.
     *
     * Bai nao co 200 binh luan ma tra ve het thi mot trang 20 bai se nang hang MB.
     */
    private static final int COMMENTS_PREVIEW = 3;

    /**
     * Cua so sua va cua so xoa, tinh tu luc dang.
     *
     * Sua ngan hon xoa co chu y: sua la doi noi dung DUOI CHAN nhung nguoi da doc va da
     * tra loi, nen chi cho trong luc cuoc noi chuyen con nong. Xoa thi chi lam mat bai
     * cua chinh minh, khong be cong loi ai, nen rong rai hon.
     *
     * Admin khong bi hai cua so nay chan - neu khong thi bai rac dang tu hom qua se
     * vinh vien khong ai don duoc.
     */
    /** So dong toi da trong chuong. Cuon dai hon nua thi khong ai doc het. */
    private static final int NOTIFICATION_LIMIT = 15;

    /** Do dai trich dan trong chuong - du de nhan ra bai nao, khong tran ca bang. */
    private static final int EXCERPT_LENGTH = 80;

    private static final java.time.Duration EDIT_WINDOW = java.time.Duration.ofHours(1);
    private static final java.time.Duration DELETE_WINDOW = java.time.Duration.ofHours(24);

    private final ForumPostRepository postRepo;
    private final ForumCommentRepository commentRepo;
    private final PostLikeRepository likeRepo;
    private final PostReportRepository reportRepo;
    private final UserRepository userRepo;
    private final com.hoangthong.footballtracker.repository.ModerationNoticeRepository moderationRepo;
    private final com.hoangthong.footballtracker.repository.CommentReactionRepository commentReactionRepo;
    private final WebPushService webPush;
    private final MentionService mentionService;

    public ForumService(ForumPostRepository postRepo, ForumCommentRepository commentRepo,
                        PostLikeRepository likeRepo, PostReportRepository reportRepo,
                        UserRepository userRepo,
                        com.hoangthong.footballtracker.repository.ModerationNoticeRepository moderationRepo,
                        com.hoangthong.footballtracker.repository.CommentReactionRepository commentReactionRepo,
                        WebPushService webPush, MentionService mentionService) {
        this.postRepo = postRepo;
        this.commentRepo = commentRepo;
        this.likeRepo = likeRepo;
        this.reportRepo = reportRepo;
        this.userRepo = userRepo;
        this.moderationRepo = moderationRepo;
        this.commentReactionRepo = commentReactionRepo;
        this.webPush = webPush;
        this.mentionService = mentionService;
    }

    /** Duong dan mo dung bai trong app khi bam vao thong bao day. */
    private static String postUrl(long postId) {
        return "/?post=" + postId;
    }

    public List<ForumDto.Post> feed(String viewerEmail, int page) {
        User viewer = viewerEmail == null ? null : userRepo.findByEmail(viewerEmail).orElse(null);
        List<ForumPost> posts = postRepo.findVisible(PageRequest.of(Math.max(0, page), PAGE_SIZE));
        return assemble(posts, viewer, false);
    }

    /**
     * Mot bai duy nhat, kem TAT CA binh luan cua no.
     *
     * Dung khi nguoi dung bam mot dong trong chuong: bai duoc nhac toi co the nam ngoai
     * 20 bai dau cua bang tin, ma binh luan lam ho duoc bao co the la binh luan thu 50 -
     * ban rut gon 3 binh luan cua bang tin se khong chua no.
     */
    @Transactional(readOnly = true)
    public ForumDto.Post onePost(String viewerEmail, long postId) {
        User viewer = viewerEmail == null ? null : userRepo.findByEmail(viewerEmail).orElse(null);
        return assemble(List.of(visiblePost(postId)), viewer, true).get(0);
    }

    @Transactional
    public void createPost(String email, String rawContent, String imageUrl) {
        User author = getUser(email);
        String content = rawContent == null ? "" : rawContent.trim();

        // Bai chi co anh van hop le, nhung khong duoc trong ca hai
        if (content.isEmpty() && (imageUrl == null || imageUrl.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "post_empty");
        }
        if (content.length() > ForumPost.MAX_CONTENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "post_too_long");
        }
        ForumPost saved = postRepo.save(new ForumPost(author, content, cleanImageUrl(imageUrl)));
        if (saved != null && saved.getId() != null) {
            mentionService.notifyFriends(author, email, content, "bài viết", postUrl(saved.getId()));
        }
    }

    /** Chi nhan duong dan Cloudinary - luat chung voi anh dai dien, xem {@link ImageUrl}. */
    static String cleanImageUrl(String url) {
        return ImageUrl.clean(url);
    }

    @Transactional
    public void comment(String email, long postId, String rawContent, String rawImageUrl, Long parentId) {
        User author = getUser(email);
        ForumPost post = visiblePost(postId);
        String content = rawContent == null ? "" : rawContent.trim();
        // Binh luan chi co GIF/anh van hop le - nhung khong duoc trong ca hai
        String image = cleanImageUrl(rawImageUrl);
        if (content.isEmpty() && image == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment_empty");
        }
        if (content.length() > ForumComment.MAX_CONTENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment_too_long");
        }
        /*
         * Tra loi cua tra loi van gan vao binh luan GOC.
         *
         * Long nhieu cap thi tren dien thoai cac muc thut dan vao den muc chi con vai
         * chu moi dong. Mot cap la du de biet ai dang noi voi ai.
         */
        ForumComment parent = null;
        if (parentId != null) {
            parent = commentRepo.findById(parentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "comment_not_found"));
            if (!parent.getPost().getId().equals(postId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment_not_found");
            }
            if (parent.getParent() != null) {
                parent = parent.getParent();
            }
        }
        ForumComment saved = new ForumComment(post, author, content, parent);
        saved.setImageUrl(image);
        commentRepo.save(saved);

        // Day thong bao: tra loi -> bao chu binh luan goc; binh luan bai -> bao chu bai.
        // Khong bao cho chinh minh.
        String actor = author.displayNameOrFallback();
        if (parent != null) {
            User target = parent.getAuthor();
            if (!target.getId().equals(author.getId())) {
                webPush.sendToUser(target, actor + " đã trả lời bình luận của bạn",
                        excerpt(content), postUrl(postId));
            }
        } else {
            User target = post.getAuthor();
            if (!target.getId().equals(author.getId())) {
                webPush.sendToUser(target, actor + " đã bình luận bài viết của bạn",
                        excerpt(content), postUrl(postId));
            }
        }
        mentionService.notifyFriends(author, email, content, "bình luận", postUrl(postId));
    }

    /** Tha / doi / go cam xuc bai viet. Bam lai dung loai dang co = go. */
    @Transactional
    public void reactToPost(String email, long postId, com.hoangthong.footballtracker.entity.ReactionType type) {
        User user = getUser(email);
        ForumPost post = visiblePost(postId);
        boolean[] reacted = {false}; // true = them moi hoac doi loai (khong phai go)
        likeRepo.findByPostIdAndUserId(postId, user.getId()).ifPresentOrElse(
                existing -> {
                    if (existing.getType() == type) {
                        likeRepo.delete(existing);
                    } else {
                        existing.setType(type);
                        likeRepo.save(existing);
                        reacted[0] = true;
                    }
                },
                () -> {
                    likeRepo.save(new PostLike(post, user, type));
                    reacted[0] = true;
                });

        // Day toi chu bai khi CO tha (khong phai go), khong bao cho chinh minh
        User author = post.getAuthor();
        if (reacted[0] && !author.getId().equals(user.getId())) {
            webPush.sendToUser(author, user.displayNameOrFallback() + " đã bày tỏ cảm xúc về bài viết của bạn " + type.emoji(),
                    excerpt(post.getContent()), postUrl(postId));
        }
    }

    /** Tha / doi / go cam xuc BINH LUAN. */
    @Transactional
    public void reactToComment(String email, long commentId, com.hoangthong.footballtracker.entity.ReactionType type) {
        User user = getUser(email);
        ForumComment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "comment_not_found"));
        if (comment.getPost().isHidden()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "comment_not_found");
        }
        boolean[] reacted = {false};
        commentReactionRepo.findByCommentIdAndUserId(commentId, user.getId()).ifPresentOrElse(
                existing -> {
                    if (existing.getType() == type) {
                        commentReactionRepo.delete(existing);
                    } else {
                        existing.setType(type);
                        commentReactionRepo.save(existing);
                        reacted[0] = true;
                    }
                },
                () -> {
                    commentReactionRepo.save(new com.hoangthong.footballtracker.entity.CommentReaction(comment, user, type));
                    reacted[0] = true;
                });

        User author = comment.getAuthor();
        if (reacted[0] && !author.getId().equals(user.getId())) {
            webPush.sendToUser(author, user.displayNameOrFallback() + " đã bày tỏ cảm xúc về bình luận của bạn " + type.emoji(),
                    excerpt(comment.getContent()), postUrl(comment.getPost().getId()));
        }
    }

    /**
     * Ai da tha cam xuc vao mot bai - danh sach cho hop "ai da tha".
     *
     * Doc cong khai nhu bang tin: khach chua dang nhap van xem duoc.
     */
    @Transactional(readOnly = true)
    public List<ForumDto.Reactor> postReactors(long postId) {
        visiblePost(postId);
        return likeRepo.findReactorsByPostId(postId).stream()
                .map(l -> new ForumDto.Reactor(
                        l.getUser().getId(),
                        l.getUser().displayNameOrFallback(),
                        l.getUser().getAvatarUrl(),
                        l.getType().name()))
                .toList();
    }

    /** Ai da tha cam xuc vao mot binh luan - danh sach cho hop "ai da tha". */
    @Transactional(readOnly = true)
    public List<ForumDto.Reactor> commentReactors(long commentId) {
        ForumComment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "comment_not_found"));
        if (comment.getPost().isHidden()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "comment_not_found");
        }
        return commentReactionRepo.findReactorsByCommentId(commentId).stream()
                .map(r -> new ForumDto.Reactor(
                        r.getUser().getId(),
                        r.getUser().displayNameOrFallback(),
                        r.getUser().getAvatarUrl(),
                        r.getType().name()))
                .toList();
    }

    /** [id, ReactionType|null, count] -> id -> {tenLoai -> so}. Loai null (luot cu) = LIKE. */
    private static Map<Long, Map<String, Long>> reactionCountsFrom(List<Object[]> rows) {
        Map<Long, Map<String, Long>> out = new HashMap<>();
        for (Object[] row : rows) {
            long id = ((Number) row[0]).longValue();
            String type = row[1] == null ? com.hoangthong.footballtracker.entity.ReactionType.LIKE.name() : ((com.hoangthong.footballtracker.entity.ReactionType) row[1]).name();
            long count = ((Number) row[2]).longValue();
            out.computeIfAbsent(id, k -> new HashMap<>()).merge(type, count, Long::sum);
        }
        return out;
    }

    private static Map<Long, String> myReactionsFrom(List<Object[]> rows) {
        Map<Long, String> out = new HashMap<>();
        for (Object[] row : rows) {
            long id = ((Number) row[0]).longValue();
            out.put(id, row[1] == null ? com.hoangthong.footballtracker.entity.ReactionType.LIKE.name() : ((com.hoangthong.footballtracker.entity.ReactionType) row[1]).name());
        }
        return out;
    }

    private static long sumReactions(Map<String, Long> m) {
        long t = 0;
        for (long v : m.values()) {
            t += v;
        }
        return t;
    }

    @Transactional
    public void report(String email, long postId, String rawReason) {
        User reporter = getUser(email);
        ForumPost post = visiblePost(postId);
        // Cat cho vua cot DB (200). Khong lam thi ly do dai hon 200 ky tu se nem loi CSDL
        // -> 500, thay vi luu gon lai. Ly do chi de admin doc tham khao nen cat la du.
        String reason = rawReason == null ? null
                : (rawReason.length() > 200 ? rawReason.substring(0, 200) : rawReason);
        // Da bao roi thi im lang bo qua - bao loi chi lam nguoi dung tuong minh lam sai
        if (reportRepo.existsByPostIdAndReporterId(postId, reporter.getId())) {
            return;
        }
        reportRepo.save(new PostReport(post, reporter, reason));
    }

    /**
     * Sua phan chu cua bai. Chi tac gia, va chi trong {@link #EDIT_WINDOW} ke tu luc dang.
     *
     * Khong cho doi anh: doi anh la thay han noi dung bai, khong con la "sua loi chinh
     * ta" nua - nguoi da thich hoac da binh luan coi nhu bi doi bai duoi chan.
     */
    @Transactional
    public void editPost(String email, long postId, String rawContent) {
        User user = getUser(email);
        ForumPost post = visiblePost(postId);

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_your_post");
        }
        requireWithin(post.getCreatedAt(), EDIT_WINDOW, "edit_window_over");

        String content = rawContent == null ? "" : rawContent.trim();
        // Bai chi co anh van hop le, nhung khong duoc trong ca hai
        if (content.isEmpty() && post.getImageUrl() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "post_empty");
        }
        if (content.length() > ForumPost.MAX_CONTENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "post_too_long");
        }
        post.editContent(content);
        postRepo.save(post);
    }

    /** Sua binh luan. Chi tac gia, va chi trong {@link #EDIT_WINDOW} ke tu luc go. */
    @Transactional
    public void editComment(String email, long commentId, String rawContent) {
        User user = getUser(email);
        ForumComment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "comment_not_found"));

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_your_comment");
        }
        requireWithin(comment.getCreatedAt(), EDIT_WINDOW, "edit_window_over");

        String content = rawContent == null ? "" : rawContent.trim();
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment_empty");
        }
        if (content.length() > ForumComment.MAX_CONTENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment_too_long");
        }
        comment.editContent(content);
        commentRepo.save(comment);
    }

    /**
     * Xoa binh luan. Tac gia trong {@link #DELETE_WINDOW}, admin thi bat ky luc nao.
     *
     * Xoa binh luan goc keo theo moi tra loi cua no: de lai thi cac tra loi tro toi mot
     * dong khong con ton tai (rang buoc khoa ngoai khong cho), va nguoi doc thay nhung
     * cau tra loi lo lung khong biet dang noi ve cai gi.
     */
    @Transactional
    public void deleteComment(String email, long commentId, String reason) {
        User user = getUser(email);
        ForumComment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "comment_not_found"));

        boolean isAuthor = comment.getAuthor().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin) {
            if (!isAuthor) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_your_comment");
            }
            requireWithin(comment.getCreatedAt(), DELETE_WINDOW, "delete_window_over");
        }

        // Admin go cua NGUOI KHAC -> bao cho tac gia biet ly do (luu truoc khi xoa)
        if (isAdmin && !isAuthor) {
            notifyRemoval(comment.getAuthor(), "COMMENT", reason, comment.getContent());
        }

        commentReactionRepo.deleteByCommentOrParent(commentId);
        commentReactionRepo.flush();
        commentRepo.deleteByParentId(commentId);
        // Day cac tra loi xuong CSDL TRUOC khi xoa binh luan cha: parent_id la khoa ngoai
        // tro vao chinh bang nay, xoa cha khi con chua di la vi pham rang buoc
        commentRepo.flush();
        commentRepo.delete(comment);
    }

    /** Con trong han khong? Het han thi bao dung ma loi de frontend dich sang tieng nguoi dung. */
    private static void requireWithin(java.time.Instant createdAt, java.time.Duration window, String errorCode) {
        if (createdAt.plus(window).isBefore(java.time.Instant.now())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, errorCode);
        }
    }

    /**
     * Xoa bai. Tac gia xoa bai cua minh trong {@link #DELETE_WINDOW}, admin xoa bai bat ky.
     *
     * Xoa han ca binh luan/thich/bao cao thay vi de lai mo con: chung tro toi mot bai
     * khong con ton tai, giu lai chi lam bang phinh len.
     */
    @Transactional
    public void deletePost(String email, long postId, String reason) {
        User user = getUser(email);
        ForumPost post = postRepo.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "post_not_found"));

        boolean isAuthor = post.getAuthor().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin) {
            if (!isAuthor) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_your_post");
            }
            requireWithin(post.getCreatedAt(), DELETE_WINDOW, "delete_window_over");
        }

        // Admin go cua NGUOI KHAC -> bao cho tac gia biet ly do (luu truoc khi xoa)
        if (isAdmin && !isAuthor) {
            notifyRemoval(post.getAuthor(), "POST", reason, post.getContent());
        }

        commentReactionRepo.deleteByPostId(postId);
        commentReactionRepo.flush();
        commentRepo.deleteByPostId(postId);
        likeRepo.deleteByPostId(postId);
        reportRepo.deleteByPostId(postId);
        postRepo.delete(post);
    }

    /**
     * So BAI VIET moi ke tu lan cuoi nguoi nay mo dien dan - con so tren tab Cong dong.
     *
     * Chi dem bai, khong dem binh luan hay luot thich: hai thu do la viec rieng cua
     * nguoi nhan nen da chuyen han sang chuong ({@link #notifications}). Chia doi vai
     * tro nhu vay de mot su viec chi lam noi so o DUNG MOT cho - so tren tab tra loi
     * "co gi moi de doc khong", so tren chuong tra loi "co ai dong den minh khong".
     *
     * Bo qua bai cua chinh ho: bao cho minh ve bai minh vua dang la vo nghia.
     */
    public long unreadCount(String viewerEmail, java.time.Instant since) {
        Long viewerId = viewerEmail == null
                ? null
                : userRepo.findByEmail(viewerEmail).map(User::getId).orElse(null);
        return postRepo.countNewSince(since, viewerId);
    }

    /**
     * Nhung viec nguoi khac vua lam voi bai/binh luan cua nguoi nay - noi dung cua chuong.
     *
     * Gop tu hai nguon roi xep theo thoi gian: lay {@link #NOTIFICATION_LIMIT} dong moi
     * nhat cua MOI nguon truoc, tron lai, roi moi cat. Khong lam vay - vi du chi lay 15
     * dong moi nhat cua binh luan - thi mot tran mua binh luan se day het luot thich ra
     * khoi danh sach du chung moi hon.
     */
    @Transactional(readOnly = true)
    public List<ForumDto.Notification> notifications(String email) {
        User viewer = getUser(email);
        var page = PageRequest.of(0, NOTIFICATION_LIMIT);
        List<ForumDto.Notification> all = new ArrayList<>();

        for (ForumComment c : commentRepo.findForViewer(viewer.getId(), page)) {
            /*
             * Tra loi binh luan cua minh, hay binh luan vao bai cua minh? Mot binh luan
             * co the vua nam duoi bai cua minh vua tra loi minh - khi do goi la "tra loi"
             * vi do la cau noi truc tiep voi minh, sat nghia hon.
             */
            boolean isReply = c.getParent() != null
                    && c.getParent().getAuthor().getId().equals(viewer.getId());
            all.add(new ForumDto.Notification(
                    isReply ? "REPLY" : "COMMENT",
                    c.getPost().getId(),
                    c.getAuthor().getId(),
                    c.getAuthor().displayNameOrFallback(),
                    c.getAuthor().getAvatarUrl(),
                    excerpt(c.getContent()),
                    null,
                    c.getCreatedAt()));
        }

        for (PostLike l : likeRepo.findForViewer(viewer.getId(), page)) {
            all.add(new ForumDto.Notification(
                    "REACT_POST",
                    l.getPost().getId(),
                    l.getUser().getId(),
                    l.getUser().displayNameOrFallback(),
                    l.getUser().getAvatarUrl(),
                    // Trich chinh BAI CUA MINH: nguoi doc can nho la bai nao duoc tha cam xuc
                    excerpt(l.getPost().getContent()),
                    l.getType().name(),
                    l.getCreatedAt()));
        }

        for (com.hoangthong.footballtracker.entity.CommentReaction r : commentReactionRepo.findForViewer(viewer.getId(), page)) {
            all.add(new ForumDto.Notification(
                    "REACT_COMMENT",
                    r.getComment().getPost().getId(),
                    r.getUser().getId(),
                    r.getUser().displayNameOrFallback(),
                    r.getUser().getAvatarUrl(),
                    excerpt(r.getComment().getContent()),
                    r.getType().name(),
                    r.getCreatedAt()));
        }

        all.sort(java.util.Comparator.comparing(ForumDto.Notification::createdAt).reversed());
        return all.size() > NOTIFICATION_LIMIT ? List.copyOf(all.subList(0, NOTIFICATION_LIMIT)) : all;
    }

    /** Gop xuong dong va cat ngan. Bai chi co anh thi noi dung rong -> tra ve chuoi rong. */
    private static String excerpt(String text) {
        if (text == null) {
            return "";
        }
        // Phai la HAI gach cheo. Tu Java 15, "\s" trong chuoi Java la ky tu KHOANG
        // TRANG chu khong phai regex, nen mot gach cheo se thanh regex " +" - gop duoc
        // khoang trang nhung xuong dong trong bai van lot qua nguyen ven.
        // Doi token nhac @[Ten](uid:ID) thanh @Ten cho van ban xem truoc / thong bao
        String flat = Mentions.toDisplay(text).strip().replaceAll("\\s+", " ");
        return flat.length() <= EXCERPT_LENGTH ? flat : flat.substring(0, EXCERPT_LENGTH) + "…";
    }

    private ForumPost visiblePost(long postId) {
        ForumPost post = postRepo.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "post_not_found"));
        // Bai bi an coi nhu khong ton tai, khong noi ro la "da bi an"
        if (post.isHidden()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "post_not_found");
        }
        return post;
    }

    /**
     * Gop bai + so thich + binh luan lai, moi thu MOT truy van chung cho ca trang.
     *
     * @param allComments true = tra het binh luan (man xem mot bai), false = chi
     *                    {@link #COMMENTS_PREVIEW} binh luan goc gan nhat (bang tin)
     */
    private List<ForumDto.Post> assemble(List<ForumPost> posts, User viewer, boolean allComments) {
        if (posts.isEmpty()) {
            return List.of();
        }
        List<Long> ids = posts.stream().map(ForumPost::getId).toList();

        // Cam xuc cua tung bai (theo loai) + cam xuc cua nguoi xem
        Map<Long, Map<String, Long>> postReactions = reactionCountsFrom(likeRepo.countByTypePerPost(ids));
        Map<Long, String> postMyReaction = viewer == null
                ? Map.of()
                : myReactionsFrom(likeRepo.findMyReactions(viewer.getId(), ids));

        boolean viewerIsAdmin = viewer != null && viewer.getRole() == Role.ADMIN;
        // Mot moc thoi gian dung cho ca trang: hai binh luan cach nhau vai mili giay
        // khong nen mot cai con sua duoc con cai kia thi khong
        java.time.Instant now = java.time.Instant.now();

        // Tat ca binh luan cua cac bai, kem cam xuc tung binh luan
        List<ForumComment> comments = commentRepo.findByPostIds(ids);
        List<Long> commentIds = comments.stream().map(ForumComment::getId).toList();
        Map<Long, Map<String, Long>> commentReactions = commentIds.isEmpty()
                ? Map.of()
                : reactionCountsFrom(commentReactionRepo.countByTypePerComment(commentIds));
        Map<Long, String> commentMyReaction = (viewer == null || commentIds.isEmpty())
                ? Map.of()
                : myReactionsFrom(commentReactionRepo.findMyReactions(viewer.getId(), commentIds));

        Map<Long, List<ForumDto.Comment>> commentsByPost = new HashMap<>();
        for (ForumComment c : comments) {
            Map<String, Long> rc = commentReactions.getOrDefault(c.getId(), Map.of());
            commentsByPost.computeIfAbsent(c.getPost().getId(), k -> new ArrayList<>())
                    .add(new ForumDto.Comment(c.getId(),
                            c.getParent() == null ? null : c.getParent().getId(),
                            c.getAuthor().getId(),
                            c.getAuthor().displayNameOrFallback(), c.getAuthor().getAvatarUrl(),
                            c.getAuthor().getRole() == Role.ADMIN,
                            c.getAuthor().getFeaturedBadge(),
                            c.getContent(), c.getImageUrl(), c.getCreatedAt(), c.getEditedAt(),
                            rc, sumReactions(rc), commentMyReaction.get(c.getId()),
                            mine(c.getAuthor(), viewer) && within(c.getCreatedAt(), EDIT_WINDOW, now),
                            viewerIsAdmin
                                    || (mine(c.getAuthor(), viewer)
                                        && within(c.getCreatedAt(), DELETE_WINDOW, now))));
        }

        return posts.stream().map(p -> {
            List<ForumDto.Comment> all = commentsByPost.getOrDefault(p.getId(), List.of());
            /*
             * Gioi han theo binh luan GOC, roi keo theo tat ca tra loi cua chung.
             *
             * Cat thang theo so luong thi mot tra loi co the bi giu lai trong khi binh
             * luan goc cua no bi cat - nguoi doc thay cau tra loi lo lung khong biet
             * dang noi ve cai gi.
             */
            List<Long> keptRoots = all.stream()
                    .filter(c -> c.parentId() == null)
                    .map(ForumDto.Comment::id)
                    .toList();
            if (!allComments && keptRoots.size() > COMMENTS_PREVIEW) {
                keptRoots = keptRoots.subList(keptRoots.size() - COMMENTS_PREVIEW, keptRoots.size());
            }
            Set<Long> rootIds = new HashSet<>(keptRoots);
            List<ForumDto.Comment> preview = all.stream()
                    .filter(c -> rootIds.contains(c.parentId() == null ? c.id() : c.parentId()))
                    .toList();
            boolean canDelete = viewerIsAdmin
                    || (mine(p.getAuthor(), viewer) && within(p.getCreatedAt(), DELETE_WINDOW, now));
            boolean canEdit = mine(p.getAuthor(), viewer) && within(p.getCreatedAt(), EDIT_WINDOW, now);
            return new ForumDto.Post(
                    p.getId(),
                    p.getAuthor().getId(),
                    p.getAuthor().displayNameOrFallback(),
                    p.getAuthor().getAvatarUrl(),
                    p.getAuthor().getRole() == Role.ADMIN,
                    p.getAuthor().getFeaturedBadge(),
                    p.getContent(),
                    p.getImageUrl(),
                    p.getCreatedAt(),
                    p.getEditedAt(),
                    postReactions.getOrDefault(p.getId(), Map.of()),
                    sumReactions(postReactions.getOrDefault(p.getId(), Map.of())),
                    postMyReaction.get(p.getId()),
                    canEdit,
                    canDelete,
                    preview);
        }).toList();
    }

    /** Khach chua dang nhap (viewer null) thi khong phai chu cua bat cu thu gi. */
    private static boolean mine(User author, User viewer) {
        return viewer != null && author.getId().equals(viewer.getId());
    }

    private static boolean within(java.time.Instant createdAt, java.time.Duration window,
                                  java.time.Instant now) {
        return !createdAt.plus(window).isBefore(now);
    }

    /** Luu mot thong bao "da bi go" cho tac gia, cat gon ly do va trich doan cho vua cot. */
    private void notifyRemoval(User author, String targetType, String reason, String content) {
        int maxReason = com.hoangthong.footballtracker.entity.ModerationNotice.MAX_REASON;
        int maxExcerpt = com.hoangthong.footballtracker.entity.ModerationNotice.MAX_EXCERPT;
        String cleanReason = reason == null ? null
                : (reason.trim().length() > maxReason ? reason.trim().substring(0, maxReason) : reason.trim());
        String flat = content == null ? "" : content.strip().replaceAll("\\s+", " ");
        String excerpt = flat.length() > maxExcerpt ? flat.substring(0, maxExcerpt) + "…" : flat;
        moderationRepo.save(new com.hoangthong.footballtracker.entity.ModerationNotice(
                author, targetType, cleanReason, excerpt));
    }

    /** Thong bao go bai/cmt gui den nguoi nay (30 ngay gan nhat) - noi dung cho chuong. */
    @Transactional(readOnly = true)
    public List<ForumDto.ModerationNotice> moderationNotices(String email) {
        User user = getUser(email);
        var since = java.time.Instant.now().minus(java.time.Duration.ofDays(30));
        return moderationRepo.findForRecipient(user.getId(), since, PageRequest.of(0, NOTIFICATION_LIMIT)).stream()
                .map(n -> new ForumDto.ModerationNotice(
                        n.getTargetType(), n.getReason(), n.getExcerpt(), n.getCreatedAt()))
                .toList();
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
    }
}
