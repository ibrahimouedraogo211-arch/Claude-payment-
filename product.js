// api/product.js
// Récupère les infos réelles du produit (et de la boutique/organisation)
// depuis l'API Polar, côté serveur, pour que la page ne contienne plus
// rien en dur.

import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_ENV === "production" ? "production" : "sandbox",
});

const PRODUCT_ID = process.env.POLAR_PRODUCT_ID;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const product = await polar.products.get({ id: PRODUCT_ID });

    // Prix "catalogue" (pas un prix ad-hoc/personnalisé, pas archivé).
    const price = (product.prices || []).find((p) => !p.isArchived) || product.prices?.[0];

    let storeName = null;
    try {
      // Nécessite le scope "organizations:read" sur le token. Si le token
      // ne l'a pas, on ignore simplement — ce n'est pas bloquant.
      const org = await polar.organizations.get({ id: product.organizationId });
      storeName = org.name;
    } catch (e) {
      console.warn("Impossible de récupérer le nom de la boutique:", e.message);
    }

    return res.status(200).json({
      name: product.name,
      description: product.description,
      storeName,
      price: price
        ? {
            amount: price.priceAmount, // en centimes
            currency: price.priceCurrency, // ex: "eur"
            type: price.amountType, // "fixed" | "free" | "custom" ...
          }
        : null,
    });
  } catch (err) {
    console.error("Erreur récupération produit Polar:", err);
    return res.status(500).json({ error: "product_fetch_failed" });
  }
}
