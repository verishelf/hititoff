import type { Metadata } from "next";
import Script from "next/script";

import { LegalPageFooter } from "@/components/LegalPageFooter";
import { APP_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/brand";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
  webPageJsonLd,
} from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "End User License Agreement (EULA)",
  description:
    "HitItOff End User License Agreement (EULA) for iOS and Android app downloads, including license scope, restrictions, subscriptions, and App Store terms.",
  path: "/eula",
});

export default function EulaPage() {
  const pageMeta = {
    title: "End User License Agreement (EULA)",
    description:
      "HitItOff End User License Agreement (EULA) for iOS and Android app downloads, including license scope, restrictions, subscriptions, and App Store terms.",
    path: "/eula",
  };

  const jsonLd = [
    webPageJsonLd(pageMeta),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "EULA", path: "/eula" },
    ]),
  ];

  return (
    <>
      <Script
        id="eula-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">
          End User License Agreement (EULA)
        </h1>
        <p className="mt-4 text-text-muted">Last updated: May 24, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-text-muted [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mt-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          <p>
            This End User License Agreement (&quot;EULA&quot;) is a legal agreement
            between you and {APP_NAME} (&quot;Licensor&quot;, &quot;we&quot;, &quot;us&quot;,
            or &quot;our&quot;) for the {APP_NAME} mobile application and related
            services (the &quot;Licensed Application&quot;). By downloading, installing,
            or using the Licensed Application, you agree to this EULA. If you do not
            agree, do not use the Licensed Application.
          </p>

          <p>
            This EULA supplements our{" "}
            <a href="/terms" className="text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary">
              Privacy Policy
            </a>
            . In the event of a conflict, this EULA governs your license to use the
            Licensed Application.
          </p>

          <h2>1. Scope of license</h2>
          <p>
            Subject to your compliance with this EULA, we grant you a limited,
            non-exclusive, non-transferable, revocable license to install and use one
            copy of the Licensed Application on Apple-branded or Android devices that
            you own or control, solely for your personal, non-commercial use.
          </p>
          <p>You may not:</p>
          <ul>
            <li>Copy, modify, or create derivative works of the Licensed Application</li>
            <li>Reverse engineer, decompile, or disassemble the Licensed Application</li>
            <li>Rent, lease, lend, sell, sublicense, or redistribute the Licensed Application</li>
            <li>Remove proprietary notices or circumvent security or access controls</li>
            <li>Use the Licensed Application for unlawful, harmful, or abusive purposes</li>
          </ul>

          <h2>2. Eligibility</h2>
          <p>
            The Licensed Application is intended only for users who are 18 years of age
            or older. By using the Licensed Application, you represent that you meet
            this requirement and have the legal capacity to enter this agreement.
          </p>

          <h2>3. Account and content</h2>
          <p>
            You are responsible for your account credentials and all activity under
            your account. You retain ownership of content you submit, but grant us a
            license to host, display, and process that content as needed to operate
            matching, messaging, and profile features described in our Terms of Service.
          </p>

          <h2>4. Subscriptions and in-app purchases</h2>
          <p>
            {APP_NAME} may offer optional paid features, including HitItOff Pro
            subscriptions. Purchases made through the Apple App Store or Google Play
            are processed by the applicable platform. Pricing, billing, renewal,
            cancellation, and refunds are governed by that platform&apos;s terms and
            policies. Subscription management is available through your App Store or
            Google Play account settings.
          </p>

          <h2>5. Updates and maintenance</h2>
          <p>
            We may provide updates, patches, or modifications to the Licensed
            Application. Some updates may be required to continue using certain
            features. We may modify or discontinue features with reasonable notice
            where practicable.
          </p>

          <h2>6. Termination</h2>
          <p>
            This license is effective until terminated. You may terminate it by
            deleting the Licensed Application and your account. We may suspend or
            terminate your license if you violate this EULA, our Terms of Service, or
            applicable law. Upon termination, your right to use the Licensed
            Application ends immediately.
          </p>

          <h2>7. Disclaimer of warranties</h2>
          <p>
            THE LICENSED APPLICATION IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
            IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE
            LICENSED APPLICATION WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT
            YOU WILL ACHIEVE ANY PARTICULAR MATCHING OR RELATIONSHIP OUTCOME.
          </p>

          <h2>8. Limitation of liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {APP_NAME.toUpperCase()} AND ITS
            AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR
            GOODWILL, ARISING FROM YOUR USE OF THE LICENSED APPLICATION. OUR TOTAL
            LIABILITY FOR ANY CLAIM RELATING TO THE LICENSED APPLICATION SHALL NOT
            EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE (12)
            MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS (US $100).
          </p>

          <h2>9. Export and legal compliance</h2>
          <p>
            You agree to comply with all applicable export control and sanctions laws.
            You may not use or export the Licensed Application except as authorized by
            applicable law.
          </p>

          <h2>10. Apple App Store terms</h2>
          <p>
            If you downloaded the Licensed Application from the Apple App Store, the
            following additional terms apply:
          </p>
          <ul>
            <li>
              This EULA is between you and {APP_NAME}, not Apple. Apple is not
              responsible for the Licensed Application or its content.
            </li>
            <li>
              Apple has no obligation to provide maintenance or support for the
              Licensed Application.
            </li>
            <li>
              In the event of any failure of the Licensed Application to conform to
              any applicable warranty, you may notify Apple and Apple may refund the
              purchase price (if any). To the maximum extent permitted by law, Apple
              has no other warranty obligations.
            </li>
            <li>
              Apple is not responsible for addressing any claims relating to the
              Licensed Application, including product liability, legal compliance, or
              consumer protection claims.
            </li>
            <li>
              In the event of any third-party claim that the Licensed Application
              infringes intellectual property rights, {APP_NAME}, not Apple, is
              responsible for investigation, defense, settlement, and discharge of such
              claim to the extent required by this EULA.
            </li>
            <li>
              Apple and its subsidiaries are third-party beneficiaries of this EULA
              and may enforce it against you as a third-party beneficiary.
            </li>
            <li>
              You must comply with applicable App Store terms of service when using
              the Licensed Application.
            </li>
          </ul>

          <h2>11. Google Play terms</h2>
          <p>
            If you downloaded the Licensed Application from Google Play, you must also
            comply with Google Play&apos;s terms of service and policies. Google is not
            a party to this EULA and is not responsible for the Licensed Application.
          </p>

          <h2>12. Governing law</h2>
          <p>
            This EULA is governed by the laws applicable in your place of residence,
            except where mandatory consumer protection laws require otherwise. Any
            disputes shall be resolved in the courts of competent jurisdiction, unless
            applicable law provides otherwise.
          </p>

          <h2>13. Changes</h2>
          <p>
            We may update this EULA from time to time. Material changes will be posted
            at {SITE_URL}/eula with an updated date. Continued use of the Licensed
            Application after changes become effective constitutes acceptance of the
            revised EULA.
          </p>

          <h2>14. Contact</h2>
          <p>
            Questions about this EULA? Contact{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <LegalPageFooter page="eula" />
        </div>
      </article>
    </>
  );
}
