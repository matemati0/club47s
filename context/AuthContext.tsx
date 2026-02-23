"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import type { AuthMode, SocialProvider } from "@/lib/auth";

type AuthContextValue = {
  mode: AuthMode;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthStepResult>;
  adminLogin: (email: string, password: string) => Promise<AuthStepResult>;
  verifyTwoFactor: (code: string) => Promise<void>;
  loginWithSocial: (provider: SocialProvider) => Promise<void>;
  register: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<AuthStepResult>;
  continueAsAnonymous: () => Promise<void>;
  logout: () => Promise<void>;
};

type AuthStepResult = {
  requiresTwoFactor: boolean;
  maskedEmail?: string;
  debugCode?: string;
  message?: string;
};

type AuthApiErrors = {
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
  code?: string[];
  provider?: string[];
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export class AuthActionError extends Error {
  fieldErrors?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    code?: string;
    provider?: string;
  };

  constructor(
    message: string,
    fieldErrors?: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      code?: string;
      provider?: string;
    }
  ) {
    super(message);
    this.name = "AuthActionError";
    this.fieldErrors = fieldErrors;
  }
}

type StepPayload = {
  requiresTwoFactor?: boolean;
  maskedEmail?: string;
  debugCode?: string;
  message?: string;
  mode?: AuthMode;
  redirectUrl?: string;
};

type ParsedStepResult = {
  nextMode: AuthMode;
  result: AuthStepResult;
};

async function parseStepResult(response: Response): Promise<ParsedStepResult> {
  const payload = (await response.json().catch(() => null)) as StepPayload | null;

  if (payload?.requiresTwoFactor) {
    return {
      nextMode: "guest",
      result: {
        requiresTwoFactor: true,
        maskedEmail: payload.maskedEmail,
        debugCode: payload.debugCode,
        message: payload.message
      }
    };
  }

  const mode: AuthMode = payload?.mode === "admin" ? "admin" : "member";
  return {
    nextMode: mode,
    result: { requiresTwoFactor: false as const }
  };
}

function parseAuthErrorPayload(payload: { errors?: AuthApiErrors } | null) {
  return {
    email: payload?.errors?.email?.[0],
    password: payload?.errors?.password?.[0],
    confirmPassword: payload?.errors?.confirmPassword?.[0],
    code: payload?.errors?.code?.[0],
    provider: payload?.errors?.provider?.[0]
  };
}

export function AuthProvider({
  children,
  initialMode
}: {
  children: React.ReactNode;
  initialMode: AuthMode;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            errors?: AuthApiErrors;
          }
        | null;
      throw new AuthActionError(
        payload?.message ?? "אירעה שגיאה בהתחברות",
        parseAuthErrorPayload(payload)
      );
    }

    const parsed = await parseStepResult(response);
    setMode(parsed.nextMode);
    return parsed.result;
  }, []);

  const adminLogin = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/auth/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            errors?: AuthApiErrors;
          }
        | null;
      throw new AuthActionError(
        payload?.message ?? "אירעה שגיאה בהתחברות מנהל",
        parseAuthErrorPayload(payload)
      );
    }

    const parsed = await parseStepResult(response);
    setMode(parsed.nextMode);
    return parsed.result;
  }, []);

  const verifyTwoFactor = useCallback(async (code: string) => {
    const response = await fetch("/api/auth/verify-2fa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            errors?: AuthApiErrors;
          }
        | null;
      throw new AuthActionError(payload?.message ?? "אימות הקוד נכשל", {
        code: payload?.errors?.code?.[0]
      });
    }

    const payload = (await response.json().catch(() => null)) as { mode?: AuthMode } | null;
    setMode(payload?.mode === "admin" ? "admin" : "member");
  }, []);

  const loginWithSocial = useCallback(async (provider: SocialProvider) => {
    const response = await fetch("/api/auth/social-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ provider, returnTo: "/" })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            errors?: AuthApiErrors;
          }
        | null;
      throw new AuthActionError(payload?.message ?? "לא ניתן להתחבר כעת", {
        provider: payload?.errors?.provider?.[0]
      });
    }

    const payload = (await response.json().catch(() => null)) as
      | {
          mode?: AuthMode;
          redirectUrl?: string;
        }
      | null;

    if (payload?.redirectUrl) {
      window.location.assign(payload.redirectUrl);
      return;
    }

    setMode(payload?.mode === "member" ? "member" : "guest");
  }, []);

  const register = useCallback(
    async (email: string, password: string, confirmPassword: string) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, confirmPassword })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | {
              message?: string;
              errors?: AuthApiErrors;
            }
          | null;
        throw new AuthActionError(
          payload?.message ?? "אירעה שגיאה בהרשמה",
          parseAuthErrorPayload(payload)
        );
      }

      const parsed = await parseStepResult(response);
      setMode(parsed.nextMode);
      return parsed.result;
    },
    []
  );

  const continueAsAnonymous = useCallback(async () => {
    const response = await fetch("/api/auth/anonymous", {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("אירעה שגיאה במעבר למצב אנונימי");
    }

    setMode("anonymous");
  }, []);

  const logout = useCallback(async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("אירעה שגיאה ביציאה מהמערכת");
    }

    setMode("guest");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      isAnonymous: mode === "anonymous",
      isAuthenticated: mode === "member",
      isAdmin: mode === "admin",
      login,
      adminLogin,
      verifyTwoFactor,
      loginWithSocial,
      register,
      continueAsAnonymous,
      logout
    }),
    [
      adminLogin,
      continueAsAnonymous,
      login,
      loginWithSocial,
      logout,
      mode,
      register,
      verifyTwoFactor
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
