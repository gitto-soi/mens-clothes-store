import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import useWishlistStore from '../store/wishlistStore';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { items, loading, fetchWishlist, removeFromWishlist } = useWishlistStore();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleAddToCart = (product) => {
    const variant = product.variants?.find((v) => v.stock > 0);

    if (!variant) {
      toast.error('No available variant');
      return;
    }

    addItem(product, variant, 1);
    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm uppercase tracking-widest text-brand-400">
        Loading wishlist...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-light text-brand-900">My Wishlist</h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <Heart className="w-10 h-10 mx-auto text-gray-300 mb-4" />
          <p className="text-brand-700 font-medium">Your wishlist is empty</p>
          <p className="text-sm text-brand-400 mt-1">
            Save your favorite products here.
          </p>

          <Link
            to="/shop"
            className="inline-flex mt-6 bg-brand-900 text-white px-6 py-2.5 rounded-full text-sm hover:bg-brand-800 transition"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {items.map((product) => {
            const imageUrl =
              product.images?.[0] ||
              'https://via.placeholder.com/600x750?text=No+Image';

            return (
              <div key={product.id} className="group">
                <Link to={`/product/${product.id}`} className="block">
                  <div className="relative overflow-hidden bg-brand-50 rounded-2xl">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full aspect-[3/4] object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                </Link>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-1">
                    {product.brand?.name}
                  </p>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-brand-900 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm font-semibold text-brand-900 mt-1">
                        ${product.price}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-4 w-full bg-brand-900 text-white text-sm rounded-full py-2.5 hover:bg-brand-800 transition flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}