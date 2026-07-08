package com.hoangthong.footballtracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Tao san RestClient da gan s[san base-url va API key cho football-data.org.
 * Nho vay o cac noi khac khong can lap lai header nay.
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient footballDataRestClient(
            @Value("${football-data.base-url}") String baseUrl,
            @Value("${football-data.api-key}") String apiKey) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-Auth-Token", apiKey)
                .build();
    }
}
