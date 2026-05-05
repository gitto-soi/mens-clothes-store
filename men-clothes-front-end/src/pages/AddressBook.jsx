import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, MapPin, Phone, X } from 'lucide-react';
import api from '../lib/api';

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    country: 'Cambodia',
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/addresses');
      setAddresses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setForm({
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        address: address.address,
        city: address.city,
        country: address.country,
        isDefault: address.isDefault,
      });
    } else {
      setEditingAddress(null);
      setForm({ firstName: '', lastName: '', phone: '', address: '', city: '', country: 'Cambodia', isDefault: false });
    }
    setShowModal(true);
  };

  const saveAddress = async () => {
    try {
      if (editingAddress) {
        await api.put(`/api/addresses/${editingAddress.id}`, form);
      } else {
        await api.post('/api/addresses', form);
      }
      setShowModal(false);
      fetchAddresses();
    } catch (err) {
      alert('Failed to save address');
    }
  };

  const deleteAddress = async (id) => {
    if (confirm('Delete this address?')) {
      await api.delete(`/api/addresses/${id}`);
      fetchAddresses();
    }
  };

  const setDefault = async (id) => {
    await api.patch(`/api/addresses/${id}/default`);
    fetchAddresses();
  };

  if (loading) return <div className="py-20 text-center">Loading addresses...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-light text-gray-900">Address Book</h1>
        <button onClick={() => openModal()} className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
          No saved addresses. Click "Add Address" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{addr.firstName} {addr.lastName}</p>
                    {addr.isDefault && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                    <MapPin className="w-3.5 h-3.5" /> {addr.address}, {addr.city}, {addr.country}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <Phone className="w-3.5 h-3.5" /> {addr.phone}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(addr)} className="p-1 text-gray-400 hover:text-gray-700"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteAddress(addr.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  {!addr.isDefault && <button onClick={() => setDefault(addr.id)} className="p-1 text-gray-400 hover:text-yellow-500"><Star className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">{editingAddress ? 'Edit Address' : 'Add Address'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="First name" className="w-full border rounded-lg px-3 py-2" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
              <input type="text" placeholder="Last name" className="w-full border rounded-lg px-3 py-2" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
              <input type="tel" placeholder="Phone number" className="w-full border rounded-lg px-3 py-2" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input type="text" placeholder="Street address" className="w-full border rounded-lg px-3 py-2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              <input type="text" placeholder="City" className="w-full border rounded-lg px-3 py-2" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              <select className="w-full border rounded-lg px-3 py-2" value={form.country} onChange={e => setForm({...form, country: e.target.value})}>
                <option>Cambodia</option><option>Thailand</option><option>Vietnam</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} />
                Set as default address
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-full">Cancel</button>
              <button onClick={saveAddress} className="px-4 py-2 bg-gray-900 text-white rounded-full">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}