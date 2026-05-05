import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { OrderSkeleton } from '../components/ui/Skeleton';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/orders/me');
      setOrders(res.data);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      SHIPPED: 'bg-blue-100 text-blue-800',
      DELIVERED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">My Orders</h1>
          <div className="space-y-6">{[...Array(3)].map((_, i) => <OrderSkeleton key={i} />)}</div>
        </div>
      </div>
    );
  }

  if (error) return <div className="py-20 text-center text-red-500">{error}</div>;
  if (orders.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-light text-gray-800 mb-4">No orders yet</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't placed any orders.</p>
        <Link to="/shop" className="inline-block bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800 transition">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">My Orders</h1>
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div><p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p><p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p></div>
                <div className="flex gap-4 items-center"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>{order.status}</span><span className="text-lg font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</span></div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map((item) => {
                    const imageUrl = item.product.images?.[0] || 'https://via.placeholder.com/80x80?text=No+Image';
                    return (
                      <div key={item.id} className="flex gap-4 items-center bg-gray-50/40 rounded-xl p-3 hover:bg-gray-100/50 transition">
                        <img src={imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between gap-2">
                            <div><h4 className="font-medium text-gray-900">{item.product.name}</h4><p className="text-sm text-gray-500">{item.variant.size} / {item.variant.color}</p><p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p></div>
                            <div className="text-right"><p className="font-medium text-gray-900">${(item.priceAtTime * item.quantity).toFixed(2)}</p><p className="text-xs text-gray-400">${item.priceAtTime} each</p></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-gray-50/80 px-6 py-3 border-t border-gray-100 flex justify-end">
                <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-4 py-1 rounded-full border border-gray-200 hover:border-gray-400">Reorder</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}