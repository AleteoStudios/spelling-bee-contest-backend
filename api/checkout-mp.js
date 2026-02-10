import MercadoPago from "mercadopago";

export default async function handler(req, res) {
    try {
        const { package_id, email } = req.query;

        if (!package_id || !email) {
            return res.status(400).json({
                ok: false,
                error: "package_id y email son requeridos"
            });
        }

        // Configurar Mercado Pago (SDK nuevo)
        const mp = new MercadoPago({
            accessToken: process.env.MP_ACCESS_TOKEN
        });

        // Paquetes (puedes luego moverlos a BD)
        const PACKAGES = {
            PAQ1: { title: "Licencia Mensual Básica", price: 250 },
            PAQ2: { title: "Licencia Institucional Anual", price: 1550 },
            PAQ3: { title: "Licencia Perpetua Personalizada", price: 3500 }
        };

        const selected = PACKAGES[package_id];

        if (!selected) {
            return res.status(404).json({
                ok: false,
                error: "Paquete no encontrado"
            });
        }

        // Crear preferencia de pago
        const preference = await mp.preferences.create({
            items: [
                {
                    title: selected.title,
                    quantity: 1,
                    unit_price: selected.price,
                    currency_id: "MXN"
                }
            ],
            payer: {
                email
            },
            metadata: {
                package_id
            },
            back_urls: {
                success: "https://aletostudios.github.io/spelling-bee-contest-landing/success.html",
                failure: "https://aletostudios.github.io/spelling-bee-contest-landing/failure.html",
                pending: "https://aletostudios.github.io/spelling-bee-contest-landing/pending.html"
            },
            auto_return: "approved"
        });

        return res.status(200).json({
            ok: true,
            init_point: preference.init_point,
            sandbox_init_point: preference.sandbox_init_point
        });

    } catch (error) {
        console.error("Mercado Pago error:", error);
        return res.status(500).json({
            ok: false,
            error: error.message
        });
    }
}
