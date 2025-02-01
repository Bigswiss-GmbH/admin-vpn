"use client";

import {
  AuthorityConfiguration,
  OidcConfiguration,
  OidcProvider,
} from "@axa-fr/react-oidc";
import FullScreenLoading from "@components/ui/FullScreenLoading";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { useRedirect } from "@hooks/useRedirect";
import loadConfig, { buildExtras } from "@utils/config";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { OIDCError } from "@/auth/OIDCError";
import { SecureProvider } from "@/auth/SecureProvider";

type Props = {
  children: React.ReactNode;
};

const config = loadConfig();

/** 
 * We skip userinfo_endpoint entirely (or set it to ""), 
 * because your server doesn't offer a separate /userinfo. 
 * We also define token_endpoint = /auth.
 */
const customAuthorityConfig: AuthorityConfiguration = {
  authorization_endpoint: "https://auth.dcd.local/oauth/authorize",
  token_endpoint: "https://auth.dcd.local/auth/me", 
  // no userinfo
  userinfo_endpoint: "",
  end_session_endpoint: "https://auth.dcd.local/auth/logout",
  revocation_endpoint: "https://auth.dcd.local/auth/revoke",
  issuer: "https://auth.dcd.local",
};

// For debugging if needed
const onEvent = (configurationName: string, eventName: string, data: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.info(`oidc:${configurationName}:${eventName}`, data);
  }
};

export default function OIDCProvider({ children }: Props) {
  const [providerConfig, setProviderConfig] = useState<OidcConfiguration>();
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams()?.toString();
  const [, setQueryParams] = useLocalStorage("netbird-query-params", params);

  useEffect(() => {
    if (params?.includes("tab") || params?.includes("search") || params?.includes("id")) {
      setQueryParams(params);
    }
  }, [params, setQueryParams]);

  // If you want Next.js routing integrated, define a custom history
  const withCustomHistory = () => ({
    replaceState: (url: string) => {
      router.replace(url);
      window.dispatchEvent(new Event("popstate"));
    },
  });

  useEffect(() => {
    const extras = buildExtras(); // Additional query params if needed

    // Build the OIDC config for the library
    const finalConfig: OidcConfiguration = {
      authority: config.authority, // e.g. "https://auth.dcd.local"
      client_id: config.clientId,   // e.g. "digital_code_distribution_vpn"
      redirect_uri: window.location.origin + config.redirectURI, 
      silent_redirect_uri: window.location.origin + config.silentRedirectURI,
      scope: config.scopesSupported, // "openid profile email"
      refresh_time_before_tokens_expiration_in_second: 30,
      service_worker_only: false,

      authority_configuration: customAuthorityConfig, 
      extras,
      ...(config.clientSecret
        ? { token_request_extras: { client_secret: config.clientSecret } }
        : null),
    };

    setProviderConfig(finalConfig);
    setMounted(true);
  }, []);

  // If certain pages are public
  if (path === "/install") return children;

  return mounted && providerConfig ? (
    <OidcProvider
      configuration={providerConfig}
      // withCustomHistory={withCustomHistory}
      authenticatingComponent={FullScreenLoading}
      authenticatingErrorComponent={OIDCError}
      loadingComponent={FullScreenLoading}
      callbackSuccessComponent={CallBackSuccess}
      onEvent={onEvent}
      onSessionLost={() => {}}
    >
      <SecureProvider>{children}</SecureProvider>
    </OidcProvider>
  ) : (
    <FullScreenLoading />
  );
}

const CallBackSuccess = () => {
  const params = useSearchParams();
  const errorParam = params.get("error");
  const currentPath = usePathname();

  useRedirect(currentPath, true, !errorParam);
  return <FullScreenLoading />;
};