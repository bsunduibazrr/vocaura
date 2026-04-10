"use client";

import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md justify-center px-6 py-16">
      <SignUp />
    </div>
  );
}
