package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.DmReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DmReactionRepository extends JpaRepository<DmReaction, Long> {

    Optional<DmReaction> findByMessageIdAndUserId(long messageId, long userId);

    /** Cam xuc cua nhieu tin: [messageId, ReactionType, userId] - de gan vao tung tin. */
    @Query("SELECT r.message.id, r.type, r.user.id FROM DmReaction r WHERE r.message.id IN :ids")
    List<Object[]> findForMessages(@Param("ids") Collection<Long> ids);
}
