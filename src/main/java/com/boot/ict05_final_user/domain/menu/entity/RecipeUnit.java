package com.boot.ict05_final_user.domain.menu.entity;

public enum RecipeUnit {

    G("g"), ML("ml"), EA("개"), SHEET("장");
    private final String label;
    RecipeUnit(String label) { this.label = label; }
    public String getLabel() { return label; }
}
