import { ApiError } from './errorMiddleware.js';

const addressFields = ['fullName', 'address', 'city', 'postalCode', 'country'];

export function validateOrderBody(req, _res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(new ApiError(400, 'Request body must be a JSON object.'));
  }

  const errors = [];
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    errors.push('items must be a non-empty array with no more than 50 entries.');
  } else {
    body.items.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`items[${index}] must be an object.`);
        return;
      }
      if (typeof item.book !== 'string' || !item.book.trim()) {
        errors.push(`items[${index}].book is required.`);
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        errors.push(`items[${index}].quantity must be a whole number from 1 to 99.`);
      }
    });
  }

  if (!body.shippingAddress || typeof body.shippingAddress !== 'object' || Array.isArray(body.shippingAddress)) {
    errors.push('shippingAddress must be an object.');
  } else {
    for (const field of addressFields) {
      if (typeof body.shippingAddress[field] !== 'string' || !body.shippingAddress[field].trim()) {
        errors.push(`shippingAddress.${field} is required.`);
      }
    }
    const lengths = { fullName: [2, 100], address: [4, 200], city: [2, 100], postalCode: [2, 30], country: [2, 100] };
    for (const [field, [minLength, maxLength]] of Object.entries(lengths)) {
      if (typeof body.shippingAddress[field] === 'string' &&
          (body.shippingAddress[field].trim().length < minLength || body.shippingAddress[field].trim().length > maxLength)) {
        errors.push(`shippingAddress.${field} must be between ${minLength} and ${maxLength} characters.`);
      }
    }
  }

  if (errors.length) {
    return next(new ApiError(400, 'Please check the order information.', errors));
  }
  return next();
}

export function validateOrderStatus(req, _res, next) {
  const validStatuses = ['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(req.body?.status)) {
    return next(new ApiError(400, `status must be one of: ${validStatuses.join(', ')}.`));
  }
  return next();
}
