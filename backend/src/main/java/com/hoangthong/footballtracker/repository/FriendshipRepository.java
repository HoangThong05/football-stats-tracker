package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /**
     * Tim quan he giua hai nguoi theo CA HAI CHIEU.
     *
     * Rang buoc duy nhat tren bang chi chan trung theo mot chieu, nen neu chi tra cuu
     * mot chieu thi A van gui duoc loi moi cho B trong khi B da gui cho A - thanh hai
     * dong cho cung mot cap.
     */
    @Query("""
            SELECT f FROM Friendship f
            WHERE (f.requester.id = :a AND f.addressee.id = :b)
               OR (f.requester.id = :b AND f.addressee.id = :a)
            """)
    Optional<Friendship> findBetween(@Param("a") Long a, @Param("b") Long b);

    @Query("""
            SELECT f FROM Friendship f
            JOIN FETCH f.requester JOIN FETCH f.addressee
            WHERE (f.requester.id = :userId OR f.addressee.id = :userId)
              AND f.status = com.hoangthong.footballtracker.entity.Friendship$Status.ACCEPTED
            """)
    List<Friendship> findAcceptedOf(@Param("userId") Long userId);

    /** Loi moi NGUOI KHAC gui den, dang cho tra loi. */
    @Query("""
            SELECT f FROM Friendship f
            JOIN FETCH f.requester
            WHERE f.addressee.id = :userId
              AND f.status = com.hoangthong.footballtracker.entity.Friendship$Status.PENDING
            ORDER BY f.createdAt DESC
            """)
    List<Friendship> findIncomingRequests(@Param("userId") Long userId);
}
