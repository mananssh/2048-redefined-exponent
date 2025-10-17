import React from 'react';
import { motion } from 'framer-motion';

type TileProps = {
    value: number;
    structured_color_output?: Record<string, string>; // "RRGGBB,RRGGBB"
};

/**
 * Tile component
 * - Uses structured_color_output palette if provided.
 * - Normalizes both bg and text colors returned without '#' and applies them.
 */
const Tile: React.FC<TileProps> = ({ value, structured_color_output }) => {
    const getPaletteKey = (val: number) => {
        if (val <= 4) return 'below4';
        if (val <= 8) return 'below8';
        if (val <= 16) return 'below16';
        if (val <= 64) return 'below64';
        if (val <= 256) return 'below256';
        if (val <= 1024) return 'below1024';
        return 'above1024';
    };

    let bgColor = '#FFFFFF';
    let textColor = '#000000';

    if (structured_color_output) {
        const raw = structured_color_output[getPaletteKey(value)]; // "RRGGBB,RRGGBB"
        if (raw) {
            const [bg, text] = raw.split(',');
            bgColor = bg.startsWith('#') ? bg : `#${bg}`;
            textColor = text.startsWith('#') ? text : `#${text}`;
        }
    }

    // Font scaling
    const digits = String(value).length;
    const fontSize = digits <= 2 ? 36 : digits === 3 ? 30 : digits === 4 ? 24 : digits === 5 ? 20 : 16;

    return (
        <motion.div
            role="img"
            aria-label={`Tile ${value}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-full h-full rounded-md flex items-center justify-center shadow-md select-none"
            style={{ backgroundColor: bgColor, color: textColor, padding: '0.25rem' }}
        >
            <span
                style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: 1,
                    fontWeight: 700,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    padding: '0 .25rem',
                }}
            >
                {value}
            </span>
        </motion.div>
    );
};

export default Tile;
