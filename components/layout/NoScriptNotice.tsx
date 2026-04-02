const browserGuides = [
  {
    name: "Chrome",
    steps: [
      "Open the browser menu and go to Settings.",
      "Open Privacy and security.",
      "Open Site settings.",
      "Open JavaScript.",
      "Choose Sites can use JavaScript.",
    ],
  },
  {
    name: "Edge",
    steps: [
      "Open the browser menu and go to Settings.",
      "Open Cookies and site permissions.",
      "Open JavaScript.",
      "Choose Allowed or Sites can use JavaScript.",
    ],
  },
  {
    name: "Firefox",
    steps: [
      "Type about:config in the address bar.",
      "Accept the warning page if Firefox shows one.",
      "Search for javascript.enabled.",
      "Set it to true.",
    ],
  },
  {
    name: "Safari",
    steps: [
      "Open Safari Settings or Preferences.",
      "Open Security, or Advanced depending on your version.",
      "Turn on JavaScript.",
    ],
  },
] as const;

const helpLinks = [
  {
    label: "Chrome article",
    href: "https://support.google.com/adsense/answer/12654?hl=en",
  },
  {
    label: "Firefox article",
    href: "https://support.mozilla.org/en-US/kb/javascript-settings-for-interactive-web-pages",
  },
  {
    label: "Microsoft article",
    href: "https://support.microsoft.com/en-us/office/enable-javascript-7bb9ee74-6a9e-4dd1-babf-b0a1bb136361",
  },
] as const;

export default function NoScriptNotice() {
  return (
    <section className="noscript-screen">
      <div className="noscript-card">
        <p className="noscript-eyebrow">JavaScript Required</p>
        <h1 className="noscript-title">This app needs JavaScript turned on.</h1>
        <p className="noscript-copy">
          Eindx uses JavaScript for login, navigation, local storage, and live
          schedule updates. Turn JavaScript back on in your browser settings,
          then reload this page.
        </p>

        <div className="noscript-guide">
          {browserGuides.map((browser) => (
            <div className="noscript-browser" key={browser.name}>
              <h2 className="noscript-browser-title">{browser.name}</h2>
              <ol className="noscript-steps">
                {browser.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <p className="noscript-note">
          If JavaScript is already enabled, a privacy extension or browser
          policy may be blocking scripts for this site.
        </p>

        <div className="noscript-links">
          <p className="noscript-links-title">Optional help links</p>
          <p className="noscript-links-copy">
            These pages are not always reliable. Support articles move, some
            instructions get outdated, and some sites may not load properly
            without JavaScript.
          </p>
          <div className="noscript-actions">
            {helpLinks.map((link) => (
              <a
                className="noscript-link"
                href={link.href}
                key={link.href}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
