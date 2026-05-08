import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal, faTruck, faHeadset, faEnvelope, faPhone, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import api from '../lib/api';
import ProductCard from '../components/product/ProductCard';
import PageTransition from '../components/ui/PageTransition';

export default function Home() {
  const location = useLocation();
  const [featured, setFeatured] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/api/products?limit=4'), api.get('/api/products/brands')])
      .then(([productsRes, brandsRes]) => { setFeatured(productsRes.data); setBrands(brandsRes.data); })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (location.hash === '#featured-products') document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
    else if (location.hash === '#about') document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    else if (location.hash === '#contact') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  }, [location]);

  return (
    <PageTransition>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5 mix-blend-overlay"></div>
        <div className="container-premium py-24 md:py-32 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-serif font-light tracking-wide">Men's Fashion Collection</h1>
          <p className="text-xl text-brand-100 mt-4">Discover timeless elegance and modern style</p>
          <Link to="/shop" className="inline-block bg-white text-brand-900 px-8 py-3 rounded-full font-medium hover:bg-brand-50 transition mt-8 shadow-lg">Shop Now</Link>
        </div>
      </div>

      {/* Brand Strip */}
      {brands.length > 0 && (
        <div className="bg-premium-light py-12 border-b border-brand-100">
          <div className="container-premium">
            <p className="text-center text-xs font-semibold tracking-wider text-brand-400 uppercase mb-6">Shop by Brand</p>
            <div className="flex flex-wrap justify-center items-center gap-6">
              {brands.map((brand) => (
                <Link key={brand.id} to={`/shop?brandId=${brand.id}`} className="px-6 py-2 text-sm font-medium text-brand-700 bg-white border border-brand-200 rounded-full shadow-sm hover:shadow-md transition">
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Products */}
      <div id="featured-products" className="bg-white py-16">
        <div className="container-premium">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest text-brand-400 uppercase">Curated Selection</span>
            <h2 className="text-3xl md:text-4xl font-light text-brand-800 mt-2">Featured Collection</h2>
            <div className="w-12 h-px bg-brand-300 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          <div className="flex justify-center mt-12">
            <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 border-b border-brand-300 pb-1 hover:text-brand-800 hover:border-brand-800 transition">
              VIEW ALL PRODUCTS
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ABOUT */}
      <div id="about" className="bg-premium-light py-20 border-t border-brand-100">
        <div className="container-premium">

          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-widest text-brand-400 uppercase">Who We Are</span>
            <h2 className="text-3xl md:text-4xl font-light text-brand-800 mt-2">Our Story</h2>
            <div className="w-12 h-px bg-brand-300 mx-auto mt-4" />
          </div>

          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-brand-600 text-lg leading-relaxed mb-5">
              Founded with a passion for timeless design and superior craftsmanship, Men's Store brings a carefully curated selection of premium apparel to Cambodia. Every piece is chosen to elevate your wardrobe — blending classic elegance with modern comfort.
            </p>
            <p className="text-brand-500 text-base leading-relaxed">
              We believe that dressing well is a form of self-respect. From refined basics to statement pieces, our collection is built for men who know exactly what they want.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { num: '500+', label: 'Products Available' },
              { num: '10K+', label: 'Happy Customers' },
              { num: '100%', label: 'Authentic Pieces' },
            ].map((s, i) => (
              <div key={i} className="text-center py-8 px-6 bg-white border border-brand-100 rounded-xl shadow-sm">
                <p className="text-3xl font-light text-brand-900 mb-1">{s.num}</p>
                <p className="text-xs font-semibold tracking-widest text-brand-400 uppercase">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            {[
              {
                icon: faMedal,
                title: 'Premium Quality',
                desc: 'Every item is carefully selected to meet the highest standards of quality and craftsmanship.',
              },
              {
                icon: faTruck,
                title: 'Fast Delivery',
                desc: 'We ensure your orders arrive quickly and safely, right to your doorstep.',
              },
              {
                icon: faHeadset,
                title: 'Customer First',
                desc: 'Your satisfaction is our priority — we are always here to help and support you.',
              },
            ].map((v, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 bg-white border border-brand-100 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={v.icon} className="text-brand-600 text-lg" />
                </div>
                <h3 className="text-sm font-semibold text-brand-800 mb-2 tracking-wide uppercase">{v.title}</h3>
                <p className="text-brand-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* CONTACT */}
      <div id="contact" className="bg-white py-16 border-t border-brand-100">
        <div className="container-premium">

          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest text-brand-400 uppercase">Reach Out</span>
            <h2 className="text-3xl md:text-4xl font-light text-brand-800 mt-2">Get in Touch</h2>
            <div className="w-12 h-px bg-brand-300 mx-auto mt-4" />
            <p className="text-brand-500 text-base mt-4 max-w-md mx-auto">
              We'd love to hear from you. Whether it's a question, feedback, or just to say hello — reach out anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                icon: faEnvelope,
                label: 'Email',
                value: 'support@mensstore.com',
                sub: 'Reply within 24 hours',
              },
              {
                icon: faPhone,
                label: 'Phone',
                value: '+855 96 365 9813',
                sub: 'Mon – Sat, 9am – 6pm',
              },
              {
                icon: faLocationDot,
                label: 'Location',
                value: 'Phnom Penh, Cambodia',
                sub: 'Visit us in store',
              },
            ].map((c, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 bg-premium-light border border-brand-100 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 bg-white border border-brand-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <FontAwesomeIcon icon={c.icon} className="text-brand-600 text-lg" />
                </div>
                <p className="text-xs font-semibold tracking-widest text-brand-400 uppercase mb-2">{c.label}</p>
                <p className="text-brand-800 font-medium text-sm mb-1">{c.value}</p>
                <p className="text-brand-400 text-xs">{c.sub}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

    </PageTransition>
  );
}