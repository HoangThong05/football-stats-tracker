package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.DirectMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

    /** Toan bo tin giua hai nguoi, cu -> moi. FETCH nguoi gui + tin duoc tra loi de tranh N+1. */
    @Query("""
            SELECT m FROM DirectMessage m
            JOIN FETCH m.sender
            LEFT JOIN FETCH m.replyTo rt
            LEFT JOIN FETCH rt.sender
            WHERE (m.sender.id = :a AND m.recipient.id = :b)
               OR (m.sender.id = :b AND m.recipient.id = :a)
            ORDER BY m.createdAt ASC
            """)
    List<DirectMessage> findConversation(@Param("a") long a, @Param("b") long b);

    /** Id cac nguoi minh da nhan/gui tin - de dung danh sach hoi thoai. */
    @Query("""
            SELECT DISTINCT CASE WHEN m.sender.id = :me THEN m.recipient.id ELSE m.sender.id END
            FROM DirectMessage m
            WHERE m.sender.id = :me OR m.recipient.id = :me
            """)
    List<Long> findPartnerIds(@Param("me") long me);

    /** Tin moi nhat giua hai nguoi (Pageable top 1) - cho dong tom tat hoi thoai. */
    @Query("""
            SELECT m FROM DirectMessage m
            WHERE (m.sender.id = :a AND m.recipient.id = :b)
               OR (m.sender.id = :b AND m.recipient.id = :a)
            ORDER BY m.createdAt DESC
            """)
    List<DirectMessage> findLatestBetween(@Param("a") long a, @Param("b") long b, Pageable pageable);

    /** So tin CHUA DOC gui toi minh (tong) - cho chấm do tren nav. */
    long countByRecipientIdAndReadAtIsNull(long recipientId);

    /** So tin chua doc tu MOT nguoi cu the. */
    long countByRecipientIdAndSenderIdAndReadAtIsNull(long recipientId, long senderId);

    /** So tin chua doc tu MOT nguoi, chi tinh tin moi hon moc :since. */
    @Query("""
            SELECT COUNT(m) FROM DirectMessage m
            WHERE m.recipient.id = :me AND m.sender.id = :other AND m.readAt IS NULL
              AND m.createdAt > :since
            """)
    long countUnreadSince(@Param("me") long me, @Param("other") long other, @Param("since") Instant since);

    /** Danh dau da doc moi tin tu :other gui cho :me. */
    @Modifying
    @Transactional
    @Query("UPDATE DirectMessage m SET m.readAt = :now "
            + "WHERE m.recipient.id = :me AND m.sender.id = :other AND m.readAt IS NULL")
    void markConversationRead(@Param("me") long me, @Param("other") long other, @Param("now") Instant now);
}
