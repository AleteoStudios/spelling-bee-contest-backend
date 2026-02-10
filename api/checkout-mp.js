const mercadopago = require("mercadopago");
const { createClient } = require("@supabase/supabase-js");

mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    try {
        const { package_id, email } = req.query;

        if (!package_id || !email) {
            return res.status(400).json({
                ok: false,
                error: "package_id y email son requeridos",
            });
        }

        // 1. Obtener paquete desde Supabase
        const { data: pkg, error } = await supabase
            .from("packages")
            .select("*")
            .eq("id", package_id)
            .single();

        if (error || !pkg) {
            return res.status(404).json({
                ok: false,
                error: "Paquete no encontrado",
            });
        }

        // 2. Crear preferencia en Mercado Pago
        const preference = {
            items: [
                {
                    title: `Spelling Bee Contest - ${pkg.name}`,
                    quantity: 1,
                    currency_id: "MXN",
                    unit_price: Number(pkg.price_mxn),
                },
            ],
            payer: {
                email,
            },
            back_urls: {
                success:
                    "https://aleteostudios.github.io/spelling-bee-contest-landing/?status=success",
                failure:
                    "https://aleteostudios.github.io/spelling-bee-contest-landing/?status=failure",
                pending:
                    "https://aleteostudios.github.io/spelling-bee-contest-landing/?status=pending",
            },
            auto_return: "approved",
            metadata: {
                package_id: pkg.id,
                email,
            },
        };

        const response = await mercadopago.preferences.create(preference);

        return res.status(200).json({
            ok: true,
            init_point:
                response.body.init_point || response.body.sandbox_init_point,
        });
    } catch (err) {
        console.error("checkout-mp error:", err);
        return res.status(500).json({
            ok: false,
            error: "Error creando preferencia de pago",
        });
    }
};
