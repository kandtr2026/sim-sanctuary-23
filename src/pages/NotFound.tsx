import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Home, Phone, Search } from "lucide-react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const suggestions = [
  { label: "Kho SIM số đẹp", to: "/" },
  { label: "SIM đồng giá 229K", to: "/mua-sim-gia-re" },
  { label: "SIM phong thủy", to: "/sim-phong-thuy" },
  { label: "SIM tứ quý", to: "/mua-sim-tu-quy" },
  { label: "Định giá SIM", to: "/dinh-gia-sim" },
  { label: "Hướng dẫn thanh toán", to: "/thanh-toan" },
];

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Không tìm thấy trang (404) | CHONSOMOBIFONE.COM</title>
        <meta name="robots" content="noindex, follow" />
        <meta
          name="description"
          content="Đường dẫn không tồn tại hoặc đã được thay đổi. Quay lại kho SIM số đẹp CHONSOMOBIFONE.COM để tiếp tục chọn số."
        />
      </Helmet>

      <Header />
      <Navigation />

      <main className="container mx-auto flex-1 px-4 py-12 md:py-16">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-6xl md:text-7xl font-black text-primary leading-none">404</p>

          <h1 className="mt-4 text-xl md:text-2xl font-bold text-gold">
            Rất tiếc, không tìm thấy trang này
          </h1>

          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            Đường dẫn <span className="text-foreground/80 break-all">{location.pathname}</span> không tồn tại
            hoặc đã được thay đổi. Quý khách vui lòng chọn một trong các mục bên dưới, hoặc gọi hotline để được
            tư vấn chọn số trực tiếp.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Home className="h-4 w-4" />
              Về trang chủ
            </Link>
            <a
              href="tel:0938868868"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-header-bg transition-colors hover:bg-gold/90"
            >
              <Phone className="h-4 w-4" />
              Gọi 0938.868.868
            </a>
          </div>

          <div className="mt-10 rounded-xl border border-border bg-card p-5 text-left">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Search className="h-4 w-4 text-gold" />
              Có thể Quý khách đang tìm:
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestions.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="block rounded-lg border border-border/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
