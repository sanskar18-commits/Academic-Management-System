import ChangePasswordForm from "@/components/ChangePasswordForm";

export const metadata = {
  title: "Change Password | Student Portal",
  description: "Update student portal account password",
};

export default function StudentChangePasswordPage() {
  return <ChangePasswordForm role="STUDENT" />;
}
