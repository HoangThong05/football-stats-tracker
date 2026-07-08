package com.hoangthong.footballtracker.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cau hinh tieu de/thong tin cho Swagger UI (mac dinh o /swagger-ui/index.html).
 * Co them nut "Authorize": dan JWT token (lay tu /api/auth/login) vao 1 lan,
 * Swagger UI se tu gan header Authorization cho moi request sau do.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI footballTrackerOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Football Stats Tracker API")
                        .description("Bang xep hang, lich thi dau, ket qua, chi tiet doi bong va doi yeu thich")
                        .version("v1"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components()
                        .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
