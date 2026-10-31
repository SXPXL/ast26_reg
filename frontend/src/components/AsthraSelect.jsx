import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * AsthraSelect - Luxury Aztec Gold Custom Dropdown Component
 * Replaces native HTML <select> with a branded, accessible, theme-consistent dropdown.
 */
export default function AsthraSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  icon: LeadingIcon,
  searchable = false,
  searchPlaceholder = 'Search options...',
  height = '42px',
  minWidth,
  style = {},
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        (o.label || '').toLowerCase().includes(q) ||
        (o.shortLabel || '').toLowerCase().includes(q)
    );
  }, [options, searchable, search]);

  const SelectedIcon = selectedOption?.icon || LeadingIcon;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        width: '100%',
        minWidth: minWidth || 'auto',
        userSelect: 'none',
        ...style,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: height,
          padding: '0.55rem 0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          background: '#0d0d16',
          border: isOpen
            ? '1.5px solid var(--gold-bright)'
            : '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '12px',
          color: 'var(--text-white)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen
            ? '0 0 16px rgba(212, 175, 55, 0.25)'
            : '0 4px 14px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none',
          textAlign: 'left',
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isOpen && !disabled) {
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(212, 175, 55, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen && !disabled) {
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.35)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.4)';
          }
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {SelectedIcon && (
            <SelectedIcon
              size={16}
              color={selectedOption?.color || '#D4AF37'}
              style={{ flexShrink: 0 }}
            />
          )}

          <span
            style={{
              fontSize: '0.84rem',
              fontWeight: '600',
              color: selectedOption ? 'var(--text-white)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {selectedOption?.shortLabel || selectedOption?.label || placeholder}
          </span>

          {selectedOption?.badge && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: '700',
                padding: '0.12rem 0.45rem',
                borderRadius: '6px',
                background: `${selectedOption.badgeColor || '#D4AF37'}1A`,
                color: selectedOption.badgeColor || '#D4AF37',
                border: `1px solid ${selectedOption.badgeColor || '#D4AF37'}40`,
                flexShrink: 0,
              }}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={15}
          color="#D4AF37"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 80,
            background: 'rgba(13, 13, 22, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(212, 175, 55, 0.45)',
            borderRadius: '14px',
            boxShadow:
              '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(212, 175, 55, 0.15)',
            padding: '0.4rem',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {searchable && (
            <div style={{ padding: '0.35rem 0.35rem 0.5rem 0.35rem' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  height: '34px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '8px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-white)',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: '0.85rem',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              No matching options
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              const OptIcon = opt.icon || LeadingIcon;
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(170, 124, 17, 0.3) 100%)'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(212, 175, 55, 0.45)'
                      : '1px solid transparent',
                    color: isSelected ? 'var(--gold-bright)' : 'var(--text-white)',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? '700' : '500',
                    transition: 'all 0.15s ease',
                    marginBottom: '0.2rem',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.09)';
                      e.currentTarget.style.color = 'var(--gold-bright)';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-white)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    {OptIcon && (
                      <OptIcon
                        size={15}
                        color={isSelected ? '#D4AF37' : opt.color || '#9CA3AF'}
                        style={{ flexShrink: 0 }}
                      />
                    )}
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: '700',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '5px',
                          background: `${opt.badgeColor || '#D4AF37'}1A`,
                          color: opt.badgeColor || '#D4AF37',
                          border: `1px solid ${opt.badgeColor || '#D4AF37'}40`,
                          flexShrink: 0,
                        }}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={14} color="#D4AF37" style={{ flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

