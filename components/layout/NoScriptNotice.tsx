import type { AppMessages } from "@/lib/i18n/messages";

const helpLinks = [
  {
    id: "chrome",
    href: "https://support.google.com/adsense/answer/12654?hl=en",
  },
  {
    id: "firefox",
    href: "https://support.mozilla.org/en-US/kb/javascript-settings-for-interactive-web-pages",
  },
  {
    id: "microsoft",
    href: "https://support.microsoft.com/en-us/office/enable-javascript-7bb9ee74-6a9e-4dd1-babf-b0a1bb136361",
  },
] as const;

type NoScriptNoticeProps = {
  messages: AppMessages["noscript"];
};

export default function NoScriptNotice({ messages }: NoScriptNoticeProps) {
  const browserGuides = [
    {
      name: "Chrome",
      steps: messages.browsers.chrome,
    },
    {
      name: "Edge",
      steps: messages.browsers.edge,
    },
    {
      name: "Firefox",
      steps: messages.browsers.firefox,
    },
    {
      name: "Safari",
      steps: messages.browsers.safari,
    },
  ] as const;

  return (
    <section className="noscript-screen">
      <div className="noscript-card">
        <p className="noscript-eyebrow">{messages.eyebrow}</p>
        <h1 className="noscript-title">{messages.title}</h1>
        <p className="noscript-copy">{messages.copy}</p>

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

        <p className="noscript-note">{messages.note}</p>

        <div className="noscript-links">
          <p className="noscript-links-title">{messages.linksTitle}</p>
          <p className="noscript-links-copy">{messages.linksCopy}</p>
          <div className="noscript-actions">
            {helpLinks.map((link) => (
              <a
                className="noscript-link"
                href={link.href}
                key={link.href}
                rel="noreferrer"
                target="_blank"
              >
                {messages.links[link.id]}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
