import { GoogleIcon, MicrosoftIcon } from "./icons";

export function SsoButtons() {
  return (
    <>
      <div className="divider">or continue with</div>
      <div className="sso-grid">
        <button className="sso-button" type="button">
          <GoogleIcon width="17" height="17" />
          Google
        </button>
        <button className="sso-button" type="button">
          <MicrosoftIcon width="16" height="16" />
          Microsoft
        </button>
      </div>
    </>
  );
}
