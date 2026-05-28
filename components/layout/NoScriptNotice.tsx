import type { AppMessages } from "@/lib/i18n/messages";
import s from "./NoScriptNotice.module.css";

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
    <section className={s.noscriptScreen}>
      <div className={s.noscriptCard}>
        <p className={s.noscriptEyebrow}>{messages.eyebrow}</p>
        <h1 className={s.noscriptTitle}>{messages.title}</h1>
        <p className={s.noscriptCopy}>{messages.copy}</p>

        <div className={s.noscriptGuide}>
          {browserGuides.map((browser) => (
            <div className={s.noscriptBrowser} key={browser.name}>
              <h2 className={s.noscriptBrowserTitle}>{browser.name}</h2>
              <ol className={s.noscriptSteps}>
                {browser.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <p className={s.noscriptNote}>{messages.note}</p>

        <div className={s.noscriptLinks}>
          <p className={s.noscriptLinksTitle}>{messages.linksTitle}</p>
          <p className={s.noscriptLinksCopy}>{messages.linksCopy}</p>
          <div className={s.noscriptActions}>
            {helpLinks.map((link) => (
              <a
                className={s.noscriptLink}
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
