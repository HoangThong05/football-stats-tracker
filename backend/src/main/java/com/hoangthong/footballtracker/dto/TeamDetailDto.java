package com.hoangthong.footballtracker.dto;

import java.util.List;

/**
 * Du lieu chi tiet 1 doi bong, tra ve cho frontend.
 */
public record TeamDetailDto(
        long id,
        String name,
        String crest,
        Integer founded,
        String venue,
        String clubColors,
        String website,
        String coachName,
        List<PlayerDto> squad
) {

    public record PlayerDto(
            long id,
            String name,
            String position,
            String nationality
    ) {
    }
}
