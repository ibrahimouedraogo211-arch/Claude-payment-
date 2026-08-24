// api/checkout.js
// Fonction serverless Vercel. Ce code tourne uniquement côté serveur —
// le token Polar (variable d'environnement Vercel) n'est jamais exposé au navigateur.

import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_ENV === "production" ? "production" : "sandbox",
});

const PRODUCT_ID = process.env.POLAR_PRODUCT_ID;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const { email } = req.body || {};

    // Origine publique réelle du déploiement. Sur Vercel, VERCEL_URL
    // donne le domaine sans protocole ; PUBLIC_ORIGIN (si défini) prend
    // le dessus pour utiliser votre propre domaine personnalisé.
    const origin =
      process.env.PUBLIC_ORIGIN ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const checkout = await polar.checkouts.create({
      products: [PRODUCT_ID],

      customerBillingAddress: { country: "BF" },

      billingAddressFields: {
        line1: "disabled",
        line2: "disabled",
        city: "disabled",
        state: "disabled",
        postalCode: "disabled",
        country: "disabled",
      },

      requireBillingAddress: false,
      isBusinessCustomer: false,

      customerEmail: email || undefined,
      embedOrigin: origin,
      successUrl: `${origin}/success?checkout_id={CHECKOUT_ID}`,
    });

    return res.status(200).json({ url: checkout.url });
  } catch (err) {
    console.error("Erreur création checkout Polar:", err);
    return res.status(500).json({ error: "checkout_creation_failed" });
  }
}
