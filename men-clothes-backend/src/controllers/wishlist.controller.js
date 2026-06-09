import * as wishlistService from '../services/wishlist.service.js';

export const getWishlist = async (req, res) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user.id);
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const result = await wishlistService.addToWishlist(
      req.user.id,
      req.params.productId
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to add wishlist' });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const result = await wishlistService.removeFromWishlist(
      req.user.id,
      req.params.productId
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove wishlist' });
  }
};