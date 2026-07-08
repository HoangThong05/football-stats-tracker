package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.FavoriteTeamDto;
import com.hoangthong.footballtracker.dto.FollowRequest;
import com.hoangthong.footballtracker.service.FavoriteService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Doi bong yeu thich cua nguoi dung dang dang nhap.
 * Can header "Authorization: Bearer <token>" (lay tu /api/auth/login hoac /register).
 */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<FavoriteTeamDto> list(@AuthenticationPrincipal String email) {
        return favoriteService.listFavorites(email);
    }

    @PostMapping
    public FavoriteTeamDto follow(@AuthenticationPrincipal String email, @RequestBody FollowRequest request) {
        return favoriteService.follow(email, request);
    }

    @DeleteMapping("/{teamId}")
    public void unfollow(@AuthenticationPrincipal String email, @PathVariable long teamId) {
        favoriteService.unfollow(email, teamId);
    }
}
