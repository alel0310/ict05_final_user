package com.boot.ict05_final_user.password;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PasswordCheckTest {
//
//    @Autowired
//    private PasswordEncoder encoder;
//
//    @Test
//    @DisplayName("BCrypt 비밀번호 후보 50개 검증")
//    void checkPasswordCandidates() {
//        // DB에 저장된 bcrypt 해시
//        String encoded = "$2a$10$K5h7fYpUTQf7mZ7C3sTn3eQeDmyb.0pwq3LW6H2O0E6m8c9r7w9xK";
//
//        // owner01@toastlap.test 비밀번호는 qwer
//
//        // 비밀번호 후보 100개
//        String[] candidates = {
//                "qwer","qwer1","qwer123","qwer1234","qwer!","qweR1234","qwer2025","qwer@toast","owner10","owner10!",
//                "owner10@1","owner10#01","owner010","owner0010","owner_10","owner-10","ownerTen","ownerTen01","store10","store10!",
//                "store_10","toastlap10","toast10","toastlap2025","toastlap!","toastlap123","toastlap01","toastlap001","toastlap#10","toastLap10!",
//                "password","password1","password123","Password1","Passw0rd","p@ssword","1234","0000","1111","12345",
//                "123456","12345678","9876","1010","admin","admin123","admin01","admin!01","user10","user010",
//                "user_10","welcome","welcome1","test","test10","test123","test1234","toast","toast1","toast01",
//                "toast001","tl10","tl2025","tl!0010","owner","owner1","owner01","owner123","owner!01","shop10",
//                "shop_10","shop01","shop123","iloveqwer","ilovetoast","ilovetoastlap","10qwer","qwer10","Qwer10!","QwEr1234",
//                "qwe123","10owner","OwNer10","Oowner10","10Toast","10ToastLap","toastLap#001","Toast001!","StoreOwner10","StoreOwner10!",
//                "storeOwner10","owner10pwd","owner10pw","pwowner10","pw10","Pass@10","10pass","welcome10","hello10","hello@10"
//        };
//
//        boolean found = false;
//
//        for (String raw : candidates) {
//            if (encoder.matches(raw, encoded)) {
//                System.out.println("✅ 비밀번호 일치: " + raw);
//                found = true;
//                break;
//            }
//        }
//
//        assertThat(found)
//                .as("등록된 bcrypt 해시와 일치하는 비밀번호가 있어야 합니다.")
//                .isTrue();
//    }
}
