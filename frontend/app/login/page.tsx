"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiCrosshair,
  FiLogIn,
  FiMail,
  FiRefreshCw,
  FiStar,
} from "react-icons/fi";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import { useLanguage } from "../../components/LanguageProvider";
import type {
  ClerkAPIError,
  SignInResource,
  SignUpResource,
} from "@clerk/types";

type ClerkErrorShape = {
  errors?: ClerkAPIError[];
};

const EMAIL_TEMPLATE_COPY = {
  subject: "Vocaura Access Code: Your next streak starts now",
  preview:
    "Player, your gate code is ready. Enter the OTP and jump back into your vocab run before the combo drops.",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "errors" in error) {
    const firstError = (error as ClerkErrorShape).errors?.[0];
    return (
      firstError?.longMessage ||
      firstError?.message ||
      fallback
    );
  }

  return fallback;
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
  const { language } = useLanguage();
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
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalizedEmail = useMemo(
    () => emailAddress.trim().toLowerCase(),
    [emailAddress],
  );
  const gmailReady = isValidGmailAddress(normalizedEmail);
  const copy =
    language === "mn"
      ? {
          genericError: "Ямар нэг алдаа гарлаа. Дахин оролдоно уу.",
          successSignup: "Бүртгэл амжилттай нээгдлээ. Vocaura-д тавтай морил.",
          successSignin: "Амжилттай нэвтэрлээ.",
          toastSignup: "Бүртгэл амжилттай боллоо. Vocaura-д тавтай морил.",
          toastSignin: "Амжилттай нэвтэрлээ.",
          missingSession: "Session үүсэж чадсангүй. Дахин оролдоно уу.",
          missingSignupSession: "Бүртгэл үүссэн ч session алга байна. Дахин оролдоно уу.",
          signupNotReady: "Бүртгэлийн хэсэг хараахан бэлэн биш байна. Дахин оролдоно уу.",
          signupCodeSent: "Шинэ хэрэглэгч илэрлээ. Gmail inbox руу тань код илгээлээ.",
          gmailOnly: "Зөвхөн @gmail.com хаягаар нэвтрэх боломжтой.",
          clerkConfig: "Clerk Dashboard дээр Email verification code sign-in идэвхтэй байх ёстой.",
          signinCodeSent: "Нэвтрэх код Gmail inbox руу амжилттай явлаа.",
          verifyFailed: "Код баталгаажаагүй байна. Шинэ код аваад дахин оролдоно уу.",
          signupResend: "Шинэ код Gmail inbox руу дахин илгээгдлээ.",
          factorMissing: "Email OTP factor олдсонгүй. Дахин эхлүүлээд оролдоно уу.",
          signinResend: "Шинэ нэвтрэх код Gmail inbox руу дахин илгээгдлээ.",
          complete: "Нэвтрэлт дууслаа",
          successTitle: "Амжилттай нэвтэрлээ",
          status: "Төлөв",
          statusValue: "Хадгалагдлаа",
          next: "Дараагийн алхам",
          nextValue: "Нүүр рүү шилжиж байна...",
          checkpoint1: "Алхам 1",
          emailTitle: "Gmail-аараа нэвтрэх",
          gmailAddress: "Gmail хаяг",
          gmailHint: "Зөвхөн @gmail.com хаяг хүлээн авна.",
          sending: "Код илгээж байна...",
          sendOtp: "Gmail OTP илгээх",
          checkpoint2: "Алхам 2",
          otpTitle: "OTP кодоо баталгаажуулах",
          codeHelpSignup: " хаяг руу илгээсэн бүртгэлийн кодоо оруулна уу.",
          codeHelpSignin: " хаяг руу илгээсэн нэвтрэх кодоо оруулна уу.",
          otpCode: "OTP код",
          unlocking: "Шалгаж байна...",
          verifyCreate: "Баталгаажуулаад бүртгэл үүсгэх",
          verifyEnter: "Баталгаажуулаад нэвтрэх",
          resend: "Код дахин илгээх",
          changeGmail: "Gmail солих",
          setupNote: "Тохиргооны тэмдэглэл",
          setupBody: "Clerk Dashboard дээр Email verification code sign-in болон sign-up идэвхтэй байх ёстой. Жинхэнэ Gmail message copy-г тэндээс өөрчилнө.",
          backHome: "Нүүр рүү буцах",
        }
      : {
          genericError: "Something went wrong. Please try again.",
          successSignup: "Account unlocked. Welcome to the Vocaura arena.",
          successSignin: "Mission cleared. You are back in the arena.",
          toastSignup: "Account unlocked. Welcome to Vocaura.",
          toastSignin: "Logged in successfully.",
          missingSession: "Session could not be created. Please try again.",
          missingSignupSession: "Account was created but session is missing. Please try again.",
          signupNotReady: "Sign-up is not ready yet. Please try again.",
          signupCodeSent: "New player detected. We sent an unlock code to your Gmail inbox.",
          gmailOnly: "Only @gmail.com addresses are supported.",
          clerkConfig: "Email verification code sign-in must be enabled in the Clerk Dashboard.",
          signinCodeSent: "Your login code was sent to your Gmail inbox.",
          verifyFailed: "The code could not be verified. Request a new one and try again.",
          signupResend: "A fresh unlock code has been sent to your Gmail inbox.",
          factorMissing: "Email OTP factor was not found. Please restart and try again.",
          signinResend: "A fresh login code has been sent to your Gmail inbox.",
          complete: "Login Complete",
          successTitle: "You are signed in",
          status: "Status",
          statusValue: "Checkpoint saved",
          next: "Next",
          nextValue: "Warping home...",
          checkpoint1: "Checkpoint 1",
          emailTitle: "Access with Gmail",
          gmailAddress: "Gmail address",
          gmailHint: "Only @gmail.com addresses are accepted.",
          sending: "Sending quest code...",
          sendOtp: "Send Gmail OTP",
          checkpoint2: "Checkpoint 2",
          otpTitle: "Verify your OTP code",
          codeHelpSignup: " received a sign-up code. Enter it below.",
          codeHelpSignin: " received a login code. Enter it below.",
          otpCode: "OTP code",
          unlocking: "Unlocking access...",
          verifyCreate: "Verify and create profile",
          verifyEnter: "Verify and enter arena",
          resend: "Resend code",
          changeGmail: "Change Gmail",
          setupNote: "Setup Note",
          setupBody: "Email verification code sign-in and sign-up must be enabled in the Clerk Dashboard. You can edit the actual Gmail message copy there.",
          backHome: "Back to home",
        };

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
        ? copy.successSignup
        : copy.successSignin,
    );

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "post-login-toast",
        lane === "sign-up"
          ? copy.toastSignup
          : copy.toastSignin,
      );
    }

    window.setTimeout(() => {
      router.push("/");
    }, 1200);
  }

  async function completeSignIn(resource: SignInResource) {
    if (!resource.createdSessionId) {
      setErrorMessage(copy.missingSession);
      return;
    }

    await setActive?.({ session: resource.createdSessionId });
    await showSuccessAndEnter("sign-in");
  }

  async function completeSignUp(resource: SignUpResource) {
    if (!resource.createdSessionId) {
      setErrorMessage(
        copy.missingSignupSession,
      );
      return;
    }

    await setSignUpActive?.({ session: resource.createdSessionId });
    await showSuccessAndEnter("sign-up");
  }

  async function startOtpSignUp(nextEmail: string) {
    if (!signUp) {
      setErrorMessage(copy.signupNotReady);
      return;
    }

    const createdSignUp = await signUp.create({ emailAddress: nextEmail });
    await createdSignUp.prepareEmailAddressVerification({
      strategy: "email_code",
    });

    setMode("sign-up");
    setPendingEmail(nextEmail);
    setStep("code");
    setSuccessMessage(copy.signupCodeSent);
  }

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) {
      return;
    }

    if (!gmailReady) {
      setErrorMessage(copy.gmailOnly);
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
          copy.clerkConfig,
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
      setSuccessMessage(copy.signinCodeSent);
    } catch (error) {
      if (hasErrorCode(error, "form_identifier_not_found")) {
        try {
          await startOtpSignUp(normalizedEmail);
          return;
        } catch (signUpError) {
          setErrorMessage(getErrorMessage(signUpError, copy.genericError));
          return;
        }
      }

      setErrorMessage(getErrorMessage(error, copy.genericError));
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
          copy.verifyFailed,
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
        copy.verifyFailed,
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, copy.genericError));
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
        setSuccessMessage(copy.signupResend);
        return;
      }

      const emailCodeFactor = getEmailCodeFactor(signIn);

      if (!emailCodeFactor || !("emailAddressId" in emailCodeFactor)) {
        setErrorMessage(
          copy.factorMissing,
        );
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCodeFactor.emailAddressId,
      });

      setSuccessMessage(copy.signinResend);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, copy.genericError));
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
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-6xl justify-center items-center px-5 py-12 sm:px-6">
      <div className="flex justify-center w-[50%] gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden rounded-[36px] border border-white/15 bg-[linear-gradient(180deg,rgba(8,12,18,0.98),rgba(0,0,0,0.98))] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-10">
          <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(79,255,176,0.9),transparent)]" />

          {step === "success" ? (
            <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
              <div className="shimmer rounded-full border border-accent/40 bg-accent/10 p-6">
                <FiCheckCircle className="text-5xl text-accent" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                {copy.complete}
              </p>
              <h2 className="mt-4 font-display text-4xl text-white">
                {copy.successTitle}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                {successMessage}
              </p>
              <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {copy.status}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-accent">
                    {copy.statusValue}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {copy.next}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-accent3">
                    {copy.nextValue}
                  </p>
                </div>
              </div>
            </div>
          ) : step === "email" ? (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-3 text-accent">
                  <FiCrosshair />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    {copy.checkpoint1}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-white">
                    {copy.emailTitle}
                  </h2>
                </div>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSendCode}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-400">
                    {copy.gmailAddress}
                  </span>
                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-1">
                    <input
                      type="email"
                      autoComplete="email"
                      value={emailAddress}
                      onChange={(event) => setEmailAddress(event.target.value)}
                      placeholder="playername@gmail.com"
                      className="w-full rounded-[24px] border border-transparent bg-transparent px-5 py-4 text-lg text-white outline-none transition placeholder:text-slate-600 focus:border-accent/40"
                      required
                    />
                  </div>
                </label>

                {!gmailReady && emailAddress.trim() && (
                  <div className="rounded-2xl border border-accent3/30 bg-accent3/10 px-4 py-3 text-sm text-accent3">
                    {copy.gmailHint}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !gmailReady}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-accent bg-[linear-gradient(90deg,rgba(79,255,176,0.18),rgba(79,255,176,0.08))] px-5 py-4 text-sm font-semibold text-accent transition hover:bg-[linear-gradient(90deg,rgba(79,255,176,0.28),rgba(79,255,176,0.14))] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiMail />
                  {submitting ? copy.sending : copy.sendOtp}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-accent3/30 bg-accent3/10 p-3 text-accent3">
                  <FiStar />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    {copy.checkpoint2}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-white">
                    {copy.otpTitle}
                  </h2>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-400">
                <span className="text-white">{pendingEmail}</span> хаяг руу
                {mode === "sign-up" ? copy.codeHelpSignup : copy.codeHelpSignin}
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleVerifyCode}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-400">
                    {copy.otpCode}
                  </span>
                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="123456"
                      className="w-full rounded-[24px] border border-transparent bg-transparent px-5 py-4 text-lg tracking-[0.45em] text-white outline-none transition placeholder:tracking-normal placeholder:text-slate-600 focus:border-accent/40"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !code.trim()}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-accent bg-[linear-gradient(90deg,rgba(79,255,176,0.18),rgba(79,255,176,0.08))] px-5 py-4 text-sm font-semibold text-accent transition hover:bg-[linear-gradient(90deg,rgba(79,255,176,0.28),rgba(79,255,176,0.14))] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiLogIn />
                  {submitting
                    ? copy.unlocking
                    : mode === "sign-up"
                      ? copy.verifyCreate
                      : copy.verifyEnter}
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
                  {copy.resend}
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
                  {copy.changeGmail}
                </button>
              </div>
            </>
          )}

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

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              {copy.setupNote}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              {copy.setupBody}
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-accent"
          >
            <FiArrowLeft />
            {copy.backHome}
          </Link>
        </section>
      </div>
    </div>
  );
}
