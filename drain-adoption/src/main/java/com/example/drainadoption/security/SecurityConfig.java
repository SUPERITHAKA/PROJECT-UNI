package com.example.drainadoption.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/drains", "/api/drains/**").permitAll()
                
                // Actuator endpoints (health check for AWS)
                .requestMatchers("/actuator/**").permitAll()
                
                // First admin creation endpoint (public, but only works when no admin exists)
                .requestMatchers(HttpMethod.POST, "/api/admin/create-first-admin").permitAll()
                
                // Admin management endpoints (require ADMIN role)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // Notification endpoints (admin only)
                .requestMatchers("/api/notifications/**").hasRole("ADMIN")
                
                // Admin-only drain endpoints
                .requestMatchers(HttpMethod.POST, "/api/drains").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/drains/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/drains/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/drains/*/reset-adoption").hasRole("ADMIN")
                
                // Adopter endpoints (both ADMIN and ADOPTER can adopt)
                .requestMatchers(HttpMethod.POST, "/api/drains/*/adopt").hasAnyRole("ADMIN", "ADOPTER")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring().requestMatchers("/", "/index.html", "/favicon.ico");
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:5173",
            "https://main.d2zedbvhjs5gt3.amplifyapp.com",
            "https://dau3cgehnpx9r.cloudfront.net"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

