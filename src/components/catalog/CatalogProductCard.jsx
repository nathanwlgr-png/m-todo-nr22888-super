import React from 'react';
import { Check, Image as ImageIcon } from 'lucide-react';

export default function CatalogProductCard({ product, selected, disabled, onToggle }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(product)}
      className="w-full overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition active:scale-[0.99] disabled:opacity-60"
      aria-pressed={selected}
    >
      <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-3" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-9 w-9" />
            <span className="text-xs">Foto em breve</span>
          </div>
        )}
      </div>
      <div className="flex min-h-20 items-center gap-3 p-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${selected ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
          {selected && <Check className="h-4 w-4" />}
        </span>
        <div>
          <p className="font-semibold leading-tight text-foreground">{product.name}</p>
          {product.category && <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>}
        </div>
      </div>
    </button>
  );
}