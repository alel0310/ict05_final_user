package com.boot.ict05_final_user.domain.menu.dto;

import com.boot.ict05_final_user.domain.menu.entity.MenuShow;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuWriteFormDTO {

    /** 카테고리 ID */
    @NotNull(message = "카테고리를 선택해주세요")
    private Long menuCategoryId;

    /** 카테고리(필수) *//*
    @NotNull(message = "카테고리를 선택해주세요")
    private String menuCategoryName;*/

    /** 판매 상태(필수) */
    @NotNull(message = "판매상태를 선택해주세요")
    private MenuShow menuShow;

    /** 메뉴명(필수) */
    @NotBlank
    @Size(max = 100)
    private String menuName;

    /** 영문명(필수) */
    @NotBlank
    @Size(max = 150)
    private String menuNameEnglish;

    /** 메뉴코드 */
    @NotNull
    private String menuCode;

    /** 재료 */
    private String ingredients;

    /** 가격(필수) */
    @NotNull @DecimalMin(value = "0.0", inclusive = true, message = "가격은 0 이상이어야 합니다")
    private BigDecimal menuPrice;

    /** 설명(필수) */
    @NotNull(message = "설명을 입력해 주세요.")
    private String menuInformation;

    /** 칼로리(kcal)(필수) */
    @NotNull(message = "칼로리를 입력해 주세요.")
    @Min(value = 0, message = "칼로리는 0 이상으로 입력해 주세요.")
    private Integer menuKcal;

    /** 재료구성 – 주재료(필수) */
    @Valid
    @Builder.Default
    private List<RecipeItemDTO> mainMaterials = new ArrayList<>();

    /** 재료구성 – 소스(필수) */
    @Valid
    @Builder.Default
    private List<RecipeItemDTO> sauceMaterials= new ArrayList<>();
}
