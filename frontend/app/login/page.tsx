"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiLock,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import type {
  ClerkAPIError,
  SignInResource,
  SignUpResource,
} from "@clerk/types";

type ClerkErrorShape = {
  errors?: ClerkAPIError[];
};

function getErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "errors" in error) {
    const firstError = (error as ClerkErrorShape).errors?.[0];
    return (
      firstError?.longMessage ||
      firstError?.message ||
      "Something went wrong. Please try again."
    );
  }

  return "Something went wrong. Please try again.";
}

function hasErrorCode(error: unknown, code: string) {
  if (typeof error !== "object" || error === null || !("errors" in error)) {
    return false;
  }

  return ((error as ClerkErrorShape).errors || []).some(
    (item) => item.code === code,
  );
}

function getEmailCodeFactor(signIn: SignInResource) {
  return signIn.supportedFirstFactors?.find(
    (factor) => factor.strategy === "email_code",
  );
}

function isValidGmailAddress(value: string) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value.trim());
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const {
    isLoaded: signUpLoaded,
    signUp,
    setActive: setSignUpActive,
  } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [mode, setMode] = useState<"sign-in" | "sign-up">(
    searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalizedEmail = useMemo(
    () => emailAddress.trim().toLowerCase(),
    [emailAddress],
  );
  const gmailReady = isValidGmailAddress(normalizedEmail);

  useEffect(() => {
    setMode(searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in");
  }, [searchParams]);

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [authLoaded, isSignedIn, router]);

  async function showSuccessAndEnter(lane: "sign-in" | "sign-up") {
    setStep("success");
    setErrorMessage("");
    setSuccessMessage(
      lane === "sign-up"
        ? "Account unlocked. Welcome to the Vocaura arena."
        : "Mission cleared. You are back in the arena.",
    );

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "post-login-toast",
        lane === "sign-up"
          ? "Account unlocked. Welcome to Vocaura."
          : "Амжилттай нэвтэрлээ. Arena руу тавтай морил.",
      );
    }

    window.setTimeout(() => {
      router.push("/");
    }, 1200);
  }

  async function completeSignIn(resource: SignInResource) {
    if (!resource.createdSessionId) {
      setErrorMessage("Session could not be created. Please try again.");
      return;
    }

    await setActive?.({ session: resource.createdSessionId });
    await showSuccessAndEnter("sign-in");
  }

  async function completeSignUp(resource: SignUpResource) {
    if (!resource.createdSessionId) {
      setErrorMessage(
        "Account was created but session is missing. Please try again.",
      );
      return;
    }

    await setSignUpActive?.({ session: resource.createdSessionId });
    await showSuccessAndEnter("sign-up");
  }

  async function startOtpSignUp(nextEmail: string) {
    if (!signUp) {
      setErrorMessage("Sign-up is not ready yet. Please try again.");
      return;
    }

    const createdSignUp = await signUp.create({ emailAddress: nextEmail });
    await createdSignUp.prepareEmailAddressVerification({
      strategy: "email_code",
    });

    setMode("sign-up");
    setPendingEmail(nextEmail);
    setStep("code");
    setSuccessMessage(
      `New player detected. Gmail inbox-д чинь unlock code илгээлээ.`,
    );
  }

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) {
      return;
    }

    if (!gmailReady) {
      setErrorMessage("Зөвхөн `@gmail.com` хаягаар нэвтрэх боломжтой.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const createdSignIn = await signIn.create({
        identifier: normalizedEmail,
      });
      const emailCodeFactor = getEmailCodeFactor(createdSignIn);

      if (!emailCodeFactor || !("emailAddressId" in emailCodeFactor)) {
        setErrorMessage(
          "Clerk Dashboard дээр Email verification code sign-in асаагаагүй байна.",
        );
        return;
      }

      const preparedSignIn = await createdSignIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCodeFactor.emailAddressId,
      });

      if (preparedSignIn.status === "complete") {
        await completeSignIn(preparedSignIn);
        return;
      }

      setMode("sign-in");
      setPendingEmail(normalizedEmail);
      setStep("code");
      setSuccessMessage("Quest code чинь Gmail inbox руу амжилттай явлаа.");
    } catch (error) {
      if (hasErrorCode(error, "form_identifier_not_found")) {
        try {
          await startOtpSignUp(normalizedEmail);
          return;
        } catch (signUpError) {
          setErrorMessage(getErrorMessage(signUpError));
          return;
        }
      }

      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (mode === "sign-up") {
        const verifiedSignUp = await signUp.attemptEmailAddressVerification({
          code: code.trim(),
        });

        if (verifiedSignUp.status === "complete") {
          await completeSignUp(verifiedSignUp);
          return;
        }

        setErrorMessage(
          "Code verify хийгдсэнгүй. Шинэ код авч дахин оролдоно уу.",
        );
        return;
      }

      const verifiedSignIn = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: code.trim(),
      });

      if (verifiedSignIn.status === "complete") {
        await completeSignIn(verifiedSignIn);
        return;
      }

      setErrorMessage(
        "Code verify хийгдсэнгүй. Шинэ код авч дахин оролдоно уу.",
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp || !pendingEmail) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (mode === "sign-up") {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setSuccessMessage(
          "Fresh unlock code Gmail inbox руу чинь дахин очлоо.",
        );
        return;
      }

      const emailCodeFactor = getEmailCodeFactor(signIn);

      if (!emailCodeFactor || !("emailAddressId" in emailCodeFactor)) {
        setErrorMessage(
          "Email OTP factor олдсонгүй. Дахин эхлүүлээд оролдоно уу.",
        );
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCodeFactor.emailAddressId,
      });

      setSuccessMessage("Fresh quest code Gmail inbox руу чинь дахин явлаа.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!authLoaded || !signInLoaded || !signUpLoaded) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6 py-16">
        <div className="h-[420px] w-full animate-pulse rounded-[28px] border border-border bg-surface" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl items-center justify-center px-5 py-12 sm:px-6">
      <section className="w-full max-w-[460px] rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,16,22,0.98),rgba(0,0,0,0.98))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            {step === "success" ? (
              <FiCheckCircle className="text-2xl" />
            ) : (
              <FiLock className="text-2xl" />
            )}
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
            Vocaura
          </p>
          <h1 className="mt-4 font-display text-4xl text-white">
            {step === "success"
              ? "Амжилттай нэвтэрлээ"
              : mode === "sign-up"
                ? "Sign Up for Vocaura"
                : "Login to Vocaura"}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
            {step === "success"
              ? successMessage
              : step === "code"
                ? `${pendingEmail} хаяг руу илгээсэн OTP кодоо оруулна уу.`
                : "Gmail хаягаа оруулаад OTP кодоор нэвтэрнэ."}
          </p>
        </div>

        {step !== "success" && (
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  mode === "sign-in"
                    ? "bg-accent/15 text-accent"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("sign-up")}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  mode === "sign-up"
                    ? "bg-accent/15 text-accent"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign up
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          {step === "success" ? (
            <div className="rounded-[28px] border border-accent/15 bg-accent/5 px-6 py-8 text-center text-sm text-accent">
              Redirecting to home...
            </div>
          ) : step === "email" ? (
            <div>
              <form className="mt-8 space-y-5" onSubmit={handleSendCode}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-400">
                    Email address
                  </span>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-1">
                    <input
                      type="email"
                      autoComplete="email"
                      value={emailAddress}
                      onChange={(event) => setEmailAddress(event.target.value)}
                      placeholder="playername@gmail.com"
                      className="w-full rounded-[20px] border border-transparent bg-transparent px-5 py-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-accent/40"
                      required
                    />
                  </div>
                </label>

                {!gmailReady && emailAddress.trim() && (
                  <div className="rounded-2xl border border-accent3/30 bg-accent3/10 px-4 py-3 text-sm text-accent3">
                    Зөвхөн `@gmail.com` хаяг хүлээн авна.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !gmailReady}
                  className="inline-flex w-full items-center justify-center rounded-full border border-accent bg-accent/10 px-5 py-4 text-sm font-semibold text-accent transition hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Sending OTP..."
                    : mode === "sign-up"
                      ? "Continue"
                      : "Log in"}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <form className="mt-8 space-y-5" onSubmit={handleVerifyCode}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-400">
                    OTP code
                  </span>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="123456"
                      className="w-full rounded-[20px] border border-transparent bg-transparent px-5 py-4 text-base tracking-[0.35em] text-white outline-none transition placeholder:tracking-normal placeholder:text-slate-600 focus:border-accent/40"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !code.trim()}
                  className="inline-flex w-full items-center justify-center rounded-full border border-accent bg-accent/10 px-5 py-4 text-sm font-semibold text-accent transition hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Verifying..."
                    : mode === "sign-up"
                      ? "Sign up"
                      : "Verify and log in"}
                </button>
              </form>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiRefreshCw />
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setPendingEmail("");
                    setMode("sign-in");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-accent3 hover:text-accent3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiArrowLeft />
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-accent2/40 bg-accent2/10 px-4 py-3 text-sm text-accent2">
            {errorMessage}
          </div>
        )}

        {successMessage && step !== "success" && (
          <div className="mt-5 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
            {successMessage}
          </div>
        )}

        {step === "email" && (
          <div className="mt-8 text-center text-sm text-slate-400">
            {mode === "sign-up"
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() =>
                setMode((current) =>
                  current === "sign-in" ? "sign-up" : "sign-in",
                )
              }
              className="text-accent transition hover:text-white"
            >
              {mode === "sign-up" ? "Log in" : "Sign up"}
            </button>
          </div>
        )}

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-accent"
        >
          <FiArrowLeft />
          Back to home
        </Link>
      </section>
    </div>
  );
}
