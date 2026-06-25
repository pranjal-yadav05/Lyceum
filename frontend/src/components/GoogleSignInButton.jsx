import { useEffect, useRef, useState } from "react";
import { renderGoogleButton, waitForGoogleScript } from "../lib/googleAuth";

const GoogleSignInButton = ({
  theme = "filled_black",
  size = "large",
  text = "signin_with",
  width,
}) => {
  const containerRef = useRef(null);
  const renderedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    waitForGoogleScript()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || renderedRef.current) return;

    renderGoogleButton(containerRef.current, {
      theme,
      size,
      text,
      ...(width ? { width } : {}),
    });
    renderedRef.current = true;
  }, [ready, theme, size, text, width]);

  return <div ref={containerRef} />;
};

export default GoogleSignInButton;
