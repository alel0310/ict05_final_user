package com.boot.ict05_final_user.config.security.principal;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public class AppUser implements UserDetails {
    private final String username;
    private final Long storeId;
    private final Collection<? extends GrantedAuthority> authorities;

    public AppUser(String username, Long storeId, Collection<? extends GrantedAuthority> authorities) {
        this.username = username;
        this.storeId = storeId;
        this.authorities = authorities;
    }

    public Long getStoreId() { return storeId; }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return null; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
