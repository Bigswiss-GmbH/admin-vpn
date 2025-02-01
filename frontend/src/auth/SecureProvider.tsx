import { OidcSecure, useOidc } from "@axa-fr/react-oidc";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

export const SecureProvider = ({ children }: Props) => {
  const { isAuthenticated, login } = useOidc();
  const currentPath = usePathname();

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (!isAuthenticated) {
      timeout = setTimeout(async () => {
        if (!isAuthenticated) {
          await login(currentPath);
        }
      }, 1500);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentPath, isAuthenticated, login]);

  return (
    <OidcSecure callbackPath={currentPath}>
      {children}
    </OidcSecure>
  );
};