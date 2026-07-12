package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class SquadPlayer {

    private String name;
    private String position;
    private String nationality;
    private String dateOfBirth;
    private String photoUrl;

    protected SquadPlayer() {}

    public SquadPlayer(String name, String position, String nationality, String dateOfBirth, String photoUrl) {
        this.name = name;
        this.position = position;
        this.nationality = nationality;
        this.dateOfBirth = dateOfBirth;
        this.photoUrl = photoUrl;
    }

    public String getName() { return name; }
    public String getPosition() { return position; }
    public String getNationality() { return nationality; }
    public String getDateOfBirth() { return dateOfBirth; }
    public String getPhotoUrl() { return photoUrl; }
}