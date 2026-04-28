import { AnimatePresence, motion } from "framer-motion";

type SearchOverlayProps = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedName?: string;
  relatedLoading: boolean;
  onResetFocus: () => void;
  onZoomSelected: () => void;
  canZoomSelected: boolean;
};

export default function SearchOverlay({
  query,
  onQueryChange,
  selectedName,
  relatedLoading,
  onResetFocus,
  onZoomSelected,
  canZoomSelected
}: SearchOverlayProps) {
  return (
    <motion.aside
      className="depth-search-overlay"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <label>
        Search Products
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Try rose, mist, cedar..."
        />
      </label>

      <div className="depth-action-row">
        <button type="button" onClick={onResetFocus}>
          Back to overview
        </button>
        <button type="button" onClick={onZoomSelected} disabled={!canZoomSelected}>
          Zoom selected
        </button>
      </div>

      <AnimatePresence mode="wait">
        {relatedLoading ? (
          <motion.p
            key="loading"
            className="depth-loading"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            Loading related products...
          </motion.p>
        ) : selectedName ? (
          <motion.p
            key="selected"
            className="depth-selected"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            Focused: {selectedName}
          </motion.p>
        ) : (
          <motion.p
            key="hint"
            className="depth-selected"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            Click a product to hold focus. Use scroll to drift through the set.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
