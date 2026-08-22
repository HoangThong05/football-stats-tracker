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

    /**
     * Chi nhan duong dan Cloudinary.
     *
     * Khong loc thi ai cung dat duoc URL bat ky vao day - bien dien dan thanh cho gan
     * link di noi khac, va "anh" co the la bat cu thu gi tren mang.
     */
    static String cleanImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        if (!trimmed.startsWith("https://res.cloudinary.com/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "image_url_invalid");
        }
        return trimmed;
    }

    @Transactional
    public void comment(String email, long postId, String rawContent) {
        User author = getUser(email);
        ForumPost post = visiblePost(postId);
        String content = rawContent == null ? "" : rawContent.trim();
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment_empty");
        }
        if (content.length() > ForumComment.MAX_CONTENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment_too_long");
        }
        commentRepo.save(new ForumComment(post, author, content));
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
     * Xoa bai. Tac gia xoa bai cua minh, admin xoa bai bat ky.
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
        if (!isAuthor && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_your_post");
        }

        commentRepo.deleteByPostId(postId);
        likeRepo.deleteByPostId(postId);
        reportRepo.deleteByPostId(postId);
        postRepo.delete(post);
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

        Map<Long, List<ForumDto.Comment>> commentsByPost = new HashMap<>();
        for (ForumComment c : commentRepo.findByPostIds(ids)) {
            commentsByPost.computeIfAbsent(c.getPost().getId(), k -> new ArrayList<>())
                    .add(new ForumDto.Comment(c.getId(), c.getAuthor().getId(),
                            c.getAuthor().displayNameOrFallback(), c.getContent(), c.getCreatedAt()));
        }

        boolean viewerIsAdmin = viewer != null && viewer.getRole() == Role.ADMIN;

        return posts.stream().map(p -> {
            List<ForumDto.Comment> all = commentsByPost.getOrDefault(p.getId(), List.of());
            // Lay COMMENTS_PREVIEW binh luan MOI NHAT (cuoi danh sach da sap tang dan)
            List<ForumDto.Comment> preview = all.size() > COMMENTS_PREVIEW
                    ? all.subList(all.size() - COMMENTS_PREVIEW, all.size())
                    : all;
            boolean canDelete = viewerIsAdmin
                    || (viewer != null && p.getAuthor().getId().equals(viewer.getId()));
            return new ForumDto.Post(
                    p.getId(),
                    p.getAuthor().getId(),
                    p.getAuthor().displayNameOrFallback(),
                    p.getContent(),
                    p.getImageUrl(),
                    p.getCreatedAt(),
                    likeCounts.getOrDefault(p.getId(), 0L),
                    likedByMe.contains(p.getId()),
                    canDelete,
                    preview);
        }).toList();
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
    }
}
