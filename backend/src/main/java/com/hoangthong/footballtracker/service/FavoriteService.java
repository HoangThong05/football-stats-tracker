package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.FavoriteTeamDto;
import com.hoangthong.footballtracker.dto.FollowRequest;
import com.hoangthong.footballtracker.entity.FavoriteTeam;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.FavoriteTeamRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteTeamRepository favoriteTeamRepository;
    private final UserRepository userRepository;

    public FavoriteService(FavoriteTeamRepository favoriteTeamRepository, UserRepository userRepository) {
        this.favoriteTeamRepository = favoriteTeamRepository;
        this.userRepository = userRepository;
    }

    public List<FavoriteTeamDto> listFavorites(String email) {
        User user = findUser(email);
        return favoriteTeamRepository.findByUserId(user.getId()).stream()
                .map(f -> new FavoriteTeamDto(f.getTeamId(), f.getTeamName(), f.getTeamCrest()))
                .toList();
    }

    public FavoriteTeamDto follow(String email, FollowRequest request) {
        User user = findUser(email);

        if (favoriteTeamRepository.existsByUserIdAndTeamId(user.getId(), request.teamId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Da theo doi doi bong nay roi");
        }

        FavoriteTeam saved = favoriteTeamRepository.save(
                new FavoriteTeam(user, request.teamId(), request.teamName(), request.teamCrest()));

        return new FavoriteTeamDto(saved.getTeamId(), saved.getTeamName(), saved.getTeamCrest());
    }

    public void unfollow(String email, long teamId) {
        User user = findUser(email);

        FavoriteTeam favorite = favoriteTeamRepository.findByUserIdAndTeamId(user.getId(), teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chua theo doi doi bong nay"));

        favoriteTeamRepository.delete(favorite);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nguoi dung khong ton tai"));
    }
}
