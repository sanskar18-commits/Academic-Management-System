import ChangePasswordForm from "@/components/ChangePasswordForm";

export const metadata = {
  title: "Change Password | Faculty Portal",
  description: "Update faculty portal account password",
};

export default function TeacherChangePasswordPage() {
  return <ChangePasswordForm role="TEACHER" />;
}
