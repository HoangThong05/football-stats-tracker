package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class SquadPlayer {

    private String externalId; // id cau thu tren API-Football
    private String name;
    private String position;
    private Integer jerseyNumber;
    private String photoUrl;

    protected SquadPlayer() {}

    public SquadPlayer(String externalId, String name, String position, Integer jerseyNumber, String photoUrl) {
        this.externalId = externalId;
        this.name = name;
        this.position = position;
        this.jerseyNumber = jerseyNumber;
        this.photoUrl = photoUrl;
    }

    public String getExternalId() { return externalId; }
    public String getName() { return name; }
    public String getPosition() { return position; }
    public Integer getJerseyNumber() { return jerseyNumber; }
    public String getPhotoUrl() { return photoUrl; }
}