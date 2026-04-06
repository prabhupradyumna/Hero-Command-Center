import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Hero Command Center",
  description: "Create a new account for Hero Command Center - Secure hero and mission management",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
