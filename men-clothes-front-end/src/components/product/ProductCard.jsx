import { Link } from 'react-router-dom';
import { Eye, ShoppingBag } from 'lucide-react';

export default function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/600x750?text=No+Image';

  return (
    <Link to={`/product/${product.id}`} className="group block">
      {/* Image */}
      <div className="relative overflow-hidden bg-brand-50" style={{ borderRadius: '16px' }}>
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full aspect-[3/4] object-cover transition duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400" />

        {/* Top badge */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 translate-y-[-4px] group-hover:translate-y-0 transition-all duration-300">
          <span className="bg-white/90 backdrop-blur-sm text-brand-900 text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
            {product.brand?.name}
          </span>
        </div>

        {/* Quick View button */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
          <span className="bg-white text-brand-900 text-xs font-semibold uppercase tracking-widest px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
            <Eye className="w-3.5 h-3.5" /> Quick View
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 px-1">
        <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-1">
          {product.brand?.name}
        </p>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-brand-800 group-hover:text-brand-600 transition-colors duration-200 line-clamp-1 leading-snug flex-1">
            {product.name}
          </h3>
          <p className="text-sm font-semibold text-brand-900 whitespace-nowrap">
            ${product.price}
          </p>
        </div>
        {/* Animated underline */}
        <div className="mt-2 h-px bg-brand-200 w-0 group-hover:w-full transition-all duration-500 ease-out" />
      </div>
    </Link>
  );
}