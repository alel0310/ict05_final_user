// src/components/Common/MyPage.tsx
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { User, Mail, Phone, Link2, Edit3 } from "lucide-react";

interface UserType {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string | null;
}

export function MyPage() {
  const [user, setUser] = useState<UserType>({
    id: 64,
    name: "민진",
    email: "ccc@ccc.com",
    phone: "010-2222-4444",
    image: null,
  });

  const [editing, setEditing] = useState(false);

  // 수정 폼 상태
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [image, setImage] = useState<string | null>(user.image);

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatch, setPasswordMatch] = useState<string | null>(null);

  const profileImage = image || "https://via.placeholder.com/150?text=기본+프로필";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleVerifyPassword = () => {
    // 여기서 실제 API 호출 대신 임시 검증
    if (currentPassword === "1234") {
      toast.success("비밀번호 확인 완료");
      setPasswordVerified(true);
    } else {
      toast.error("현재 비밀번호가 틀렸습니다");
      setPasswordVerified(false);
    }
  };

  const handleSave = () => {
    if (passwordVerified && newPassword && newPassword !== confirmPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setUser({ ...user, name, phone, image });
    toast.success("정보가 변경되었습니다.");
    setEditing(false);
    setPasswordVerified(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMatch(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setName(user.name);
    setPhone(user.phone);
    setImage(user.image);
    setCurrentPassword("");
    setPasswordVerified(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMatch(null);
  };

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* 상단 타이틀 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">마이페이지</h2>
          <p className="text-sm text-gray-500">회원 정보 확인 및 수정</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <User className="w-5 h-5 text-sky-600" />
            회원 프로필
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center">
            <img
              src={profileImage}
              alt="프로필 이미지"
              className="w-32 h-32 rounded-full object-cover border border-gray-200 shadow-sm mb-2"
            />
            {editing && (
              <label className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition">
                프로필 변경
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
            <p className="mt-3 text-gray-700 font-medium">{user.name}</p>
          </div>

          {/* 이메일 / 전화번호 */}
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
              {editing ? (
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              ) : (
                <Input type="text" value={phone} readOnly />
              )}
            </div>
          </div>

          {/* 비밀번호 변경 */}
          {editing && (
            <div className="mt-4 space-y-2">
              <Label>현재 비밀번호 확인</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  onClick={handleVerifyPassword}>
                  확인
                </Button>
              </div>

              {passwordVerified && (
                <>
                  <Label>새 비밀번호</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordMatch(
                        confirmPassword
                          ? e.target.value === confirmPassword
                            ? "일치"
                            : "불일치"
                          : null
                      );
                    }}
                  />
                  <Label>새 비밀번호 확인</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordMatch(
                        newPassword
                          ? newPassword === e.target.value
                            ? "일치"
                            : "불일치"
                          : null
                      );
                    }}
                  />
                  {passwordMatch && (
                    <p
                      className={`text-sm ${
                        passwordMatch === "일치" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {passwordMatch === "일치" ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex justify-between mt-6 items-center">
            {editing && (
              <button
                type="button"
                className="px-3 py-1 bg-gray-200 text-gray-500 border border-gray-300 rounded text-sm"
                onClick={() => toast.error("회원 탈퇴 기능")}>
                회원 탈퇴
              </button>
            )}

            <div className="flex gap-2 ml-auto">
              {editing ? (
                <>
                  <Button className="bg-gray-300 hover:bg-gray-400" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSave}>
                    저장
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                  onClick={() => setEditing(true)}
                >
                  <Edit3 className="w-4 h-4" /> 정보 수정
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
