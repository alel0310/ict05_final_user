// src/components/Common/MyPage.tsx
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { User, Mail, Phone, Edit3 } from "lucide-react";

export function MyPage() {
  const [user] = useState({
    id: 64,
    name: "민진",
    email: "ccc@ccc.com",
    phone: "010-2222-4444",
    image:
      "https://i.namu.wiki/i/GAYoBBRQmZZvvY1TjHnG5JZpLSEe2P6U6hOqTtG3UeHhQyo3F3VslOdzNrxNToO2sDNYdMtLkgKuvAsB8E4Igg.webp",
  });

  const handleEditInfo = () => {
    toast.success("정보 수정 페이지로 이동합니다.");
  };

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">마이페이지</h2>
          <p className="text-sm text-gray-500">회원 정보 확인 및 수정</p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
          onClick={handleEditInfo}
        >
          <Edit3 className="w-4 h-4" /> 정보 수정
        </Button>
      </div>

      {/* 프로필 카드 */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <User className="w-5 h-5 text-sky-600" />
              회원 프로필
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <img
                src={user.image}
                alt="프로필 이미지"
                className="w-32 h-32 rounded-full object-cover border border-gray-200 shadow-sm"
              />
              <p className="mt-3 text-gray-700 font-medium">{user.name}</p>
              <p className="text-sm text-gray-400">회원번호 {user.id}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-1">
                <Label className="text-gray-600 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-gray-400" /> 이메일
                </Label>
                <Input type="text" value={user.email} readOnly />
              </div>

              <div className="space-y-1">
                <Label className="text-gray-600 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" /> 전화번호
                </Label>
                <Input type="text" value={user.phone} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
