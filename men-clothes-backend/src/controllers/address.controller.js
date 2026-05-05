import * as addressService from '../services/address.service.js';

export const getUserAddresses = async (req, res) => {
  try {
    const addresses = await addressService.getAddressesByUser(req.user.id);
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAddress = async (req, res) => {
  try {
    const address = await addressService.createAddress(req.user.id, req.body);
    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const address = await addressService.updateAddress(req.params.id, req.user.id, req.body);
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    await addressService.deleteAddress(req.params.id, req.user.id);
    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const address = await addressService.setDefaultAddress(req.params.id, req.user.id);
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};