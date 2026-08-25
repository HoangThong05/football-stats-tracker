package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.DmConversationPref;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DmConversationPrefRepository extends JpaRepository<DmConversationPref, Long> {

    Optional<DmConversationPref> findByOwnerIdAndPartnerId(long ownerId, long partnerId);

    List<DmConversationPref> findByOwnerId(long ownerId);
}
