'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ProductForm from '@/components/ProductForm';
import { Spinner, ErrorBox } from '@/components/ui';

export default function EditProductPage({ params }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/admin/products/${params.id}`)
      .then((d) => setProduct(d.product))
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <ErrorBox message={error} />;
  if (!product) return <Spinner />;

  return (
    <div>
      <h1 className="mb-6 text-3xl">Edit product</h1>
      <ProductForm product={product} />
    </div>
  );
}
