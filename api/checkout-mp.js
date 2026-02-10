// api/checkout-mp.js
import mercadopago from "mercadopago";

// Configura Mercado Pago con tu ACCESS TOKEN
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
    try {
        const { package_id, email } = req.query;

        if (!package_id || !email) {
            return res.status(400).json({
                ok: false,
                error: "Faltan parámetros: package_id o email",
            });
        }

        // Paquetes (puedes luego moverlos a DB)
        const packages = {
            PAQ1: {
                title: "Licencia Mensual Básica – Spelling Bee Contest",
                price: 250,
            },
            PAQ2: {
                title: "Licencia Institucional Anual – Spelling Bee Contest",
                price: 1550,
            },
            PAQ3: {
                title: "Licencia Perpetua Personalizada – Spelling Bee Contest",
                price: 3500,
            },
        };

        const selectedPackage = packages[package_id];

        if (!selectedPackage) {
            return res.status(404).json({
                ok: false,
                error: "Paquete no encontrado",
            });
        }

        const preference = {
            items: [
                {
                    title: selectedPackage.title,
                    quantity: 1,
                    currency_id: "MXN",
                    unit_price: selectedPackage.price,
                },
            ],
            payer: {
                email,
            },
            back_urls: {
                success: "https://aletostudios.github.io/spelling-bee-contest-landing/success.html",
                failure: "https://aletostudios.github.io/spelling-bee-contest-landing/error.html",
                pending: "https://aletostudios.github.io/spelling-bee-contest-landing/pending.html",
            },
            auto_return: "approved",
            metadata: {
                package_id,
                email,
            },
        };

        const response = await mercadopago.preferences.create(preference);

        return res.status(200).json({
            ok: true,
            init_point: response.body.init_point, // Producción
            sandbox_init_point: response.body.sandbox_init_point, // Pruebas
        });

    } catch (error) {
        console.error("Mercado Pago error:", error);

        return res.status(500).json({
            ok: false,
            error: "Error creando preferencia de pago",
            detail: error.message,
        });
    }
}
