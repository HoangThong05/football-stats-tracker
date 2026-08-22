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
    private static final java.time.Duration EDIT_WINDOW = java.time.Duration.ofHours(1);
    private static final java.time.Duration DELETE_WINDOW = java.time.Duration.ofHours(24);

    private final ForumPostRepository postRepo;
    private final ForumCommentRepository commentRepo;
    private final PostLikeRepository likeRepo;
    private final PostReportRepository reportRepo;
    private final UserRepository userRepo;

    public ForumService(ForumPostRepository postRepo, ForumCommentRepository commentRepo,
                        PostLikeRepository likeRepo, PostReportRepository reportRepo,
                        UserRepository userRepo) {
        this.postRepo = postRepo;
        this.commentRepo = commentRepo;
        this.likeRepo = likeRepo;
        this.reportRepo = reportRepo;
        this.userRepo = userRepo;
    }

    public List<ForumDto.Post> feed(String viewerEmail, int page) {
        User viewer = viewerEmail == null ? null : userRepo.findByEmail(viewerEmail).orElse(null);
        List<ForumPost> posts = postRepo.findVisible(PageRequest.of(Math.max(0, page), PAGE_SIZE));
        return assemble(posts, viewer);
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
        postRepo.save(new ForumPost(author, content, cleanImageUrl(imageUrl)));
    }

    /** Chi nhan duong dan Cloudinary - luat chung voi anh dai dien, xem {@link ImageUrl}. */
    static String cleanImageUrl(String url) {
        return ImageUrl.clean(url);
    }

    @Transactional
    public void comment(String email, long postId, String rawContent, Long parentId) {
        User author = getUser(email);
        ForumPost post = visiblePost(postId);
        String content = rawContent == null ? "" : rawContent.trim();
        if (content.isEmpty()) {
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
        commentRepo.save(new ForumComment(post, author, content, parent));
    }

    /** Bam lan nua thi bo thich - mot nut lam ca hai chieu. */
    @Transactional
    public void toggleLike(String email, long postId) {
        User user = getUser(email);
        ForumPost post = visiblePost(postId);
        likeRepo.findByPostIdAndUserId(postId, user.getId())
                .ifPresentOrElse(likeRepo::delete, () -> likeRepo.save(new PostLike(post, user)));
    }

    @Transactional
    public void report(String email, long postId, String reason) {
        User reporter = getUser(email);
        ForumPost post = visiblePost(postId);
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
    public void deleteComment(String email, long commentId) {
        User user = getUser(email);
        ForumComment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "comment_not_found"));

        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin) {
            if (!comment.getAuthor().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_your_comment");
            }
            requireWithin(comment.getCreatedAt(), DELETE_WINDOW, "delete_window_over");
        }

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
    public void deletePost(String email, long postId) {
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

        commentRepo.deleteByPostId(postId);
        likeRepo.deleteByPostId(postId);
        reportRepo.deleteByPostId(postId);
        postRepo.delete(post);
    }

    /**
     * So hoat dong moi DANG DE NGUOI NAY BIET, ke tu lan cuoi ho mo dien dan:
     * bai viet moi, binh luan vao bai cua ho, tra loi binh luan cua ho, va luot thich
     * bai cua ho.
     *
     * KHONG tinh binh luan giua nhung nguoi khac voi nhau tren bai cua nguoi khac - do
     * la chuyen khong dinh gi den ho, ma truoc day van lam noi so do tren tab Cong dong.
     * Cung bo qua hoat dong cua CHINH ho: bao cho minh ve binh luan minh vua go la vo nghia.
     */
    public long unreadCount(String viewerEmail, java.time.Instant since) {
        Long viewerId = viewerEmail == null
                ? null
                : userRepo.findByEmail(viewerEmail).map(User::getId).orElse(null);
        // Bai moi thi ai cung duoc bao, ke ca khach chua dang nhap
        long total = postRepo.countNewSince(since, viewerId);
        // Con binh luan va luot thich chi tinh khi chung dinh den bai/binh luan cua nguoi xem
        if (viewerId != null) {
            total += commentRepo.countNewForViewer(since, viewerId);
            total += likeRepo.countNewForViewer(since, viewerId);
        }
        return total;
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

    /** Gop bai + so thich + binh luan lai, moi thu MOT truy van chung cho ca trang. */
    private List<ForumDto.Post> assemble(List<ForumPost> posts, User viewer) {
        if (posts.isEmpty()) {
            return List.of();
        }
        List<Long> ids = posts.stream().map(ForumPost::getId).toList();

        Map<Long, Long> likeCounts = new HashMap<>();
        for (Object[] row : likeRepo.countByPostIds(ids)) {
            likeCounts.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }

        Set<Long> likedByMe = viewer == null
                ? Set.of()
                : new HashSet<>(likeRepo.findLikedPostIds(viewer.getId(), ids));

        boolean viewerIsAdmin = viewer != null && viewer.getRole() == Role.ADMIN;
        // Mot moc thoi gian dung cho ca trang: hai binh luan cach nhau vai mili giay
        // khong nen mot cai con sua duoc con cai kia thi khong
        java.time.Instant now = java.time.Instant.now();

        Map<Long, List<ForumDto.Comment>> commentsByPost = new HashMap<>();
        for (ForumComment c : commentRepo.findByPostIds(ids)) {
            commentsByPost.computeIfAbsent(c.getPost().getId(), k -> new ArrayList<>())
                    .add(new ForumDto.Comment(c.getId(),
                            c.getParent() == null ? null : c.getParent().getId(),
                            c.getAuthor().getId(),
                            c.getAuthor().displayNameOrFallback(), c.getAuthor().getAvatarUrl(),
                            c.getContent(), c.getCreatedAt(), c.getEditedAt(),
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
            if (keptRoots.size() > COMMENTS_PREVIEW) {
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
                    p.getContent(),
                    p.getImageUrl(),
                    p.getCreatedAt(),
                    p.getEditedAt(),
                    likeCounts.getOrDefault(p.getId(), 0L),
                    likedByMe.contains(p.getId()),
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

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
    }
}
