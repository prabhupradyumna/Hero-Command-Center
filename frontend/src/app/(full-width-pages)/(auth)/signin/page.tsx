import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Hero Command Center",
  description: "Sign in to Hero Command Center - Secure authentication for the hero management system",
};

export default function SignIn() {
  return <SignInForm />;
}
