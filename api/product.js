// api/product.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const token = process.env.POLAR_ACCESS_TOKEN;
  const productId = process.env.POLAR_PRODUCT_ID;
  const isSandbox = process.env.POLAR_SERVER === "sandbox";
  const baseUrl = isSandbox ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";

  if (!token || !productId) {
    return res.status(500).json({
      error: "Configuration manquante",
      detail: "POLAR_ACCESS_TOKEN ou POLAR_PRODUCT_ID manquant sur Vercel.",
    });
  }

  try {
    const productRes = await fetch(`${baseUrl}/v1/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const product = await productRes.json();

    if (!productRes.ok) {
      return res.status(productRes.status).json({
        error: "Erreur Polar Produit",
        detail: product.detail || product.message || JSON.stringify(product),
      });
    }

    let storeName = "Claude Payment";
    if (product.organization && product.organization.name) {
      storeName = product.organization.name;
    }

    const priceObj = product.prices && product.prices.length > 0 ? product.prices[0] : null;
    const priceAmount = priceObj ? priceObj.price_amount / 100 : 0;
    const priceCurrency = priceObj ? priceObj.price_currency : "EUR";

    return res.status(200).json({
      id: product.id,
      name: product.name,
      description: product.description,
      storeName: storeName,
      priceAmount: priceAmount,
      priceCurrency: priceCurrency,
      prices: product.prices,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur interne serveur",
      detail: error.message,
    });
  }
}
