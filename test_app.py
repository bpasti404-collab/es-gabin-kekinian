from pathlib import Path
import json
import unittest

ROOT = Path(__file__).parent


class OrderingPwaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text()
        cls.js = (ROOT / "app.js").read_text()
        cls.css = (ROOT / "styles.css").read_text()
        cls.worker = (ROOT / "sw.js").read_text()
        cls.manifest = json.loads((ROOT / "manifest.json").read_text())

    def test_ordering_and_footer_essentials_exist(self):
        for text in ("Es Gabin", "Es Krim Cemil", "Pesan via WhatsApp", "Ambil di Tempat", "Antar", "customer-address", "customer-notes"):
            with self.subTest(text=text):
                self.assertIn(text, self.html)
        self.assertIn("https://wa.me/${APP_CONFIG.whatsappNumber}", self.js)
        self.assertIn('message.join("\n")', self.js)

    def test_menu_has_all_flavors_and_sizes(self):
        for flavor in ("Mangga", "Matcha", "Coklat", "Stroberi", "Vanilla"):
            with self.subTest(flavor=flavor):
                self.assertIn(f'flavor: "{flavor}"', self.js)
        self.assertIn('price: 5000', self.js)
        self.assertIn('label: "Kecil", price: 3000', self.js)
        self.assertIn('label: "Besar", price: 5000', self.js)
        self.assertIn("Meses warna-warni", self.js)

    def test_hours_and_editable_business_config(self):
        self.assertIn('openingHours: "09:00-16:00 WIB setiap hari"', self.js)
        expected_config = (
            'location: "Ngepoh Kidul, Balepanjang"',
            'instagramUrl: "https://instagram.com/esgabinkekinian"',
            'tiktokUrl: "https://tiktok.com/@esgabinkekinian"',
        )
        for value in expected_config:
            with self.subTest(value=value):
                self.assertIn(value, self.js)
        self.assertIn('textContent = APP_CONFIG.openingHours', self.js)
        self.assertIn('textContent = APP_CONFIG.location', self.js)
        self.assertIn('href = APP_CONFIG.instagramUrl', self.js)
        self.assertIn('href = APP_CONFIG.tiktokUrl', self.js)
        self.assertIn('Es Gabin Kekinian · Instagram', self.html)
        self.assertIn('Es Gabin Kekinian · TikTok', self.html)

    def test_pwa_manifest_worker_and_icons(self):
        self.assertEqual(self.manifest["display"], "standalone")
        self.assertEqual(len(self.manifest["icons"]), 2)
        self.assertIn("caches.match(event.request)", self.worker)
        self.assertIn('const CACHE_NAME = "es-gabin-v4"', self.worker)
        for icon in ("icons/icon-192.png", "icons/icon-512.png"):
            with self.subTest(icon=icon):
                self.assertTrue((ROOT / icon).is_file())
                self.assertGreater((ROOT / icon).stat().st_size, 100)

    def test_seo_metadata_and_structured_data(self):
        self.assertIn('<html lang="id">', self.html)
        self.assertIn('<link rel="canonical" href="https://bpasti404-collab.github.io/es-gabin-kekinian/">', self.html)
        for tag in ('property="og:title"', 'property="og:description"', 'property="og:url"', 'property="og:image"', 'name="twitter:card"', 'name="twitter:image"'):
            with self.subTest(tag=tag):
                self.assertIn(tag, self.html)
        self.assertIn('https://bpasti404-collab.github.io/es-gabin-kekinian/icons/icon-512.png', self.html)
        self.assertIn('"@type": "IceCreamShop"', self.html)
        self.assertIn('"openingHours": "Mo-Su 09:00-16:00"', self.html)
        self.assertIn('"telephone": "+628979199244"', self.html)
        self.assertIn('"priceRange": "Rp3.000-Rp5.000"', self.html)

    def test_robots_sitemap_and_business_profile_guide(self):
        robots = (ROOT / "robots.txt").read_text()
        sitemap = (ROOT / "sitemap.xml").read_text()
        guide = (ROOT / "google-business-profile.md").read_text()
        self.assertIn('Sitemap: https://bpasti404-collab.github.io/es-gabin-kekinian/sitemap.xml', robots)
        self.assertIn('<loc>https://bpasti404-collab.github.io/es-gabin-kekinian/</loc>', sitemap)
        for text in ('Toko es krim', '09.00–16.00', '+62 897-9199-244', 'business.google.com', 'search-console'):
            with self.subTest(text=text):
                self.assertIn(text, guide)

    def test_mobile_layout_and_install_hint(self):
        self.assertIn("id=\"install-hint\"", self.html)
        self.assertIn("@media(max-width:760px)", self.css)
        self.assertIn('id="product-grid"', self.html)


if __name__ == "__main__":
    unittest.main()
