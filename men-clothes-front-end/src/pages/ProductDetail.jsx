import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Minus, Plus, Truck, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/products/${id}`);
      setProduct(res.data);
      if (res.data.variants?.length > 0) setSelectedVariant(res.data.variants[0]);
    } catch (error) {
      console.error('Error fetching product', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem(product, selectedVariant, quantity);
    toast.success(`Added ${quantity} × ${product.name} (${selectedVariant.size} / ${selectedVariant.color}) to cart`);
  };

  const nextImage = () => setActiveImage((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + allImages.length) % allImages.length);

  if (loading) return <div className="py-20 text-center text-brand-400 text-sm tracking-widest uppercase">Loading...</div>;
  if (!product) return <div className="py-20 text-center text-brand-400 text-sm">Product not found</div>;

  const allImages = product.images?.length ? product.images : ['https://via.placeholder.com/800x1000?text=No+Image'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-900 transition mb-8 group uppercase tracking-widest font-medium"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">

        {/* ── LEFT: Image Gallery ── */}
        <div className="lg:w-[45%] flex gap-3">

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[500px]">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  style={{
                    borderRadius: 10,
                    width: 72,
                    height: 90,
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: activeImage === idx ? '2px solid #d1ccc6' : '2px solid transparent',
                    opacity: activeImage === idx ? 1 : 0.55,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (activeImage !== idx) e.currentTarget.style.opacity = 0.9; }}
                  onMouseLeave={e => { if (activeImage !== idx) e.currentTarget.style.opacity = 0.55; }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="relative group flex-1">
            <div
              className="relative bg-brand-50 overflow-hidden"
              style={{ borderRadius: 16, aspectRatio: '3/4', maxHeight: 500 }}
            >
              <img
                src={allImages[activeImage]}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              />

              {/* Nav arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4 text-brand-900" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4 text-brand-900" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`rounded-full transition-all duration-300 ${activeImage === idx
                        ? 'w-4 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-white/50'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Product Info ── */}
        <div className="lg:w-[55%]">
          <div className="sticky top-24 space-y-5">

            {/* Brand & Category */}
            <div className="flex items-center gap-2 text-xs text-brand-400 uppercase tracking-widest font-semibold">
              <span>{product.brand?.name}</span>
              <span className="w-1 h-1 bg-brand-300 rounded-full" />
              <span>{product.category?.name}</span>
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-light text-brand-900 leading-snug">
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-2xl font-semibold text-brand-900">${product.price}</p>

            {/* Divider */}
            <div className="h-px bg-brand-100" />

            {/* Description */}
            <p className="text-brand-500 text-sm leading-relaxed">
              {product.description || 'A timeless piece crafted for style and comfort. Perfect for any occasion.'}
            </p>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-brand-800 uppercase tracking-widest">Size & Color</h3>
                  {selectedVariant?.stock > 0 && (
                    <span className="text-xs text-brand-400">{selectedVariant.stock} in stock</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => { setSelectedVariant(variant); setQuantity(1); }}
                      disabled={variant.stock === 0}
                      className={`px-4 py-2 text-xs font-medium rounded-full border transition-all duration-200 ${selectedVariant?.id === variant.id
                        ? 'bg-brand-900 text-white border-brand-900'
                        : 'bg-white text-brand-700 border-brand-200 hover:border-brand-500'
                        } ${variant.stock === 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    >
                      {variant.size} / {variant.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex gap-3 pt-2">
              {/* Quantity */}
              <div className="flex items-center border border-brand-200 rounded-full overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-11 flex items-center justify-center text-brand-600 hover:text-brand-900 disabled:opacity-30 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-medium text-brand-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))}
                  disabled={!selectedVariant || quantity >= (selectedVariant?.stock || 99)}
                  className="w-10 h-11 flex items-center justify-center text-brand-600 hover:text-brand-900 disabled:opacity-30 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="flex-1 bg-brand-900 text-white text-sm font-medium rounded-full hover:bg-brand-800 transition disabled:bg-brand-300 disabled:cursor-not-allowed"
              >
                {selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            {/* Shipping & Warranty */}
            <div className="border-t border-brand-100 pt-5">
              <div className="flex items-center gap-6 text-xs text-brand-400">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Free shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>2-year warranty</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}